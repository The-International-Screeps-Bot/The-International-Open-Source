import { constants } from 'international/constants'
import { RoomDeliverTask } from './roomTasks'

export function taskManager(room: Room) {

    const tasksWithoutResponders = global[room.name].tasksWithoutResponders

    // Iterate through tasks with responders

    for (const taskID in tasksWithoutResponders) {

        const task = tasksWithoutResponders[taskID]

        // Try to find the creator using the task's creatorID

        const creator = global.findObjectWithId(task.creatorID)

        // If the creator doesn't exist, delete the task

        if (!creator) delete tasksWithoutResponders[taskID]
    }

    const tasksWithResponders = global[room.name].tasksWithResponders

    // Iterate through tasks with responders

    for (const taskID in tasksWithResponders) {

        const task = tasksWithResponders[taskID]

        // Try to find the responder using the task's responderID

        const responder = global.findObjectWithId(task.responderID)

        // If the responder doesn't exist, delete the task

        if (!responder) delete tasksWithResponders[taskID]

        // Try to find the creator using the task's creatorID

        const creator = global.findObjectWithId(task.creatorID)

        // If the creator doesn't exist, delete the task

        if (!creator) delete tasksWithResponders[taskID]
    }

    global.customLog('TWOR', JSON.stringify(tasksWithoutResponders))
    global.customLog('TWR', JSON.stringify(tasksWithResponders))
}
