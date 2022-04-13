import { constants } from "international/constants"
import { findObjectWithID } from "international/generalFunctions"


/**
 * Handles defence related situations for a commune
 */
export function defenceManager(room: Room) {

    // Get enemyAttackers in the room

    const enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => !constants.allyList.has(creep.owner.username) && !creep.isOnExit() && creep.hasPartsOfTypes([WORK || ATTACK || RANGED_ATTACK])
    })

    manageRampartPublicity()

    function manageRampartPublicity() {

        // If there are no enemyAttackers

        if (!enemyAttackers.length) {

            // Stop if the tick is not divisible by 10

            if (Game.time % 10 == 0) return

            // Get the room's ramparts and loop through them

            const ramparts: StructureRampart[] = room.get('rampart')
            for (const rampart of ramparts) {

                // If the rampart isn't public, make it so

                if (!rampart.isPublic) rampart.setPublic(true)
            }

            return
        }

        // Get the room's ramparts and loop through them

        const ramparts: StructureRampart[] = room.get('rampart')
        for (const rampart of ramparts) {

            // If the rampart is public, make it private

            if (rampart.isPublic) rampart.setPublic(false)
        }
    }

    advancedActivateSafeMode()

    function advancedActivateSafeMode() {

        // If safeMode is on cooldown, stop

        if (room.controller.safeModeCooldown) return

        // Otherwise if there are no safeModes left, stop

        if (room.controller.safeModeAvailable == 0) return

        // Otherwise if the controller is upgradeBlocked, stop

        if (room.controller.upgradeBlocked > 0) return

        // Filter attackers that are not invaders. If there are none, stop

        const nonInvaderAttackers = enemyAttackers.filter(enemyAttacker => enemyAttacker.owner.username !== 'Invader')
        if (!nonInvaderAttackers.length) return

        // Otherwise if safeMode can be activated

        // Get the previous tick's events

        const eventLog = room.getEventLog()

        // Loop through each eventItem

        for (const eventItem of eventLog) {

            // If the event wasn't an attack, iterate

            if (eventItem.event != EVENT_ATTACK) continue

            // Otherwise get the target of the attack

            const attackTarget: Structure | Creep = findObjectWithID(eventItem.data.targetId as Id<any>)

            // If the attackTarget doesn't have a structureType, iterate

            if (!attackTarget.structureType) continue

            // Otherwise activate safeMode and stop the loop

            room.controller.activateSafeMode()
            break
        }
    }
}
