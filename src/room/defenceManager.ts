import { allyList, constants } from 'international/constants'
import { customLog, findObjectWithID } from 'international/generalFunctions'

/**
 * Handles defence related situations for a commune
 */
export function defenceManager(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     // Get enemyAttackers in the room

     const enemyAttackers = room.enemyCreeps.filter(
          creep => !creep.isOnExit() && creep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK]),
     )

     manageRampartPublicity()

     function manageRampartPublicity() {

          // If there are no enemyAttackers

          if (!enemyAttackers.length) {

               if (!Memory.publicRamparts) return

               // Stop if the tick is not divisible by a random range

               if (Game.time % Math.floor(Math.random() * 50) !== 0) return

               let increment = 0

               // Get the room's ramparts and loop through them

               const ramparts: StructureRampart[] = room.get('rampart')
               for (const rampart of ramparts) {
                    // If increment is more or equal to 10, stop

                    if (increment >= 10) return

                    // If the rampart is public, iterate

                    if (rampart.isPublic) continue

                    // Otherwise set the rampart to public, increase increment

                    rampart.setPublic(true)
                    increment += 1
               }

               // Stop

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

          if (room.controller.safeModeAvailable === 0) return

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

               if (eventItem.event !== EVENT_ATTACK) continue

               // Otherwise get the target of the attack

               const attackTarget: Structure | Creep = findObjectWithID(eventItem.data.targetId as Id<any>)

               // If the attackTarget doesn't have a structureType, iterate

               if (!attackTarget.structureType) continue

               // Otherwise activate safeMode and stop the loop

               room.controller.activateSafeMode()
               break
          }
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Defence Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               constants.colors.lightGrey,
          )
}
