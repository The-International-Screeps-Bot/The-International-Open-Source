import { Console } from "console"
import { generalFuncs } from "international/generalFunctions"
import { RoomTask, RoomPullTask } from "room/roomTasks"

import { Hauler } from "../creepClasses"

Hauler.prototype.fulfillTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    creep.say('FT')

    // Construct names for different functions based on tasks

    const functionsForTasks: {[key: string]: any} = {
        pull: 'fulfillPullTask',
    }

    // Get the creep's function and run it

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

    creep[functionsForTasks[task.type]](task)
}

/* Hauler.prototype.fulfillDeliverTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    creep.say('WT')

    // Get the task using the taskID in the creeps' memory

    const task: RoomDeliverTask = global[room.name].tasksWithResponders[global[creep.id].taskID]

    function withdrawAttempt(): boolean {

        // Inform false if there isn't a withdrawTarget

        if (!task.withdrawTargetID) return false

        // Get withdraw target using the task's withdrawTargetID

        const withdrawTarget: Creep | Structure | undefined = generalFuncs.findObjectWithId(task.withdrawTargetID)

        // If there is no withdrawTarget

        if (!withdrawTarget) {

            // Set the task's withdraw target ID to undefined and inform false

            // Delete the task

            room.deleteTask(task.ID, true)

            // Try to find a new task

            creep.findTask({
                deliver: true,
                pull: true,
            })

            // If creep found a task, stop with this task and try to fulfill it

            if (global[creep.id].taskID) creep.fulfillTask()
            return true
        }

        // Try to withdraw based on the task's request

        const advancedWithdrawResult = creep.advancedWithdraw(withdrawTarget, task.deliverAmount, task.resourceType)

        // Inform true if the advanced withdraw worked. Otherwise inform false

        if (advancedWithdrawResult == OK) return true
        return false
    }

    // Attempt to withdraw. If success then stop

    if (withdrawAttempt()) return

    // Get transfer target using the task's transferTargetID

    const transferTarget: Creep | Structure | undefined = generalFuncs.findObjectWithId(task.withdrawTargetID)

    // If there is no transfer target

    if (!transferTarget) {

        // Delete the task

        room.deleteTask(task.ID, true)

        // Try to find a new task

        creep.findTask({
            deliver: true,
            pull: true,
        })

        // If creep found a task, stop with this task and try to fulfill it

        if (global[creep.id].taskID) creep.fulfillTask()
        return
    }

    // Try to transfer to the transferTarget based on the task' request

    const advancedTransferResult = creep.advancedWithdraw(transferTarget, task.deliverAmount, task.resourceType)

    // If the advanced transfer was a success

    if (advancedTransferResult == OK) {

        // Delete the task

        room.deleteTask(task.ID, true)

        // Try to find a new task

        creep.findTask({
            deliver: true,
            pull: true,
        })

        // If creep found a task, stop with this task and try to fulfill it

        if (global[creep.id].taskID) creep.fulfillTask()
        return
    }
} */
