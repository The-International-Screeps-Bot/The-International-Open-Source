import { minerals, Result, RoomMemoryKeys, RoomStatsKeys } from 'international/constants'
import { customLog } from 'utils/logging'
import { newID, roundTo, utils } from 'utils/utils'
import './tradingUtils'
import {
  simpleAllies,
  AllyRequestTypes,
  ResourceRequest,
} from 'international/simpleAllies/simpleAllies'
import { collectiveManager } from 'international/collective'
import { CommuneManager, ResourceTargets } from 'room/commune/commune'
import { tradingUtils } from './tradingUtils'
import { marketManager } from 'international/market/marketOrders'

export class TerminalManager {
  communeManager: CommuneManager
  room: Room
  terminal: StructureTerminal

  constructor(communeManager: CommuneManager) {
    this.communeManager = communeManager
  }

  preTickRun() {
    const room = this.communeManager.room
    if (!room.terminal) return
    if (!room.terminal.isRCLActionable) return

    const resourceTargets = this.communeManager.resourceTargets

    this.createTerminalRequests(room, resourceTargets)
  }

  run() {
    const { room } = this.communeManager

    // Stop if there is no terminal
    if (!room.terminal) return
    if (!room.terminal.isRCLActionable) return
    if (room.terminal.cooldown > 0) return

    const resourceTargets = this.communeManager.resourceTargets

    if (this.respondToTerminalRequests(room, resourceTargets) === Result.action) return
    if (this.respondToAllyRequests(room, resourceTargets) === Result.action) return

    // Check if the market is disabled by us or the server

    if (!global.settings.marketUsage) return
    // only run every terminal cooldown interval, to have every terminal share the same required data (reduces CPU costs)
    if (utils.isTickInterval(TERMINAL_COOLDOWN)) return
    if (!marketManager.isMarketFunctional) return

    if (this.manageResources(room, resourceTargets) === Result.action) return
  }

  private createTerminalRequests(room: Room, resourceTargets: ResourceTargets) {
    const resourcesInStoringStructures =
      this.communeManager.room.roomManager.resourcesInStoringStructures
    for (const key in resourceTargets.min) {
      const resourceType = key as ResourceConstant
      let targetAmount = resourceTargets.min[resourceType]
      if (targetAmount <= 0) continue

      // We have enough

      const storedResourceAmount = resourcesInStoringStructures[resourceType] || 0
      if (storedResourceAmount >= targetAmount) continue

      targetAmount = Math.floor(targetAmount * 1.1)
      const priority = tradingUtils.getPriority(storedResourceAmount, targetAmount)
      const amount = Math.min(
        targetAmount - storedResourceAmount,
        room.terminal.store.getFreeCapacity(),
      )

      const ID = newID()

      collectiveManager.terminalRequests[ID] = {
        priority,
        resource: resourceType,
        amount,
        roomName: room.name,
      }
    }
  }

  private findBestTerminalRequest(
    room: Room,
    resourceTargets: ResourceTargets,
  ): [TerminalRequest, string, number] {
    const resourcesInStoringStructures =
      this.communeManager.room.roomManager.resourcesInStoringStructures
    const storedEnergy = resourcesInStoringStructures[RESOURCE_ENERGY]
    const budget = Math.min(
      storedEnergy - this.communeManager.minStoredEnergy,
      this.communeManager.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY),
    )

    let lowestScore = Infinity
    let bestRequestID: string
    let bestRequest: TerminalRequest
    let amount: number

    for (const ID in collectiveManager.terminalRequests) {
      const request = collectiveManager.terminalRequests[ID]

      // Don't respond to requests for this room
      if (request.roomName === this.communeManager.room.name) continue
      if (resourceTargets.min[request.resource] === undefined) continue

      const storedResource = resourcesInStoringStructures[request.resource] || 0
      /*       const minStoredResource = resourceTargets.min[request.resource] * 1.1
      if (storedResource <= minStoredResource) continue */

      const ourPriority = tradingUtils.getPriority(
        storedResource,
        resourceTargets.min[request.resource],
      )
      // Our priority should be lower
      if (ourPriority >= request.priority) continue
      const priorityDiff = request.priority - ourPriority
      // The request's priority must be 10% greater than our own
      if (priorityDiff < 0.1) continue

      const maxSendAmount = Math.floor(
        Math.min(
          storedResource * priorityDiff,
          request.amount,
          room.terminal.store.getUsedCapacity(request.resource) / 2,
        ),
      )

      const sendAmount = tradingUtils.findLargestTransactionAmount(
        budget,
        maxSendAmount,
        this.communeManager.room.name,
        request.roomName,
      )
      customLog(
        'TERMINAL REQUEST ' + request.resource,
        maxSendAmount +
          ' ,' +
          sendAmount +
          ', ' +
          storedResource * priorityDiff +
          ', ' +
          priorityDiff +
          ', ' +
          (storedResource - request.amount) +
          ', ' +
          (storedResource - request.amount) * priorityDiff + ', ' +
          tradingUtils.getTargetAmountFromPriority(priorityDiff, storedResource)
      )
      // Make sure we are fulfilling at least 10% of the request
      if (request.amount * 0.1 > sendAmount) continue

      const score =
        Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) +
        request.priority * 100
      if (score >= lowestScore) continue

      amount = sendAmount
      bestRequest = request
      bestRequestID = ID
      lowestScore = score
    }

    return [bestRequest, bestRequestID, amount]
  }

  private respondToTerminalRequests(room: Room, resourceTargets: ResourceTargets) {
    // We don't have enough energy to help other rooms
    if (
      this.communeManager.room.roomManager.resourcesInStoringStructures.energy <
      this.communeManager.minStoredEnergy
    )
      return Result.noAction

    const [request, ID, amount] = this.findBestTerminalRequest(room, resourceTargets)
    if (!request) return Result.noAction

    this.communeManager.room.terminal.send(
      request.resource,
      amount,
      request.roomName,
      'Terminal request',
    )

    // Consequences

    request.amount -= amount

    delete collectiveManager.terminalRequests[ID]
    this.communeManager.room.terminal.intended = true
    return Result.action
  }

  private findBestAllyRequest(
    room: Room,
    resourceTargets: ResourceTargets,
  ): [ResourceRequest, number] {
    const resourcesInStoringStructures =
      this.communeManager.room.roomManager.resourcesInStoringStructures
    const minStoredEnergy = resourceTargets.min[RESOURCE_ENERGY] * 1.1
    const storedEnergy = resourcesInStoringStructures[RESOURCE_ENERGY]
    const budget = Math.min(
      storedEnergy - minStoredEnergy,
      this.communeManager.room.terminal.store[RESOURCE_ENERGY],
    )

    let lowestScore = Infinity
    let bestRequestID: string
    let bestRequest: ResourceRequest
    let amount: number

    const allyResourceRequests = simpleAllies.allySegmentData.requests.resource
    for (const request of allyResourceRequests) {
      // Don't respond to requests for this room
      if (request.roomName === this.communeManager.room.name) continue
      if (resourceTargets.min[request.resourceType] === undefined) continue
      if (Math.floor(request.amount) <= 0) continue

      const minStoredResource = resourceTargets.min[request.resourceType] * 1.1
      const storedResource = resourcesInStoringStructures[request.resourceType] || 0
      if (storedResource <= minStoredResource) continue

      const sendAmount = tradingUtils.findLargestTransactionAmount(
        budget,
        Math.min(request.amount, storedResource - minStoredResource),
        this.communeManager.room.name,
        request.roomName,
      )

      // Make sure we are fulfilling at least 10% of the request
      if (request.amount * 0.1 > sendAmount) continue

      const score =
        Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) +
        request.priority * 100
      if (score >= lowestScore) continue

      amount = sendAmount
      bestRequest = request
      lowestScore = score
    }

    return [bestRequest, amount]
  }

  private respondToAllyRequests(room: Room, resourceTargets: ResourceTargets) {
    if (!global.settings.allyCommunication) return Result.noAction
    if (!simpleAllies.allySegmentData) return Result.noAction
    if (!simpleAllies.allySegmentData.requests) return Result.noAction

    // We don't have enough energy to help other rooms

    if (
      this.communeManager.room.roomManager.resourcesInStoringStructures.energy <
      this.communeManager.minStoredEnergy
    )
      return false

    const [request, amount] = this.findBestAllyRequest(room, resourceTargets)
    if (!request) return Result.noAction

    this.communeManager.room.terminal.send(
      request.resourceType,
      amount,
      request.roomName,
      'Ally request',
    )

    // Consequences

    this.communeManager.room.terminal.intended = true

    request.amount -= amount
    return Result.action
  }

  private manageResources(room: Room, resourceTargets: ResourceTargets) {
    for (const key in resourceTargets.min) {
      const resourceType = key as ResourceConstant

      if (this.manageResource(room, resourceType, resourceTargets) === Result.action) {
        return Result.action
      }
    }

    return Result.noAction
  }

  private manageResource(
    room: Room,
    resourceType: ResourceConstant,
    resourceTargets: ResourceTargets,
  ) {
    let min = resourceTargets.min[resourceType]

    // We don't have enough

    if (room.terminal.store[resourceType] < min * 1.1) {
      if (Game.market.credits < collectiveManager.minCredits) return Result.noAction

      if (
        tradingUtils.advancedBuy(room, resourceType, min - room.terminal.store[resourceType]) ===
        Result.success
      ) {
        return Result.action
      }

      return Result.noAction
    }

    let max = resourceTargets.max[resourceType]

    // If we don't have too much, stop

    if (room.terminal.store[resourceType] * 1.1 < max) return Result.noAction

    // Try to sell the excess amount
    if (
      tradingUtils.advancedSell(room, resourceType, room.terminal.store[resourceType] - max) ===
      Result.success
    ) {
      return Result.action
    }

    return Result.noAction
  }
}
