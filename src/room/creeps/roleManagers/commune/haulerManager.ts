import { customLog } from 'international/generalFunctions'
import { RoomTask } from 'room/roomTasks'
import { Hauler } from '../../creepClasses'
import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {
     // Loop through creep names of this role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: Hauler = Game.creeps[creepName]

          if (creep.memory.reservations && creep.memory.reservations.length) {
               creep.fulfillReservation()
               return
          }
          
          let targets
          let target
          let amount

          if (creep.needsResources()) {

               const sourceContainers: (StructureContainer | undefined)[] = [
                    room.get('source1Container'),
                    room.get('source2Container')
               ]

               for (const target of sourceContainers) {

                    if (!target) continue

                    amount = Math.min(creep.store.getCapacity(RESOURCE_ENERGY) - creep.usedStore(), target.store.energy)

                    creep.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
                    break
               }
          } else {

               targets = room.structures.extension.filter(function (structure) {
                    return structure.store.energy < structure.store.getCapacity(RESOURCE_ENERGY)
               })

               if (targets.length) {
                    target = creep.pos.findClosestByRange(targets)

                    creep.createReservation('transfer', target.id, Math.min(creep.usedStore(), target.store.getCapacity(RESOURCE_ENERGY)), RESOURCE_ENERGY)
               }
          }

          creep.fulfillReservation()

          /*
          creep.advancedRenew()

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

          const findTaskResult = creep.findTask(new Set(['transfer', 'withdraw', 'pull', 'pickup']))

          // If a task wasn't found, iterate

          if (!findTaskResult) continue

          // Try to filfill task

          const fulfillTaskResult = creep.fulfillTask()

          // Iterate if the task wasn't fulfilled

          if (!fulfillTaskResult) continue

          // Otherwise find the task

          const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

          // Delete it

          task.delete()
           */
     }
}
