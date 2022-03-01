import { generalFuncs } from "international/generalFunctions"

export interface RoomTask {
    /**
     * What the task is generally expected to entail for responders
     */
    type: RoomTaskTypes
    /**
     * The name of the room that the task will be recorded in
     */
    creatorID: string
    roomName: string
    responderID: string
    ID: number

    /**
     * The resourceType relating to the task's request
     */
    resourceType?: ResourceConstant
    /**
     * A metric for responders to understand the importance of this task, starting at 0 as most important
     */
    priority?: number

    // Functions

    /**
     * Finds where the task is stored in global
     */
    findLocation(): {[key: number]: RoomTask}

    /**
     * Informs whether the task needs to be deleted or not
     */
    shouldStayActive(): boolean

    /**
     * Deletes all references to the task
     */
    delete(): void
}

export class RoomTask {
    constructor(type: RoomTaskTypes, creatorID: string, roomName: string) {

        const task = this
        generalFuncs.customLog('Created Task', 'Type: ' + type + ', creatorID: ' + creatorID)
        // Assign parameters

        task.type = type
        task.creatorID = creatorID
        task.roomName = roomName

        // Generate an ID

        task.ID = generalFuncs.newID()

        // if there is no global for the creator, make one

        if (!global[creatorID]) global[creatorID] = {}

        // If there is no created task IDs object for the creator, make it

        if (!global[creatorID].createdTaskIDs) global[creatorID].createdTaskIDs = {}

        // Set a value for the creator's ID if it doesn't exist, then assign the taskID and responder state

        global[creatorID].createdTaskIDs[task.ID] = false

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}

RoomTask.prototype.findLocation = function() {

    const task = this

    // If the task is in tasks with responders, inform that location

    if (global[task.roomName].tasksWithResponders[task.ID]) return global[task.roomName].tasksWithResponders

    // Otherwise inform tasks without responders

    return global[task.roomName].tasksWithoutResponders
}

RoomTask.prototype.shouldStayActive = function() {

    const task = this

    // If the task has a responderID

    if (task.responderID) {

        // If the responder doesn't exist, inform false

        if (!generalFuncs.findObjectWithID(task.responderID)) return false
    }

    // If the creator no longer exits, infom false

    if (!generalFuncs.findObjectWithID(task.creatorID)) return false

    // Otherwise inform true

    return true
}

RoomTask.prototype.delete = function() {

    const task = this

    // Construct task info based on found location
    generalFuncs.customLog('Deleted task', 'Type: ' + task.type + ', creatorID: ' + task.creatorID)
    const taskLocation = task.findLocation()

    // And delete the taskID from the creator's list

    delete global[task.creatorID].createdTaskIDs[task.ID]

    // If the task has a responder remove the task ID from it

    if (task.responderID) delete global[task.responderID].respondingTaskID

    // Delete the task

    delete taskLocation[task.ID]
}

export interface RoomWithdrawTask extends RoomTask {
    withdrawAmount: number
    creatorID: string
}

export class RoomWithdrawTask extends RoomTask {
    constructor(roomName: string, resourceType: ResourceConstant, withdrawAmount: number, creatorID: Id<any>, priority: number) {

        // Inherit from RoomTask

        super('withdraw', creatorID, roomName)

        const task = this

        // Assign paramaters

        task.resourceType = resourceType
        task.withdrawAmount = withdrawAmount
        task.priority = priority
    }
}

export interface RoomTransferTask extends RoomTask {
    transferAmount: number
    creatorID: Id<any>
}

export class RoomTransferTask extends RoomTask {
    constructor(roomName: string, resourceType: ResourceConstant, transferAmount: number, creatorID: Id<any>, priority: number) {

        // Inherit from RoomTask

        super('transfer', creatorID, roomName)

        const task = this

        // Assign paramaters

        task.resourceType = resourceType
        task.transferAmount = transferAmount
        task.priority = priority
    }
}

export interface RoomRepairTask extends RoomTask {
    repairThreshold: number
    creatorID: string
}

export class RoomRepairTask extends RoomTask {
    constructor(roomName: string, creatorID: Id<Structure>, repairThreshold: number, priority: number) {

        // Inherit from RoomTask

        super('repair', creatorID, roomName)

        const task = this

        // Assign paramaters

        task.repairThreshold = repairThreshold
        task.priority = priority
    }
}

export interface RoomPickupTask extends RoomTask {
    creatorID: Id<Resource>
    pickupAmount: number
}

export class RoomPickupTask extends RoomTask {
    constructor(roomName: string, creatorID: Id<Resource>, resourceType: ResourceConstant, priority: number) {

        // Inherit from RoomTask

        super('pickup', creatorID, roomName)

        const task = this

        // Assign paramaters

        task.resourceType = resourceType
        task.priority = priority

        // Assign defaults

        task.pickupAmount = 10000000
    }
}

export interface RoomPullTask extends RoomTask {
    creatorID: string
    targetPos: RoomPosition
}

export class RoomPullTask extends RoomTask {
    constructor(roomName: string, creatorID: Id<Creep>, targetPos: RoomPosition, priority: number) {

        // Inherit from RoomTask

        super('pull', creatorID, roomName)

        const task = this

        // Assign paramaters

        task.targetPos = targetPos
        task.priority = priority
    }
}
