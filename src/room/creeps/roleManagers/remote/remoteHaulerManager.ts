import { remoteNeedsIndex } from 'international/constants'
import { RoomTask } from 'room/roomTasks'
import { RemoteHauler } from '../../creepClasses'

export function remoteHaulerManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: RemoteHauler = Game.creeps[creepName]

          // If the creep needs resources

          if (creep.needsResources()) {
               if (!creep.memory.remoteName) {
                    const remoteNamesByEfficacy: string[] =
                         Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

                    for (const roomName of remoteNamesByEfficacy) {
                         const roomMemory = Memory.rooms[roomName]

                         if (roomMemory.needs[remoteNeedsIndex.remoteHauler] <= 0) continue

                         creep.memory.remoteName = roomName
                         roomMemory.needs[remoteNeedsIndex.remoteHauler] -= creep.partsOfType(CARRY)
                         break
                    }
               }

               //

               if (!creep.memory.remoteName) continue

               creep.say(creep.memory.remoteName)

               // If the creep is in the remote

               if (room.name === creep.memory.remoteName) {
                    // If creep has a task

                    if (global[creep.id]?.respondingTaskID) {
                         // Try to filfill task

                         const fulfillTaskResult = creep.fulfillTask()

                         // Iterate if the task wasn't fulfilled

                         if (!fulfillTaskResult) continue

                         // Otherwise find the task

                         const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

                         // Delete it

                         task.delete()
                    }

                    // Try to find a new task

                    const findTaskResult = creep.findTask(new Set(['pickup']), RESOURCE_ENERGY)

                    // If a task wasn't found, iterate

                    if (!findTaskResult) continue

                    // Try to filfill task

                    const fulfillTaskResult = creep.fulfillTask()

                    // Iterate if the task wasn't fulfilled

                    if (!fulfillTaskResult) continue

                    // Otherwise find the task

                    const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

                    // Delete it and iterate

                    task.delete()
                    continue
               }

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                         pos: new RoomPosition(25, 25, creep.memory.remoteName),
                         range: 25,
                    },
                    avoidEnemyRanges: true,
                    cacheAmount: 200,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               continue
          }

          // Otherwise

          if (room.name === creep.memory.communeName) {
               // Try to renew the creep

               creep.advancedRenew()

               // If the creep has a remoteName, delete it

               if (creep.memory.remoteName) delete creep.memory.remoteName
               /*
            // If there is a storage

            if (room.storage) {

                creep.say('S')

                // Advanced transfer to it and stop

                creep.advancedTransfer(room.storage)
                return
            } */

               // If creep has a task

               if (global[creep.id]?.respondingTaskID) {
                    // Try to filfill task

                    const fulfillTaskResult = creep.fulfillTask()

                    // Iterate if the task wasn't fulfilled

                    if (!fulfillTaskResult) continue

                    // Otherwise find the task

                    const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

                    // Delete it

                    task.delete()
               }

               // Try to find a new task

               const findTaskResult = creep.findTask(new Set(['transfer']), RESOURCE_ENERGY)

               // If a task wasn't found, iterate

               if (!findTaskResult) continue

               // Try to filfill task

               const fulfillTaskResult = creep.fulfillTask()

               // Iterate if the task wasn't fulfilled

               if (!fulfillTaskResult) continue

               // Otherwise find the task

               const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

               // Delete it and iterate

               task.delete()
               continue
          }

          creep.say(creep.memory.communeName)

          creep.createMoveRequest({
               origin: creep.pos,
               goal: {
                    pos: new RoomPosition(25, 25, creep.memory.communeName),
                    range: 25,
               },
               avoidEnemyRanges: true,
               cacheAmount: 200,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })
     }
}
