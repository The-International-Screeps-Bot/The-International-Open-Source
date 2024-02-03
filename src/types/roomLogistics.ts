import { CreepLogisticsRequestKeys, RoomLogisticsRequestTypes } from '../constants/general'

export type RoomLogisticsTargets = AnyStoreStructure | Creep | Tombstone | Ruin | Resource

export interface CreepLogisticsRequest {
  [CreepLogisticsRequestKeys.type]: RoomLogisticsRequestTypes
  [CreepLogisticsRequestKeys.target]: Id<RoomLogisticsTargets>
  [CreepLogisticsRequestKeys.resourceType]: ResourceConstant
  [CreepLogisticsRequestKeys.amount]: number
  [CreepLogisticsRequestKeys.onlyFull]?: boolean
  [CreepLogisticsRequestKeys.noReserve]?: boolean
  [CreepLogisticsRequestKeys.delivery]?: boolean
}

export interface RoomLogisticsRequest {
  ID: string
  type: RoomLogisticsRequestTypes
  /**
   * Consider in weighting the task, lower is more preffered
   */
  priority?: number
  targetID: Id<RoomLogisticsTargets>
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
  /**
   * If true, responders have to be in range 1 on acceptance of the task
   */
  passive?: boolean
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
  target: RoomLogisticsTargets
  resourceType?: ResourceConstant
  onlyFull?: boolean
  /**
   * Lower priority is more preferable. Priority infleunces preference for one request over another. 1 priority = 1 more range consideration
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
  noDelivery?: boolean
  /**
   * DO NOT USE THIS TO COMMAND CERTAIN RESOURCETYPES, instead use resourceTypes
   */
  conditions?(request: RoomLogisticsRequest): any
}
