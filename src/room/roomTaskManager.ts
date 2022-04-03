import { constants } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { RoomTask } from './roomTasks'

export function taskManager(room: Room) {

    // Iterate through tasks without responders

    for (const taskID in global[room.name].tasksWithoutResponders) {

        const task: RoomTask = global[room.name].tasksWithoutResponders[taskID]

        // If the task should be deleted, delete it

        if (!task.shouldStayActive()) task.delete()
    }

    // Iterate through tasks with responders

    for (const taskID in global[room.name].tasksWithResponders) {

        const task: RoomTask = global[room.name].tasksWithResponders[taskID]

        // If the task should be deleted, delete it

        if (!task.shouldStayActive()) task.delete()
    }

    customLog('TWOR', JSON.stringify(global[room.name].tasksWithoutResponders))
    customLog('TWR', JSON.stringify(global[room.name].tasksWithResponders))
}
