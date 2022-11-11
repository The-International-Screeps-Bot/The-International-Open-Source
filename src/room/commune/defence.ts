import { myColors, PlayerData, roomDimensions, safemodeTargets } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog, findObjectWithID, getRangeOfCoords, randomRange, randomTick } from 'international/utils'
import { packCoord } from 'other/packrat'
import { CommuneManager } from './communeManager'

export class DefenceManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const { room } = this.communeManager

        if (!room.enemyAttackers.length) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        this.advancedActivateSafeMode()
        this.manageRampartPublicity()
        this.assignDefenceTargets()
        this.handleThreat()

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Defense Manager', cpuUsed.toFixed(2), myColors.white, myColors.lightBlue)
            const statName: RoomCommuneStatNames = 'dmcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }

    private shouldActivatesSafeMode() {
        const { room } = this.communeManager
        const { controller } = room

        // If safeMode is on cooldown, stop

        if (controller.safeModeCooldown) return false

        // Otherwise if there are no safeModes left, stop

        if (!controller.safeModeAvailable) return false

        // Otherwise if the controller is upgradeBlocked, stop

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

            // If a rampart was destroyed above a spawn

            if (room.structureCoordsByType.spawn.has(packCoord(attackTarget.pos))) return true

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

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit
        })

        // If there are no enemyAttackers, try to publicize private ramparts 10 at a time

        if (!enemyAttackers.length) {
            if (!Memory.publicRamparts) return

            // Stop if the tick is not divisible by a random range

            if (!randomTick()) return

            // Publicize at most 10 ramparts per tick, to avoid too many intents

            let intents = 0

            for (const rampart of room.structures.rampart) {
                if (intents >= 10) return

                // If the rampart is public

                if (rampart.isPublic) continue

                // Otherwise set the rampart to public, increase increment

                rampart.setPublic(true)
                intents += 1
            }

            // Stop

            return
        }

        // If there are enemyAttackers, privitize all ramparts that are public

        for (const rampart of room.structures.rampart) if (rampart.isPublic) rampart.setPublic(false)
    }

    private assignDefenceTargets() {
        const { room } = this.communeManager

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
            const enemyCreep = findObjectWithID(enemyCreepID)

            for (const memberID of room.defenderEnemyTargetsWithDefender.get(enemyCreepID)) {
                if (!room.attackingDefenderIDs.has(memberID)) continue

                const member = Game.getObjectById(memberID)

                Game.creeps[member.name].combatTarget = enemyCreep

                room.attackingDefenderIDs.delete(memberID)
            }

            const damage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)

            if (damage > 0) {
                if (!room.towerAttackTarget) room.towerAttackTarget = enemyCreep
                else if (damage > room.defenderEnemyTargetsWithDamage.get(room.towerAttackTarget.id))
                    room.towerAttackTarget = enemyCreep
            }

            if (!room.attackingDefenderIDs.size) break
        }
    }

    createDefenceRequest() {
        const { room } = this.communeManager

        if (!room.towerInferiority) return

        let minDamage = 0
        let minHeal = 0

        for (const enemyCreep of room.enemyAttackers) {
            minDamage += enemyCreep.combatStrength.heal
            minHeal += enemyCreep.combatStrength.ranged
        }

        // There is tower inferiority, make a defend request

        room.createDefendCombatRequest({
            minDamage,
            minHeal,
            quadCount: 1,
        })
    }

    handleThreat() {
        const { room } = this.communeManager

        let totalThreat = 0
        let threatByPlayers: Map<string, number> = new Map()

        for (const enemyCreep of room.enemyAttackers) {

            let threat = 0

            threat += enemyCreep.combatStrength.dismantle
            threat += enemyCreep.combatStrength.melee
            threat += enemyCreep.combatStrength.ranged * 3

            threat += enemyCreep.combatStrength.heal / enemyCreep.defenceStrength

            threat = Math.floor(threat)
            totalThreat += threat

            const playerName = enemyCreep.owner.username
            if (playerName === 'Invader') continue

            const threatByPlayer = threatByPlayers.get(enemyCreep.owner.username)
            if (threatByPlayer) {

                threatByPlayers.set(playerName, threatByPlayer + threat)
                continue
            }

            threatByPlayers.set(playerName, threat)
        }

        for (const [playerName, threat] of threatByPlayers) {

            const player = Memory.players[playerName]

            player.data[PlayerData.offensiveStrength] = Math.max(threat, player.data[PlayerData.offensiveStrength])
            player.data[PlayerData.hate] = Math.max(threat, player.data[PlayerData.hate])
        }

        const roomMemory = Memory.rooms[room.name]

        if (totalThreat > 0) {
            roomMemory.AT = Math.max(roomMemory.AT, totalThreat)
            roomMemory.LAT = 0
        }

        roomMemory.AT -= 1 + roomMemory.LAT * 0.002
        roomMemory.LAT += 1
    }
}
