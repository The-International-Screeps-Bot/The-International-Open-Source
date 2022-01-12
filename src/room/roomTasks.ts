import { generalFuncs } from "international/generalFunctions"

export interface RoomTask {
    /**
     * What the task is generally expected to entail for responders
     */
    type: string
    /**
     * The name of the room that the task will be recorded in
     */
    roomName: string
    responderID: string
    creatorID: string
    ID: number
}

export interface RoomWithdrawTask extends RoomTask {
    resourceType: ResourceConstant
    deliverAmount: number
    withdrawAmount: number
    withdrawTargetID: string
}

export class RoomWithdrawTask {
    constructor(roomName: string, creatorID: string, resourceType: ResourceConstant, withdrawAmount: number, withdrawTargetID: string) {

        const task = this

        // Default properties

        task.type = 'deliver'
        task.ID = generalFuncs.newID()

        // Assign paramaters

        task.resourceType = resourceType
        task.withdrawAmount = withdrawAmount

        task.withdrawTargetID = withdrawTargetID

        // Set a value for the creator's ID if it doesn't exist, then assign the taskID and repsonder state

        generalFuncs.advancedGetValue(creatorID, {}).createdTasks[task.ID] = false

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}

export interface RoomTraansferTask extends RoomTask {
    resourceType: ResourceConstant
    transferAmount: number
    transferTargetIDs: string[]
}

export class RoomTraansferTask {
    constructor(roomName: string, creatorID: string, resourceType: ResourceConstant, transferAmount: number, transferTargetIDs: string[]) {

        const task = this

        // Default properties

        task.type = 'deliver'
        task.ID = generalFuncs.newID()

        // Assign paramaters

        task.creatorID = creatorID
        task.resourceType = resourceType
        task.transferAmount = transferAmount

        task.transferTargetIDs = transferTargetIDs

        // Set a value for the creator's ID if it doesn't exist, then assign the taskID and repsonder state

        generalFuncs.advancedGetValue(creatorID, {}).createdTasks[task.ID] = false

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}

export interface RoomPickupTask extends RoomTask {
    resourceType: ResourceConstant
    pickupAmount: number
}

export class RoomPickupTask {
    constructor(roomName: string, creatorID: string, resourceType: ResourceConstant, pickupAmount: number) {

        const task = this

        // Default properties

        task.type = 'deliver'
        task.ID = generalFuncs.newID()

        // Assign paramaters

        task.creatorID = creatorID
        task.resourceType = resourceType
        task.pickupAmount = pickupAmount

        // Set a value for the creator's ID if it doesn't exist, then assign the taskID and repsonder state

        generalFuncs.advancedGetValue(creatorID, {}).createdTasks[task.ID] = false

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}

export interface RoomPullTask extends RoomTask {
    targetName: string
    targetPos: RoomPosition
}

export class RoomPullTask {
    constructor(roomName: string, creatorID: string, targetName: string, targetPos: RoomPosition) {

        const task = this

        // Default properties

        task.type = 'pull'
        task.ID = generalFuncs.newID()

        // Assign paramaters

        task.creatorID = creatorID
        task.targetName = targetName
        task.targetPos = targetPos

        // Set a value for the creator's ID if it doesn't exist, then assign the taskID and repsonder state

        generalFuncs.advancedGetValue(creatorID, { createdTasks: {} }).createdTasks[task.ID] = false

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}
