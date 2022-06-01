import { constants } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { RoomTask } from './roomTasks'

export function taskManager(room: Room) {
    // Iterate through tasks without responders

    for (const taskID in room.global.tasksWithoutResponders) {
        const task: RoomTask = room.global.tasksWithoutResponders[taskID]

        // If the task should be deleted, delete it

        if (!task.shouldStayActive()) task.delete()
    }

    // Iterate through tasks with responders

    for (const taskID in room.global.tasksWithResponders) {
        const task: RoomTask = room.global.tasksWithResponders[taskID]

        // If the task should be deleted, delete it

        if (!task.shouldStayActive()) task.delete()
    }

    /*
    customLog('TWOR', JSON.stringify(room.global.tasksWithoutResponders))
    customLog('TWR', JSON.stringify(room.global.tasksWithResponders))
    */
}
