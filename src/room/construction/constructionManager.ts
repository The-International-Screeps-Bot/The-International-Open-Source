import { constants } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { basePlanner } from './basePlanner'
import { rampartPlanner } from './rampartPlanner'

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     if (!room.memory.planned) basePlanner(room)

     manageControllerStructures()

     function manageControllerStructures() {

          const centerUpgradePos: RoomPosition | undefined = room.get('centerUpgradePos')
          if (!centerUpgradePos) return

          if (room.controller.level >= 5) {
               const controllerContainer: StructureContainer | undefined = room.get('controllerContainer')
               if (controllerContainer) controllerContainer.destroy()

               room.createConstructionSite(centerUpgradePos, STRUCTURE_LINK)
               return
          }

          room.createConstructionSite(centerUpgradePos, STRUCTURE_CONTAINER)
     }

     // Use floodfill from the anchor to plan structures

     room.communeConstructionPlacement()

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Construction Manager',
               `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}`,
               undefined,
               constants.colors.lightGrey,
          )
}
