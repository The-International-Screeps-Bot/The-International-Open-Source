import {
    CombatRequestKeys,
    customColors,
    defaultDataDecay,
    impassibleStructureTypes,
    impassibleStructureTypesSet,
    ourImpassibleStructuresSet,
    PlayerMemoryKeys,
    roomDimensions,
    RoomMemoryKeys,
    safemodeTargets,
} from 'international/constants'
import { playerManager } from 'international/players'
import { allyRequestManager } from 'international/AllyRequests'
import { updateStat } from 'international/statsManager'
import {
    customLog,
    findObjectWithID,
    findWeightedRangeFromExit,
    getRange,
    isAlly,
    isXYInBorder,
    randomIntRange,
    randomRange,
    randomTick,
} from 'international/utils'
import { packCoord } from 'other/codec'
import { CommuneManager } from './commune'
import { collectiveManager } from 'international/collective'
import { roomUtils } from 'room/roomUtils'

export class DefenceManager {
    communeManager: CommuneManager

    presentThreat: number
    threatByPlayers: Map<string, number>

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (global.settings.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        if (!this.communeManager.room.enemyCreeps.length) {
            this.considerRampartsPublic()
            return
        }

        // There are at least enemy creeps

        this.makeRampartsPrivate()
        this.advancedActivateSafeMode()

        if (!this.communeManager.room.enemyAttackers.length) return

        // There are at least enemyAttackers

        this.assignDefenceTargets()

        // If CPU logging is enabled, log the CPU used by this manager

        if (global.settings.CPULogging === true) {
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
        // We can't use safemode when the downgrade timer is too low
        if (controller.ticksToDowngrade <= CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD) return false
        // If another room is safemoded, make sure that we are a higher level
        if (
            collectiveManager.safemodedCommuneName &&
            Game.rooms[collectiveManager.safemodedCommuneName].controller.level >=
                this.communeManager.room.controller.level
        )
            return false

        // Filter attackers that are not invaders. If there are none, stop

        const nonInvaderAttackers = room.enemyAttackers.filter(
            enemyCreep => !enemyCreep.isOnExit && enemyCreep.owner.username /* !== 'Invader' */,
        )

        if (!nonInvaderAttackers.length) return false
        if (!this.isControllerSafe()) return true

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

            const structuresAtCoord = room.roomManager.structureCoords.get(
                packCoord(attackTarget.pos),
            )
            if (
                structuresAtCoord &&
                structuresAtCoord.find(ID => findObjectWithID(ID).structureType === STRUCTURE_SPAWN)
            )
                return true

            if (safemodeTargets.includes(attackTarget.structureType)) return true
        }

        return false
    }

    /**
     * Identify claim creeps trying to downgrade the controller, safemode just before
     */
    private isControllerSafe() {

        const { room } = this.communeManager
        const terrain = Game.map.getRoomTerrain(room.name)
        const enemyCoord = roomUtils.floodFillFor(room.name, [room.controller.pos], (coord) => {

            // See if we should even consider the coord

            // Ignore terrain that protects us
            if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

            // Don't go out of range 2 from controller
            if (getRange(room.controller.pos, coord) > 2) return false

            // Ignore structures that protect us
            if (room.coordHasStructureTypes(coord, ourImpassibleStructuresSet)) return false

            // Past this point we should always add this coord to the next generation

            // See if there is an enemy creep
            const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
            if (!enemyCreepID) return true

            const enemyCreep = findObjectWithID(enemyCreepID)
            if (isAlly(enemyCreep.name)) return true
            // We only need to protect our controller from claim creeps
            if (!enemyCreep.parts.claim) return true

            // We identified an enemy claimed near our controller!
            return 'stop'
        })

        // If there is an enemy claimer, safemode
        return !enemyCoord
    }

    private advancedActivateSafeMode() {
        if (!this.shouldActivatesSafeMode()) return

        // If another room is safemoded and we determined it to be okay: unclaim it so we can safemode
        if (collectiveManager.safemodedCommuneName) {
            const safemodedRoom = Game.rooms[collectiveManager.safemodedCommuneName]
            safemodedRoom.controller.unclaim()
            // Add a return if we can't unclaim and safemode on the same tick
        }

        if (this.communeManager.room.controller.activateSafeMode() !== OK) return

        // Safemode was probably activated

        // Record that we safemoded so other communes know
        collectiveManager.safemodedCommuneName = this.communeManager.room.name
    }

    private considerRampartsPublic() {
        if (!global.settings.publicRamparts) return

        const { room } = this.communeManager

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
    }

    private makeRampartsPrivate() {
        for (const rampart of this.communeManager.room.roomManager.structures.rampart) {
            if (rampart.isPublic) rampart.setPublic(false)
        }
    }

    private assignDefenceTargets() {
        const { room } = this.communeManager

        // Sort by estimated percent health change

        const defenderEnemyTargetsByDamage = Array.from(
            room.defenderEnemyTargetsWithDefender.keys(),
        ).sort((a, b) => {
            const creepA = findObjectWithID(a)
            const creepB = findObjectWithID(b)

            return (
                creepA.hits / creepA.hitsMax -
                (creepA.hits + room.defenderEnemyTargetsWithDamage.get(a)) / creepA.hitsMax -
                (creepB.hits / creepB.hitsMax -
                    (creepB.hits + room.defenderEnemyTargetsWithDamage.get(b)) / creepB.hitsMax)
            )
        })

        // Attack enemies in order of most net damage members can heal

        for (const enemyCreepID of defenderEnemyTargetsByDamage) {
            if (!room.attackingDefenderIDs.size) break

            const enemyCreep = findObjectWithID(enemyCreepID)

            for (const memberID of room.defenderEnemyTargetsWithDefender.get(enemyCreepID)) {
                if (!room.attackingDefenderIDs.has(memberID)) continue

                const member = Game.getObjectById(memberID)

                Game.creeps[member.name].combatTarget = enemyCreep

                room.attackingDefenderIDs.delete(memberID)
            }

            if (this.communeManager.towerAttackTarget) continue

            const damage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)
            room.visual.text(damage.toString(), enemyCreep.pos.x, enemyCreep.pos.y - 0.25, {
                font: 0.3,
            })

            if (enemyCreep.owner.username === 'Invader') {
                if (damage <= 0) continue
            } else {
                const playerMemory =
                    Memory.players[enemyCreep.owner.username] ||
                    playerManager.initPlayer(enemyCreep.owner.username)
                const weight = playerMemory[PlayerMemoryKeys.rangeFromExitWeight]

                if (findWeightedRangeFromExit(enemyCreep.pos, weight) * damage < enemyCreep.hits)
                    continue
            }

            this.communeManager.towerAttackTarget = enemyCreep
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

        // If we have towers and it's only invaders, we don't need a defence request
        if (onlyInvader && room.roomManager.structures.tower.length) return

        // There is tower inferiority, make a defend request

        room.createDefendCombatRequest({
            [CombatRequestKeys.minDamage]: minDamage,
            [CombatRequestKeys.minMeleeHeal]: minMeleeHeal,
            [CombatRequestKeys.minRangedHeal]: minRangedHeal,
            [CombatRequestKeys.quadQuota]: 1,
            [CombatRequestKeys.inactionTimerMax]: onlyInvader ? 1 : undefined,
        })

        if (global.settings.allies) {
            allyRequestManager.requestDefense(room.name, minDamage, minMeleeHeal, minRangedHeal, 1)
        }
    }

    private findPresentThreat() {
        this.presentThreat = 0
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
            this.presentThreat += threat

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

        this.findPresentThreat()

        const roomMemory = Memory.rooms[room.name]

        roomMemory[RoomMemoryKeys.threatened] = Math.max(
            roomMemory[RoomMemoryKeys.threatened],
            this.presentThreat,
            playerManager.highestThreat / 3,
        )

        if (this.presentThreat) {
            for (const [playerName, threat] of this.threatByPlayers) {
                let player = Memory.players[playerName]

                if (!player) {
                    player = playerManager.initPlayer(playerName)
                }

                player[PlayerMemoryKeys.offensiveThreat] = Math.max(
                    threat,
                    player[PlayerMemoryKeys.offensiveThreat],
                )
                player[PlayerMemoryKeys.hate] = Math.max(threat, player[PlayerMemoryKeys.hate])
                player[PlayerMemoryKeys.lastAttacked] = 0
            }

            roomMemory[RoomMemoryKeys.lastAttacked] = 0
            return
        }

        // There is no present threat

        // Reduce attack threat over time
        if (roomMemory[RoomMemoryKeys.threatened] > 0)
            roomMemory[RoomMemoryKeys.threatened] *= defaultDataDecay

        roomMemory[RoomMemoryKeys.lastAttacked] += 1
    }
}
