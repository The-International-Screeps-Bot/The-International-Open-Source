import { remoteNeedsIndex } from './constants'
import { customLog, findCarryPartsRequired } from './generalFunctions'
import { InternationalManager } from './internationalManager'

InternationalManager.prototype.remoteNeedsManager = function () {
     // For each roomName in the memory's communes

     for (const roomName of Memory.communes) {
          // Get the room using the roomName

          const room = Game.rooms[roomName]

          // Loop through each remote operated by the room

          for (const remoteName of room.memory.remotes) {
               // Get the remote's memory using its name

               const remoteMemory = Memory.rooms[remoteName]

               if (remoteMemory.abandoned > 0) {
                    remoteMemory.abandoned -= 1

                    for (const need in remoteMemory.needs) {
                         remoteMemory.needs[need] = 0
                    }

                    continue
               }

               // See if the remote is reserved

               const isReserved = remoteMemory.needs[remoteNeedsIndex.remoteReserver] === 0

               // If the remote is reserved

               if (isReserved) {
                    // Increase the remoteHarvester need accordingly

                    remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] += 3
                    remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] += remoteMemory.source2 ? 3 : 0
               }

               // Get the remote

               const remote = Game.rooms[remoteName]

               if (remote) {
                    // Get enemyCreeps in the room and loop through them

                    for (const enemyCreep of remote.enemyCreeps) {
                         // Increase the defenderNeed according to the creep's strength

                         remoteMemory.needs[remoteNeedsIndex.remoteDefender] += enemyCreep.strength
                    }

                    if (remote.structures.invaderCore.length) {
                         remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = 1
                    }
               }

               // Loop through each index of sourceEfficacies

               for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
                    // Get the efficacy using the index

                    const efficacy = remoteMemory.sourceEfficacies[index]

                    // Get the income based on the reservation of the room and remoteHarvester need

                    const income = isReserved
                         ? 10
                         : 5 /* - (remoteMemory.needs[remoteNeedsIndex[remoteHarvesterRoles[index]]] + (isReserved ? 4 : 2)) */

                    // Find the number of carry parts required for the source, and add it to the remoteHauler need

                    remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(efficacy, income)
               }
          }
     }
}
