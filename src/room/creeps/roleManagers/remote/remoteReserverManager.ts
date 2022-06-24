import { remoteNeedsIndex } from 'international/constants'
import { RemoteReserver } from '../../creepClasses'
import './remoteReserverFunctions'

export function remoteReserverManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: RemoteReserver = Game.creeps[creepName]

          if (!creep.memory.remoteName) {
               const remoteNamesByEfficacy: string[] =
                    Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

               for (const roomName of remoteNamesByEfficacy) {
                    const roomMemory = Memory.rooms[roomName]

                    if (roomMemory.needs[remoteNeedsIndex.remoteReserver] <= 0) continue

                    creep.memory.remoteName = roomName
                    if (!creep.isDying()) roomMemory.needs[remoteNeedsIndex.remoteReserver] -= 1

                    break
               }
          }

          //

          if (!creep.memory.remoteName) continue

          creep.say(creep.memory.remoteName)

          // If the creep is in the remote

          if (room.name === creep.memory.remoteName) {
               // Try to reserve the controller

               creep.advancedReserveController()
               continue
          }

          // Otherwise, make a moveRequest to it

          creep.createMoveRequest({
               origin: creep.pos,
               goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remoteName),
                    range: 25,
               },
               avoidEnemyRanges: true,
               plainCost: 1,
          })

          continue
     }
}
