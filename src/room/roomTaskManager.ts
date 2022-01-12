import { constants } from 'international/constants'
import { generalFuncs } from 'international/generalFunctions'
import { RoomTask } from './roomTasks'

export function taskManager(room: Room) {

    // Iterate through tasks without responders

    for (const taskID in global[room.name].tasksWithoutResponders) {

        const task: RoomTask = global[room.name].tasksWithoutResponders[taskID]

        // Try to find the creator using the task's creatorID

        const creator = generalFuncs.findObjectWithId(task.creatorID)

        // If the creator doesn't exist, delete the task

        if (!creator) room.deleteTask(taskID, false)
    }

    // Iterate through tasks with responders

    for (const taskID in global[room.name].tasksWithResponders) {

        const task: RoomTask = global[room.name].tasksWithResponders[taskID]

        // Try to find the responder using the task's responderID

        const responder = generalFuncs.findObjectWithId(task.responderID)

        // If the responder doesn't exist, delete the task

        if (!responder) room.deleteTask(taskID, true)

        // Try to find the creator using the task's creatorID

        const creator = generalFuncs.findObjectWithId(task.creatorID)

        // If the creator doesn't exist, delete the task

        if (!creator) room.deleteTask(taskID, true)
    }

    generalFuncs.customLog('TWOR', JSON.stringify(global[room.name].tasksWithoutResponders))
    generalFuncs.customLog('TWR', JSON.stringify(global[room.name].tasksWithResponders))
}
