import { constants } from "international/constants"
import { findObjectWithID } from "international/generalFunctions"


/**
 * Handles defence related situations for a commune
 */
export function defenceManager(room: Room) {

    // Get enemy creeps in the room

    const enemyCreeps = room.get('enemyCreeps')

    // If there are no enemy creeps, stop

    if (!enemyCreeps.length) return

    advancedActivateSafeMode()

    function advancedActivateSafeMode() {

        // If safeMode is on cooldown, stop

        if (room.controller.safeModeCooldown) return

        // Otherwise if there are no safeModes left, stop

        if (room.controller.safeModeAvailable == 0) return

        // Otherwise if the controller is upgradeBlocked, stop

        if (room.controller.upgradeBlocked > 0) return

        // Otherwise if safeMode can be activated

        // Check if there are enemy attackers in the room, stopping if there are none

        const enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !constants.allyList.has(creep.owner.username) && creep.hasPartsOfTypes([WORK || ATTACK || RANGED_ATTACK])
        })
        if (!enemyAttackers.length) {

            // Get the room's ramparts and loop through them

            const ramparts: StructureRampart[] = room.get('rampart')
            for (const rampart of ramparts) {

                // Check if the rampart is public. If not, make it so

                if (rampart.isPublic) rampart.setPublic(true)
            }
            
            return
        }

        // Get the room's ramparts and loop through them

        const ramparts: StructureRampart[] = room.get('rampart')
        for (const rampart of ramparts) {

            // Check if the rampart is public. If so, make it private

            if (rampart.isPublic) rampart.setPublic(false)
        }

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
