import { RoomTask, RoomDeliverTask, RoomPullTask } from "room/tasks"

import { Hauler } from "../creepClasses"

Hauler.prototype.fulfillTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    const functionsForTasks: {[key: string]: any} = {
        deliver: creep.fulfillDeliverTask(),
        pull: creep.fulfillPullTask(),
    }

    const task: RoomTask = global[room.name].tasks[creep.memory.taskID]
    creep[functionsForTasks[task.type]]()
}

Hauler.prototype.fulfillDeliverTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    // Get the task using the taskID in the creeps' memory

    const task: RoomDeliverTask = global[room.name].tasks[creep.memory.taskID]

    function withdrawAttempt(): boolean {

        // Inform false if there isn't a withdrawTarget

        if (!task.withdrawTargetID) return false

        // Get withdraw target using the task's withdrawTargetID

        const withdrawTarget: Creep | Structure | undefined = global.findObjectWithId(task.withdrawTargetID)

        // If there is no withdrawTarget

        if (!withdrawTarget) {

            // Set the task's withdraw target ID to undefined and inform false

            // Delete the task

            room.deleteTask(task.ID)

            // Try to find a new task

            creep.findTask({
                deliver: true,
                pull: true,
            })

            // If creep found a task, stop with this task and try to fulfill it

            if (creep.memory.taskID) creep.fulfillTask()
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

    const transferTarget: Creep | Structure | undefined = global.findObjectWithId(task.withdrawTargetID)

    // If there is no transfer target

    if (!transferTarget) {

        // Delete the task

        room.deleteTask(task.ID)

        // Try to find a new task

        creep.findTask({
            deliver: true,
            pull: true,
        })

        // If creep found a task, stop with this task and try to fulfill it

        if (creep.memory.taskID) creep.fulfillTask()
        return
    }

    // Try to transfer to the transferTarget based on the task' request

    const advancedTransferResult = creep.advancedWithdraw(transferTarget, task.deliverAmount, task.resourceType)

    // If the advanced transfer was a success

    if (advancedTransferResult == OK) {

        // Delete the task

        room.deleteTask(task.ID)

        // Try to find a new task

        creep.findTask({
            deliver: true,
            pull: true,
        })

        // If creep found a task, stop with this task and try to fulfill it

        if (creep.memory.taskID) creep.fulfillTask()
        return
    }
}

Hauler.prototype.fulfillPullTask = function() {

    const creep: Hauler = this
    const room: Room = creep.room

    // Get the task

    const task: RoomPullTask = global[room.name].tasks[creep.memory.taskID]
    const taskTarget = Game.creeps[task.targetName]

    // If there is no taskTarget

    if (!taskTarget) {

        // Delete the task

        room.deleteTask(task.ID)

        // Try to find a new task

        creep.findTask({
            deliver: true,
            pull: true,
        })

        // If creep found a task, stop with this task and try to fulfill it

        if (creep.memory.taskID) creep.fulfillTask()
        return
    }

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Move to the target

        creep.moveTo(taskTarget.pos)
    }

    // Otherwise

    // Find the targetPos

    const targetPos = task.targetPos

    // If the creep is not in range of the targetPos

    if (creep.pos.getRangeTo(targetPos) > 1) {

        // Have the creep pull the target and have it move with the creep

        creep.pull(taskTarget)
        taskTarget.move(creep)
    }

    // Otherwise

    // Have the creep move to where the taskTarget is

    creep.move(creep.pos.getDirectionTo(taskTarget.pos))

    // Have the creep pull the taskTarget to trade places with the creep

    creep.pull(taskTarget)
    taskTarget.move(creep)

    // Delete the task

    room.deleteTask(task.ID)

    // Try to find a new task

    creep.findTask({
        deliver: true,
        pull: true,
    })

    // If creep found a task, try to fulfill it

    if (creep.memory.taskID) creep.fulfillTask()
}
