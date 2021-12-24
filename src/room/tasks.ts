export interface RoomTask {
    type: string
    ID: number
}

export interface RoomDeliverTask extends RoomTask {
    resourceType: ResourceConstant
    deliverAmount: number
    withdrawTargetID: string | undefined
    transferTargetID: string
}

export class RoomDeliverTask {
    constructor(resourceType: ResourceConstant, deliverAmount: number, withdrawTargetID: string | undefined, transferTargetID: string) {

        const task: RoomDeliverTask = this

        // Default properties

        task.type = 'transfer'
        task.ID = global.newID()

        // Assign paramaters

        task.resourceType = resourceType
        task.deliverAmount = deliverAmount

        task.withdrawTargetID = withdrawTargetID
        task.transferTargetID = transferTargetID
    }
}

export interface RoomPullTask extends RoomTask {
    targetName: string
    targetPos: RoomPosition
}

export class RoomPullTask {
    constructor(targetName: string, targetPos: RoomPosition) {

        const task: RoomPullTask = this

        // Default properties

        task.type = 'transfer'
        task.ID = global.newID()

        // Assign paramaters

        task.targetName = targetName
        task.targetPos = targetPos
    }
}
