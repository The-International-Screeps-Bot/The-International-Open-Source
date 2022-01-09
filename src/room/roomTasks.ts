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

export interface RoomDeliverTask extends RoomTask {
    resourceType: ResourceConstant
    deliverAmount: number
    withdrawTargetID: string | undefined
    transferTargetID: string
}

export class RoomDeliverTask {
    constructor(roomName: string, creatorID: string, resourceType: ResourceConstant, deliverAmount: number, withdrawTargetID: string | undefined, transferTargetID: string) {

        const task: RoomDeliverTask = this

        // Default properties

        task.type = 'deliver'
        task.ID = generalFuncs.newID()

        // Assign paramaters

        task.creatorID = creatorID
        task.resourceType = resourceType
        task.deliverAmount = deliverAmount

        task.withdrawTargetID = withdrawTargetID
        task.transferTargetID = transferTargetID

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

        const task: RoomPullTask = this

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
