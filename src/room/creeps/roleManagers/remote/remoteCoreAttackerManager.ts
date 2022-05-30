import { RemoteCoreAttacker } from 'room/creeps/creepClasses'
import './remoteCoreAttackerFunctions'

export function remoteCoreAttackerManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: RemoteCoreAttacker = Game.creeps[creepName]

          // Try to find a remote

          if (!creep.findRemote()) {
               // If the room is the creep's commune

               if (room.name === creep.memory.communeName) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
               }

               // Otherwise, have the creep make a moveRequest to its commune and iterate

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 25 },
                    cacheAmount: 200,
               })

               continue
          }

          creep.say(creep.memory.remoteName)

          // Try to attack enemyAttackers, iterating if there are none or one was attacked

          if (creep.advancedAttackCores()) continue

          // If the creep is its remote

          if (room.name === creep.memory.remoteName) {

               delete creep.memory.remoteName
               continue
          }

          // Otherwise, create a moveRequest to its remote

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: new RoomPosition(25, 25, creep.memory.remoteName), range: 25 },
               cacheAmount: 200,
          })
     }
}
