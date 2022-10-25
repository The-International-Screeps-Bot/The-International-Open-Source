import { allyPlayers, myColors, roomDimensions, safemodeTargets } from 'international/constants'
import { customLog, findObjectWithID, getRangeOfCoords, randomTick } from 'international/utils'
import { CommuneManager } from './communeManager'

export class DefenceManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        this.advancedActivateSafeMode()
        this.manageRampartPublicity()
        this.assignDefenceTargets()

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging)
            customLog(
                'Defence Manager',
                (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
                undefined,
                myColors.lightGrey,
            )
    }

    advancedActivateSafeMode() {
        const { room } = this.communeManager
        const { controller } = room

        // If safeMode is on cooldown, stop

        if (controller.safeModeCooldown) return

        // Otherwise if there are no safeModes left, stop

        if (controller.safeModeAvailable === 0) return

        // Otherwise if the controller is upgradeBlocked, stop

        if (controller.upgradeBlocked > 0) return

        // Filter attackers that are not invaders. If there are none, stop

        const nonInvaderAttackers = room.enemyAttackers.filter(
            enemyCreep => !enemyCreep.isOnExit && enemyCreep.owner.username /* !== 'Invader' */,
        )

        if (!nonInvaderAttackers.length) return

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

            if (!safemodeTargets.includes(attackTarget.structureType)) continue

            controller.activateSafeMode()
            return
        }
    }

    manageRampartPublicity() {
        const { room } = this.communeManager

        const enemyAttackers = room.enemyAttackers.filter(function (creep) {
            return !creep.isOnExit
        })

        // If there are no enemyAttackers, try to publicize private ramparts 10 at a time

        if (!enemyAttackers.length) {
            if (!Memory.publicRamparts) return

            // Stop if the tick is not divisible by a random range

            if (randomTick(50)) return

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

    assignDefenceTargets() {
        const { room } = this.communeManager

        const defenderEnemyTargetsByDamage = Array.from(room.defenderEnemyTargetsWithDefender.keys()).sort((a, b) => {
            return room.defenderEnemyTargetsWithDamage.get(a) - room.defenderEnemyTargetsWithDamage.get(b)
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

            const netDamage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)

            if (netDamage > 0) {

                if (!room.towerAttackTarget) room.towerAttackTarget = enemyCreep
                else if (netDamage > room.defenderEnemyTargetsWithDamage.get(room.towerAttackTarget.id)) room.towerAttackTarget = enemyCreep
            }

            if (!room.attackingDefenderIDs.size) break
        }
    }
}
