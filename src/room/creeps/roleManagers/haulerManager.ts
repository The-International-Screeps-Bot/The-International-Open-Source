import { generalFuncs } from 'international/generalFunctions'
import { RoomTask } from 'room/roomTasks'
import { Hauler } from '../creepClasses'
import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Hauler = Game.creeps[creepName]

        // If creep has a task

        if (global[creep.id] && global[creep.id].respondingTaskIDs && global[creep.id].respondingTaskIDs.length > 0) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // Iterate if the task wasn't fulfilled

            if (!fulfillTaskResult) continue

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

            // Delete it

            task.delete()

            // Try to find a new task

            const findTaskResult = creep.findTask(new Set([
                'transfer',
                'withdraw',
                'pull',
                'pickup'
            ]))

            // If creep found a task, try to fulfill it and iterate

            if (findTaskResult) creep.fulfillTask()
            continue
        }

        // Try to find a new task

        const findTaskResult = creep.findTask(new Set([
            'transfer',
            'withdraw',
            'pull',
            'pickup'
        ]))

        // If there is a task, try to fulfill it

        if (findTaskResult) creep.fulfillTask()
    }
}
