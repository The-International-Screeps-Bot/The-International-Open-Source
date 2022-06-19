import { claimRequestNeedsIndex, constants } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.claimRequestManager = function () {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     // If there is an existing claimRequest and it's valid, check if there is claimer need

     if (this.memory.claimRequest) {
          if (Memory.claimRequests[this.memory.claimRequest].abadon > 0) {
               delete this.memory.claimRequest
               return
          }

          const claimTarget = Game.rooms[this.memory.claimRequest]
          if (!claimTarget || !claimTarget.controller.my) {
               Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer] += 1
               return
          }

          // If there is a spawn and the controller is above level 5

          if (claimTarget.structures.spawn.length && claimTarget.controller.level >= 5) {
               delete Memory.claimRequests[this.memory.claimRequest]
               delete this.memory.claimRequest

               return
          }

          if (!claimTarget.structures.spawn.length)
               Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguard] = 20

          Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] = 0

          if (claimTarget.enemyCreeps.length) {
               // Get enemyCreeps in the room and loop through them

               for (const enemyCreep of claimTarget.enemyCreeps) {
                    // Increase the defenderNeed according to the creep's strength

                    Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] +=
                         enemyCreep.strength
               }
          }

          return
     }

     // Every 50 or so ticks

     /* if (Game.time % Math.floor(Math.random() * 100) !==0) return */

     // If autoClaim is disabled

     if (!Memory.autoClaim) return

     // If there are enough communes for the GCL

     if (Game.gcl.level <= Memory.communes.length) return

     // If a claimer can't be spawned

     if (this.energyCapacityAvailable < 750) return

     let distance

     for (const roomName of internationalManager.claimRequestsByScore) {
          if (!Memory.claimRequests[roomName] || Memory.claimRequests[roomName].abadon > 0) continue

          distance = Game.map.getRoomLinearDistance(this.name, roomName)

          if (distance > 10) continue

          distance = advancedFindDistance(this.name, roomName, {
               keeper: Infinity,
               enemy: Infinity,
               enemyRemote: Infinity,
               ally: Infinity,
               allyRemote: Infinity,
          })

          if (distance > 10) continue

          this.memory.claimRequest = roomName
          return
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Claim Request Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               constants.colors.lightGrey,
          )
}
