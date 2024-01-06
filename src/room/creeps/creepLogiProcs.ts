import { CreepMemoryKeys, CreepRoomLogisticsRequestKeys, RoomLogisticsRequestTypes, FlagNames } from "international/constants"
import { CreepRoomLogisticsRequest, RoomLogisticsTargets } from "types/roomRequests"
import { customLog } from "utils/logging"
import { findObjectWithID } from "utils/utils"

export class CreepLogiProcs {
  updateLogisticsRequests(creep: Creep) {
    const creepMemory = Memory.creeps[creep.name]
    if (!creepMemory[CreepMemoryKeys.roomLogisticsRequests]) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests] = []
      return
    }
    if (!creepMemory[CreepMemoryKeys.roomLogisticsRequests].length) return
/*
    for (let i = creepMemory[CreepMemoryKeys.roomLogisticsRequests].length - 1; i >= 0; i--) {
      const request = creepMemory[CreepMemoryKeys.roomLogisticsRequests][i]
      const target = findObjectWithID(request[CreepRoomLogisticsRequestKeys.target])
      if (target) continue

      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(i, 1)
    }
 */
    const request = creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
    if (!request) return

    const target = findObjectWithID(request[CreepRoomLogisticsRequestKeys.target])
    if (!target) {

      if (request[CreepRoomLogisticsRequestKeys.delivery]) {
        creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 2)
        return
      }

      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return
    }

    // requests where they are delivering
    if (request[CreepRoomLogisticsRequestKeys.delivery]) {
      this.updateDeliverLogisticsRequest(
        creep,
        request,
        creepMemory[CreepMemoryKeys.roomLogisticsRequests][1],
        target
      )
      return
    }

    // transfer requests
    if (request[CreepRoomLogisticsRequestKeys.type] === RoomLogisticsRequestTypes.transfer) {
      this.updateTransferLogisticsRequest(creep, request)
      return
    }

    // If pickup type
    if (target instanceof Resource) {
      this.updatePickupLogisticsRequest(creep, request, target)
      return
    }

    // Withdraw or offer type
    this.updateWithdrawLogisticsRequest(creep, request, target)
    return
  }

  /**
   *
   * @returns false if the request was deleted
   */
  private updateTransferLogisticsRequest(creep: Creep, request: CreepRoomLogisticsRequest) {
    const creepMemory = Memory.creeps[creep.name]
    const target = findObjectWithID(request[CreepRoomLogisticsRequestKeys.target])

    // Delete the request if the target is fulfilled

    if (target.freeNextStore < request[CreepRoomLogisticsRequestKeys.amount]) {
      if (Game.flags[FlagNames.debugCreepLogistics])
        customLog(
          'not enough free store',
          creep.name +
            ', ' +
            request[CreepRoomLogisticsRequestKeys.target] +
            ', ' +
            target.freeNextStore +
            ' < ' +
            request[CreepRoomLogisticsRequestKeys.amount],
        )
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return false
    }

    request[CreepRoomLogisticsRequestKeys.amount] = Math.min(
      Math.min(
        creep.nextStore[request[CreepRoomLogisticsRequestKeys.resourceType]],
        target.freeNextStore,
      ),
      request[CreepRoomLogisticsRequestKeys.amount],
    )
    if (request[CreepRoomLogisticsRequestKeys.amount] <= 0) {
      if (Game.flags[FlagNames.debugCreepLogistics])
        customLog(
          'not enough amount',
          creep.name +
            ', ' +
            request[CreepRoomLogisticsRequestKeys.target] +
            ', ' +
            request[CreepRoomLogisticsRequestKeys.amount],
        )
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return false
    }

    if (!request[CreepRoomLogisticsRequestKeys.noReserve]) {
      target.reserveStore[request[CreepRoomLogisticsRequestKeys.resourceType]] +=
        request[CreepRoomLogisticsRequestKeys.amount]
    }

    return true
  }

  /**
   *
   * @returns false if the request was deleted
   */
  private updatePickupLogisticsRequest(
    creep: Creep,
    request: CreepRoomLogisticsRequest,
    target: Resource,
  ) {
    const creepMemory = Memory.creeps[creep.name]

    // Update in accordance to potential resource decay

    request[CreepRoomLogisticsRequestKeys.amount] = Math.min(
      Math.min(creep.freeNextStore, target.nextAmount),
      request[CreepRoomLogisticsRequestKeys.amount],
    )
    if (request[CreepRoomLogisticsRequestKeys.amount] <= 0) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return false
    }

    if (!request[CreepRoomLogisticsRequestKeys.noReserve]) {
      target.reserveAmount -= request[CreepRoomLogisticsRequestKeys.amount]
    }

    return true
  }

  /**
   *
   * @returns false if the request was deleted
   */
  private updateWithdrawLogisticsRequest(
    creep: Creep,
    request: CreepRoomLogisticsRequest,
    target: RoomLogisticsTargets,
  ) {
    const creepMemory = Memory.creeps[creep.name]

    // Delete the request if the target doesn't have what we need
    if (
      target.nextStore[request[CreepRoomLogisticsRequestKeys.resourceType]] <
      request[CreepRoomLogisticsRequestKeys.amount]
    ) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return false
    }

    request[CreepRoomLogisticsRequestKeys.amount] = Math.min(
      Math.min(
        creep.freeNextStore,
        target.nextStore[request[CreepRoomLogisticsRequestKeys.resourceType]],
      ),
      request[CreepRoomLogisticsRequestKeys.amount],
    )
    if (request[CreepRoomLogisticsRequestKeys.amount] <= 0) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 1)
      return false
    }

    if (!request[CreepRoomLogisticsRequestKeys.noReserve]) {
      target.reserveStore[request[CreepRoomLogisticsRequestKeys.resourceType]] -=
        request[CreepRoomLogisticsRequestKeys.amount]
    }

    return true
  }

  /**
   * update both request pairs of the deliver request
   * @param creep
   * @param request pickup, withdraw or offer to get sufficient resources
   * @param deliverToRequest transfer to delivery target
   */
  private updateDeliverLogisticsRequest(
    creep: Creep,
    request: CreepRoomLogisticsRequest,
    deliverToRequest: CreepRoomLogisticsRequest,
    target: RoomLogisticsTargets
  ) {
    const creepMemory = Memory.creeps[creep.name]

    const deliverTarget = findObjectWithID(deliverToRequest[CreepRoomLogisticsRequestKeys.target])
    if (!deliverTarget) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 2)
      return false
    }

    // If pickup type
    if (target instanceof Resource) {
      // Update in accordance to potential resource decay

      request[CreepRoomLogisticsRequestKeys.amount] = Math.min(
        Math.min(creep.freeNextStore, target.nextAmount),
        request[CreepRoomLogisticsRequestKeys.amount],
      )
      if (request[CreepRoomLogisticsRequestKeys.amount] <= 0) {
        creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 2)
        return false
      }

      if (!request[CreepRoomLogisticsRequestKeys.noReserve]) {
        target.reserveAmount -= request[CreepRoomLogisticsRequestKeys.amount]
        deliverTarget.reserveStore[request[CreepRoomLogisticsRequestKeys.resourceType]] += Math.min(
          deliverToRequest[CreepRoomLogisticsRequestKeys.amount],
          request[CreepRoomLogisticsRequestKeys.amount],
        )
      }

      return true
    }

    // Withdraw or offer

    // Delete the request if the target doesn't have what we need
    if (
      target.nextStore[request[CreepRoomLogisticsRequestKeys.resourceType]] <
      request[CreepRoomLogisticsRequestKeys.amount]
    ) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 2)
      return false
    }

    request[CreepRoomLogisticsRequestKeys.amount] = Math.min(
      Math.min(
        creep.freeNextStore,
        target.nextStore[request[CreepRoomLogisticsRequestKeys.resourceType]],
      ),
      request[CreepRoomLogisticsRequestKeys.amount],
    )
    if (request[CreepRoomLogisticsRequestKeys.amount] <= 0) {
      creepMemory[CreepMemoryKeys.roomLogisticsRequests].splice(0, 2)
      return false
    }

    if (!request[CreepRoomLogisticsRequestKeys.noReserve]) {
      target.reserveStore[request[CreepRoomLogisticsRequestKeys.resourceType]] -=
        request[CreepRoomLogisticsRequestKeys.amount]
      deliverTarget.reserveStore[request[CreepRoomLogisticsRequestKeys.resourceType]] += Math.min(
        deliverToRequest[CreepRoomLogisticsRequestKeys.amount],
        request[CreepRoomLogisticsRequestKeys.amount],
      )
    }

    return true
  }
}

export const creepLogiProcs = new CreepLogiProcs()
