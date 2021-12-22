import { RoomWithdrawTask, RoomTransferTask, RoomPullTask } from "room/tasks"

import creepClasses from "../creepClasses"
const Hauler = creepClasses.Hauler

Hauler.prototype.findTask = function() {

    const creep: Creep = this
    const room: Room = creep.room


}

Hauler.prototype.fulfillTask = function() {

    const creep: Creep = this
    const room: Room = creep.room

    const functionsForTasks: {[key: string]: any} = {
        withdraw: creep.fulfillWithdrawTask(),
        transfer: creep.fulfillTransferTask(),
        pull: creep.fulfillPullTask(),
    }

    const task: RoomWithdrawTask = global[room.name].tasks[creep.memory.taskID]
    creep[functionsForTasks[task.type]]()
}

Hauler.prototype.fulfillWithdrawTask = function() {

    const creep: Creep = this
    const room: Room = creep.room

    // Get the task and the task's target

    const task: RoomWithdrawTask = global[room.name].tasks[creep.memory.taskID]
    const taskTarget = global.findObjectWithId(task.targetID)

    // Try to transfer to the target and record the result

    const advancedTransferResult = creep.advancedTransfer(taskTarget, task.resourceType, task.amount)

    // If transfering informed the creep wasn't in range

    if (advancedTransferResult == ERR_NOT_IN_RANGE) {

        // Move the the target and stop

        return
    }

    // Otherwise delete the task

    room.deleteTask(task.ID)

    // Try to find a new task

    Hauler.findTask()

    // If creep found a task, try to fulfill it

    if (creep.memory.taskID) creep.fulfillTask()
}

Hauler.prototype.fulfillTransferTask = function() {

    const creep: Creep = this
    const room: Room = creep.room

    // Get the task and the task's target

    const task: RoomTransferTask = global[room.name].tasks[creep.memory.taskID]
    const taskTarget = global.findObjectWithId(task.targetID)

    // Try to transfer to the target and record the result

    const advancedTransferResult = creep.advancedTransfer(taskTarget, task.resourceType, task.amount)

    // If transfering informed the creep wasn't in range

    if (advancedTransferResult == ERR_NOT_IN_RANGE) {

        // Move the the target and stop

        return
    }

    // Otherwise delete the task

    room.deleteTask(task.ID)

    // Try to find a new task

    Hauler.findTask()

    // If creep found a task, try to fulfill it

    if (creep.memory.taskID) creep.fulfillTask()
}

Hauler.prototype.fulfillPullTask = function() {

    const creep: Creep = this
    const room: Room = creep.room

    // Get the task and the task's target

    const task: RoomPullTask = global[room.name].tasks[creep.memory.taskID]
    const taskTarget = global.findObjectWithId(task.targetID)

    // Try to transfer to the target and record the result

    const advancedTransferResult = creep.advancedTransfer(taskTarget, task.resourceType, task.amount)

    // If transfering informed the creep wasn't in range

    if (advancedTransferResult == ERR_NOT_IN_RANGE) {

        // Move the the target and stop

        return
    }

    // Otherwise delete the task

    room.deleteTask(task.ID)

    // Try to find a new task

    Hauler.findTask()

    // If creep found a task, try to fulfill it

    if (creep.memory.taskID) creep.fulfillTask()
}
