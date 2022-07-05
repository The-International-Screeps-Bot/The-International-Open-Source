import { constants } from 'international/constants'
import { customLog, pack, packXY } from 'international/generalFunctions'

export function trafficManager(room: Room) {
     if (!room.myCreepsAmount) return

     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     let creepName

     // Loop through each x and y in the room

     for (let x = 0; x < constants.roomDimensions; x += 1) {
          for (let y = 0; y < constants.roomDimensions; y += 1) {
               // Loop through those creeps

               for (creepName of room.moveRequests[packXY(x, y)]) {

                    // Handle traffic for this position

                    Game.creeps[creepName].recurseMoveRequest()
               }
          }
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Traffic Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               constants.colors.lightGrey,
          )
}
