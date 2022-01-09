import { Console } from "console"
import { generalFuncs } from "international/generalFunctions"
import { RoomTask, RoomDeliverTask, RoomPullTask } from "room/roomTasks"

import { Hauler } from "../creepClasses"

Hauler.prototype.fulfillTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    creep.say('FT')

    // If the creep has no task

    if (!global[creep.id].taskID) return

    // Otherwise

    // Construct names for different functions based on tasks

    const functionsForTasks: {[key: string]: any} = {
        deliver: 'fulfillDeliverTask',
        pull: 'fulfillPullTask',
    }

    // Get the creep's function and run it

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].taskID]

    // If there is no task

    if (!task) {

        // Remove the creep's taskID and stop

        delete global[creep.id].taskID
        return
    }

    creep[functionsForTasks[task.type]]()
}

Hauler.prototype.fulfillDeliverTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    creep.say('WT')

    // Get the task using the taskID in the creeps' memory
    console.log(global[creep.id].taskID)
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
}

Hauler.prototype.fulfillPullTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    creep.say('PT')

    // Get the task

    const task: RoomPullTask = global[room.name].tasksWithResponders[global[creep.id].taskID]
    const taskTarget = Game.creeps[task.targetName]

    // If there is no taskTarget

    if (!taskTarget) {

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

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Create a moveRequest to the target and stop

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: taskTarget.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return
    }

    // Otherwise

    // Find the targetPos

    const targetPos = task.targetPos

    // If the creep is not in range of the targetPos

    if (creep.pos.getRangeTo(targetPos) > 0) {

        // Have the creep pull the target and have it move with the creep and stop

        creep.pull(taskTarget)
        taskTarget.move(creep)

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: targetPos, range: 0 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return
    }

    // Otherwise

    // Have the creep move to where the taskTarget is

    creep.move(creep.pos.getDirectionTo(taskTarget.pos))

    // Have the creep pull the taskTarget to trade places with the creep

    creep.pull(taskTarget)
    taskTarget.move(creep)

    // Delete the task

    room.deleteTask(task.ID, true)

    // Try to find a new task

    creep.findTask({
        deliver: true,
        pull: true,
    })

    // If creep found a task, try to fulfill it

    if (global[creep.id].taskID) creep.fulfillTask()
}
