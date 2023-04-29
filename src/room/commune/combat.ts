import {
    CombatRequestKeys,
    customColors,
    PlayerMemoryKeys,
    roomDimensions,
    RoomMemoryKeys,
    safemodeTargets,
} from 'international/constants'
import { playerManager } from 'international/players'
import { allyManager } from 'international/simpleAllies'
import { updateStat } from 'international/statsManager'
import {
    customLog,
    findObjectWithID,
    findRangeFromExit,
    getRange,
    isXYInBorder,
    randomIntRange,
    randomRange,
    randomTick,
} from 'international/utils'
import { packCoord } from 'other/codec'
import { CommuneManager } from './commune'

export class CombatManager {
    communeManager: CommuneManager

    totalThreat: number
    threatByPlayers: Map<string, number>

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        this.advancedActivateSafeMode()
        this.manageRampartPublicity()
        this.assignDefenceTargets()

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Defense Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'dmcu'
            updateStat(this.communeManager.room.name, statName, cpuUsed)
        }
    }

    private shouldActivatesSafeMode() {
        const { room } = this.communeManager
        const { controller } = room

        // Conditions check

        if (controller.safeModeCooldown) return false
        if (!controller.safeModeAvailable) return false
        if (controller.upgradeBlocked) return false

        // Filter attackers that are not invaders. If there are none, stop

        const nonInvaderAttackers = room.enemyAttackers.filter(
            enemyCreep => !enemyCreep.isOnExit && enemyCreep.owner.username /* !== 'Invader' */,
        )

        if (!nonInvaderAttackers.length) return false

        // Otherwise if safeMode can be activated

        // Get the previous tick's events

        const eventLog = room.getEventLog()

        // Loop through each eventItem

        for (const eventItem of eventLog) {
            // If the event wasn't an attack, iterate

            if (eventItem.event !== EVENT_ATTACK) continue

            // Otherwise get the target of the attack

            const attackTarget = findObjectWithID(eventItem.data.targetId as Id<Structure | any>)

            // If the attackTarget isn't a structure, iterate

            if (!(attackTarget instanceof Structure)) continue

            const structuresAtCoord = room.roomManager.structureCoords.get(packCoord(attackTarget.pos))
            if (
                structuresAtCoord &&
                structuresAtCoord.find(ID => findObjectWithID(ID).structureType === STRUCTURE_SPAWN)
            )
                return true

            if (safemodeTargets.includes(attackTarget.structureType)) return true
        }

        return false
    }

    private advancedActivateSafeMode() {
        if (!this.shouldActivatesSafeMode()) return

        this.communeManager.room.controller.activateSafeMode()
    }

    private manageRampartPublicity() {
        const { room } = this.communeManager

        // If there are no enemies it is safe to publicize ramparts

        if (!room.enemyCreeps.length) {
            if (!Memory.publicRamparts) return

            // Wait some pseudo-random time before publicizing ramparts

            if (room.memory[RoomMemoryKeys.lastAttacked] < randomIntRange(100, 150)) return

            // Publicize at most 10 ramparts per tick, to avoid too many intents

            let intents = 0

            for (const rampart of room.roomManager.structures.rampart) {
                if (intents >= 10) return

                // If the rampart is public

                if (rampart.isPublic) continue

                // Otherwise set the rampart to public, increase increment

                rampart.setPublic(true)
                intents += 1
            }

            return
        }

        // If there are enemyAttackers, privitize all ramparts that are public

        for (const rampart of room.roomManager.structures.rampart) if (rampart.isPublic) rampart.setPublic(false)
    }

    private assignDefenceTargets() {
        const { room } = this.communeManager

        if (!room.enemyAttackers.length) return

        // Sort by estimated percent health change

        const defenderEnemyTargetsByDamage = Array.from(room.defenderEnemyTargetsWithDefender.keys()).sort((a, b) => {
            const creepA = findObjectWithID(a)
            const creepB = findObjectWithID(b)

            return (
                creepA.hits / creepA.hitsMax -
                (creepA.hits + room.defenderEnemyTargetsWithDamage.get(a)) / creepA.hitsMax -
                (creepB.hits / creepB.hitsMax -
                    (creepB.hits + room.defenderEnemyTargetsWithDamage.get(b)) / creepB.hitsMax)
            )
        })

        // Attack enemies in order of most members that can attack them

        for (const enemyCreepID of defenderEnemyTargetsByDamage) {
            if (!room.attackingDefenderIDs.size) break

            const enemyCreep = findObjectWithID(enemyCreepID)

            for (const memberID of room.defenderEnemyTargetsWithDefender.get(enemyCreepID)) {
                if (!room.attackingDefenderIDs.has(memberID)) continue

                const member = Game.getObjectById(memberID)

                Game.creeps[member.name].combatTarget = enemyCreep

                room.attackingDefenderIDs.delete(memberID)
            }

            if (room.towerAttackTarget) continue

            const damage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)
            room.visual.text(damage.toString(), enemyCreep.pos.x, enemyCreep.pos.y - 0.25, { font: 0.3 })

            if (enemyCreep.owner.username === 'Invader') {
                if (damage <= 0) continue
            } else if (damage * findRangeFromExit(enemyCreep.pos) < enemyCreep.hits) continue

            room.towerAttackTarget = enemyCreep
        }
    }

    manageDefenceRequests() {
        const { room } = this.communeManager

        if (!room.towerInferiority) return

        let onlyInvader = true
        let minDamage = 0
        let minMeleeHeal = 0
        let minRangedHeal = 0

        for (const enemyCreep of room.enemyAttackers) {
            minDamage += Math.max(enemyCreep.combatStrength.heal, Math.ceil(enemyCreep.hits / 50))
            minMeleeHeal += enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged
            minRangedHeal += enemyCreep.combatStrength.ranged

            if (onlyInvader && enemyCreep.owner.username !== 'Invader') onlyInvader = false
        }

        // There is tower inferiority, make a defend request

        room.createDefendCombatRequest({
            [CombatRequestKeys.minDamage]: minDamage,
            [CombatRequestKeys.minMeleeHeal]: minMeleeHeal,
            [CombatRequestKeys.minRangedHeal]: minRangedHeal,
            [CombatRequestKeys.quadQuota]: 1,
            [CombatRequestKeys.inactionTimerMax]: onlyInvader ? 1 : undefined,
        })

        if (Memory.allyPlayers) {
            allyManager.requestDefense(room.name, minDamage, minMeleeHeal, minRangedHeal, 1)
        }
    }

    private calculateThreat() {
        this.totalThreat = 0
        this.threatByPlayers = new Map()

        const { room } = this.communeManager

        if (!room.towerInferiority) return

        for (const enemyCreep of room.enemyAttackers) {
            let threat = 0

            threat += enemyCreep.combatStrength.dismantle
            threat += enemyCreep.combatStrength.melee * 1.2
            threat += enemyCreep.combatStrength.ranged * 3.5

            threat += enemyCreep.combatStrength.heal / enemyCreep.defenceStrength

            threat = Math.floor(threat)
            this.totalThreat += threat

            const playerName = enemyCreep.owner.username
            if (playerName === 'Invader') continue

            const threatByPlayer = this.threatByPlayers.get(enemyCreep.owner.username)
            if (threatByPlayer) {
                this.threatByPlayers.set(playerName, threatByPlayer + threat)
                continue
            }

            this.threatByPlayers.set(playerName, threat)
        }
    }

    manageThreat() {
        const { room } = this.communeManager

        this.calculateThreat()

        for (const [playerName, threat] of this.threatByPlayers) {
            let player = Memory.players[playerName]

            if (!player) {
                player = Memory.players[playerName] = {}
            }

            player[PlayerMemoryKeys.offensiveThreat] = Math.max(threat, player[PlayerMemoryKeys.offensiveThreat])
            player[PlayerMemoryKeys.hate] = Math.max(threat, player[PlayerMemoryKeys.hate])

            player[PlayerMemoryKeys.lastAttacked] = 0
        }

        const roomMemory = Memory.rooms[room.name]

        if (this.totalThreat > 0) {
            roomMemory[RoomMemoryKeys.threatened] = Math.max(
                roomMemory[RoomMemoryKeys.threatened],
                this.totalThreat,
                playerManager.highestThreat / 2,
            )
            roomMemory[RoomMemoryKeys.lastAttacked] = 0
        }

        // Reduce attack threat over time

        if (roomMemory[RoomMemoryKeys.threatened] > 0) roomMemory[RoomMemoryKeys.threatened] *= 0.99999

        roomMemory[RoomMemoryKeys.lastAttacked] += 1
    }
}
