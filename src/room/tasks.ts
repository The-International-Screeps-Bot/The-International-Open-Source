export interface RoomTask {
    type: string
    ID: number
}

export interface RoomWithdrawTask extends RoomTask {
    targetID: string
    resourceType: ResourceConstant
    withdrawAmount: number
}

export class RoomWithdrawTask {
    constructor(targetID: string, resourceType: ResourceConstant, withdrawAmount: number) {

        const task: RoomWithdrawTask = this

        // Default properties

        task.type = 'withdraw'
        task.ID = global.newID()

        // Assign paramaters

        task.targetID = targetID
        task.resourceType = resourceType
        task.withdrawAmount = withdrawAmount
    }
}

export interface RoomTransferTask extends RoomTask {
    targetIDs: string[]
    resourceType: ResourceConstant
    transferAmount: number
}

export class RoomTransferTask {
    constructor(targetIDs: string[], resourceType: ResourceConstant, transferAmount: number) {

        const task: RoomTransferTask = this

        // Default properties

        task.type = 'transfer'
        task.ID = global.newID()

        // Assign paramaters

        task.targetIDs = targetIDs
        task.resourceType = resourceType
        task.transferAmount = transferAmount
    }
}

export interface RoomPullTask extends RoomTask {
    targetID: string
    targetPos: Pos
}

export class RoomPullTask {
    constructor(targetID: string, targetPos: Pos) {

        const task: RoomPullTask = this

        // Default properties

        task.type = 'transfer'
        task.ID = global.newID()

        // Assign paramaters

        task.targetID = targetID
        task.targetPos = targetPos
    }
}
