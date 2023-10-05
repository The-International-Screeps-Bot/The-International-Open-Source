import {
    CombatRequestKeys,
    CreepRoomLogisticsRequestKeys,
    DepositRequestKeys,
    HaulRequestKeys,
    NukeRequestKeys,
    PowerRequestKeys,
    RoomLogisticsRequestTypes,
    WorkRequestKeys,
} from 'international/constants'

export interface CreepRoomLogisticsRequest {
    [CreepRoomLogisticsRequestKeys.type]: RoomLogisticsRequestTypes
    [CreepRoomLogisticsRequestKeys.target]: Id<
        AnyStoreStructure | Creep | Tombstone | Ruin | Resource
    >
    [CreepRoomLogisticsRequestKeys.resourceType]: ResourceConstant
    [CreepRoomLogisticsRequestKeys.amount]: number
    [CreepRoomLogisticsRequestKeys.onlyFull]?: boolean
    [CreepRoomLogisticsRequestKeys.noReserve]?: boolean
}

export interface RoomLogisticsRequest {
    ID: string
    type: RoomLogisticsRequestTypes
    /**
     * Consider in weighting the task, lower is more preffered
     */
    priority?: number
    targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
    resourceType: ResourceConstant
    amount: number
    /**
     * If the responder should only take the task if it will use its full capacity. Default is true
     */
    onlyFull?: boolean
    /**
     * The ID of a roomLogisticsTask or store structure
     */
    delivery?: Id<AnyStoreStructure> | string
    /**
     * Wether the responder should interact with reserveStore of the target
     */
    noReserve?: boolean
    // /**
    //  * The estimated income, positive or negative that is expected per tick for the request target
    //  */
    // income?: number
    // /**
    //  * The amount for the potential or actual responding creep
    //  */
    // personalAmount?: number
}

export interface CreateRoomLogisticsRequestArgs {
    type: RoomLogisticsRequestTypes
    target: AnyStoreStructure | Creep | Tombstone | Ruin | Resource
    resourceType?: ResourceConstant
    onlyFull?: boolean
    /**
     * Lower priority is more preferable
     */
    priority?: number
    maxAmount?: number
}

export interface FindNewRoomLogisticsRequestArgs {
    types?: Set<RoomLogisticsRequestTypes>
    /**
     * Use this to command certain resourceTypes
     */
    resourceTypes?: Set<ResourceConstant>
    /**
     * DO NOT USE THIS TO COMMAND CERTAIN RESOURCETYPES, instead use resourceTypes
     */
    conditions?(request: RoomLogisticsRequest): any
}

export interface PowerRequest {
    [PowerRequestKeys.target]: Id<Structure | Source>
    [PowerRequestKeys.type]: PowerConstant
    [PowerRequestKeys.cooldown]: number
}

export interface PowerTask {
    taskID: string
    targetID: Id<Structure | Source>
    powerType: PowerConstant
    packedCoord: string
    cooldown: number
    priority: number
}
