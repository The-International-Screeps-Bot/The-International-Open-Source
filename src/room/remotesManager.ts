import { remoteNeedsIndex, spawnByRoomRemoteRoles } from 'international/constants'
import { findCarryPartsRequired } from 'international/generalFunctions'

Room.prototype.remotesManager = function () {
     let remoteName
     let remoteMemory
     let remote
     let isReserved
     let enemyStructures

     let efficacy
     let income

     // Loop through the commune's remote names

     for (let index = this.memory.remotes.length - 1; index >= 0; index -= 1) {
          // Get the name of the remote using the index

          remoteName = this.memory.remotes[index]

          remoteMemory = Memory.rooms[remoteName]

          // If the room isn't a remote, remove it from the remotes array

          if (remoteMemory.type !== 'remote' || remoteMemory.commune !== this.name) {
               this.memory.remotes.splice(index, 1)
               continue
          }

          // Intialize an array for this room's creepsFromRoomWithRemote

          this.creepsFromRoomWithRemote[remoteName] = {}

          // For each role, construct an array for the role in creepsFromWithRemote

          for (const role of spawnByRoomRemoteRoles) this.creepsFromRoomWithRemote[remoteName][role] = []

          if (remoteMemory.abandoned > 0) {
               remoteMemory.abandoned -= 1

               for (const need in remoteMemory.needs) remoteMemory.needs[need] = 0

               continue
          }

          remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 3

          remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = remoteMemory.source2 ? 3 : 0

          remoteMemory.needs[remoteNeedsIndex.remoteHauler] = 0

          remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 1

          // Get the remote

          remote = Game.rooms[remoteName]

          isReserved = remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

          // If the remote is reserved

          if (isReserved) {
               // Increase the remoteHarvester need accordingly

               remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] += 3
               remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] += remoteMemory.source2 ? 3 : 0

               // If the reservation isn't soon to run out, relative to the room's sourceEfficacy average

               if (
                    remote.controller.reservation.ticksToEnd >=
                    remoteMemory.sourceEfficacies.reduce((a, b) => a + b) * 2
               ) {
                    remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 0
               }
          }

          if (remote) {
               remoteMemory.needs[remoteNeedsIndex.remoteDefender] = 0

               for (const enemyCreep of remote.enemyCreeps) {
                    // Increase the defenderNeed according to the creep's strength

                    remoteMemory.needs[remoteNeedsIndex.remoteDefender] += enemyCreep.strength
               }

               remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = remote.structures.invaderCore.length ? 1 : 0

               // If there are walls or enemyStructures, set dismantler need

               enemyStructures = remote.find(FIND_HOSTILE_STRUCTURES).filter(function (structure) {
                    return structure.structureType != STRUCTURE_INVADER_CORE
               })

               remoteMemory.needs[remoteNeedsIndex.remoteDismantler] =
                    (remote.actionableWalls.length || enemyStructures.length) ? 1 : 0
          }

          // Loop through each index of sourceEfficacies

          for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
               // Get the efficacy using the index

               efficacy = remoteMemory.sourceEfficacies[index]

               // Get the income based on the reservation of the room and remoteHarvester need

               income = isReserved
                    ? 10
                    : 5 /* - (remoteMemory.needs[remoteNeedsIndex[remoteHarvesterRoles[index]]] + (isReserved ? 4 : 2)) */

               // Find the number of carry parts required for the source, and add it to the remoteHauler need

               remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(efficacy, income)
          }
     }
}
