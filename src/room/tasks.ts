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
    ID: number
}

export interface RoomDeliverTask extends RoomTask {
    resourceType: ResourceConstant
    deliverAmount: number
    withdrawTargetID: string | undefined
    transferTargetID: string
}

export class RoomDeliverTask {
    constructor(roomName: string, resourceType: ResourceConstant, deliverAmount: number, withdrawTargetID: string | undefined, transferTargetID: string) {

        const task: RoomDeliverTask = this

        // Default properties

        task.type = 'deliver'
        task.ID = global.newID()

        // Assign paramaters

        task.resourceType = resourceType
        task.deliverAmount = deliverAmount

        task.withdrawTargetID = withdrawTargetID
        task.transferTargetID = transferTargetID

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}

export interface RoomPullTask extends RoomTask {
    targetName: string
    targetPos: RoomPosition
}

export class RoomPullTask {
    constructor(roomName: string, targetName: string, targetPos: RoomPosition) {

        const task: RoomPullTask = this

        // Default properties

        task.type = 'pull'
        task.ID = global.newID()

        // Assign paramaters

        task.targetName = targetName
        task.targetPos = targetPos

        // Record the task in the room with the requested roomName

        global[roomName].tasksWithoutResponders[task.ID] = task
    }
}
