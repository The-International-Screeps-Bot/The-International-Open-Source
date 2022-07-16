import { remoteHarvesterRoles, remoteNeedsIndex, spawnByRoomRemoteRoles } from 'international/constants'
import { findCarryPartsRequired } from 'international/generalFunctions'

Room.prototype.remotesManager = function () {
     // Loop through the commune's remote names

     for (let index = this.memory.remotes.length - 1; index >= 0; index -= 1) {
          // Get the name of the remote using the index

          const remoteName = this.memory.remotes[index]

          const remoteMemory = Memory.rooms[remoteName]

          // If the room isn't a remote, remove it from the remotes array

          if (remoteMemory.type !== 'remote' || remoteMemory.commune !== this.name) {
               this.memory.remotes.splice(index, 1)
               continue
          }

          // Intialize an array for this room's creepsFromRoomWithRemote

          this.creepsFromRoomWithRemote[remoteName] = {}

          // For each role, construct an array for the role in creepsFromWithRemote

          for (const role of spawnByRoomRemoteRoles) this.creepsFromRoomWithRemote[remoteName][role] = []

          let isAbandoned

          if (remoteMemory.abandoned > 0) {

               isAbandoned = true
               remoteMemory.abandoned -= 1

               for (const need in remoteMemory.needs) remoteMemory.needs[need] = 0

               continue
          }

          if (isAbandoned) continue

          remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 3
          remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = remoteMemory.source2 ? 3 : 0
          remoteMemory.needs[remoteNeedsIndex.remoteHauler] = 0
          remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 1

          // Get the remote

          const remote = Game.rooms[remoteName]

          const possibleReservation = this.energyCapacityAvailable >= 650

          // If the remote is reserved

          if (possibleReservation) {
               // Increase the remoteHarvester need accordingly

               remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] += 3
               remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] += remoteMemory.source2 ? 3 : 0

               const isReserved =
                    remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

               // If the reservation isn't soon to run out, relative to the room's sourceEfficacy average

               if (
                    isReserved &&
                    remote.controller.reservation.ticksToEnd >=
                         remoteMemory.sourceEfficacies.reduce((a, b) => a + b) * 2
               ) {
                    remoteMemory.needs[remoteNeedsIndex.remoteReserver] = 0
               }
          }

          // Loop through each index of sourceEfficacies

          for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
               // Get the income based on the reservation of the room and remoteHarvester need

               const income = possibleReservation ? 10 : 5

               // Find the number of carry parts required for the source, and add it to the remoteHauler need

               remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(
                    remoteMemory.sourceEfficacies[index],
                    income,
               )
          }

          if (!remote) continue

          remoteMemory.needs[remoteNeedsIndex.remoteDefender] = 0

          for (const enemyCreep of remote.enemyCreeps) {
               // Increase the defenderNeed according to the creep's strength

               remoteMemory.needs[remoteNeedsIndex.remoteDefender] += enemyCreep.strength
          }

          if (remote.structures.invaderCore.length) {

               remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = 1
               remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 0
               remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = 0
               remoteMemory.needs[remoteNeedsIndex.remoteHauler] = 0
          }
          else remoteMemory.needs[remoteNeedsIndex.remoteCoreAttacker] = 0

          // If there are walls or enemyStructures, set dismantler need

          const enemyStructures = remote.find(FIND_HOSTILE_STRUCTURES).filter(function (structure) {
               return structure.structureType != STRUCTURE_INVADER_CORE
          })

          remoteMemory.needs[remoteNeedsIndex.remoteDismantler] =
               remote.actionableWalls.length || enemyStructures.length ? 1 : 0
     }
}
