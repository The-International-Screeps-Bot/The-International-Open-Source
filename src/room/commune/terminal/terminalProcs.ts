import { CollectiveManager } from 'international/collective'
import { Result } from 'international/constants'
import { MarketManager } from 'international/market/marketOrders'
import { simpleAllies } from 'international/simpleAllies/simpleAllies'
import { StructureUtils } from 'room/structureUtils'
import { customLog } from 'utils/logging'
import { newID, Utils } from 'utils/utils'
import { ResourceTargets } from '../commune'
import { tradingUtils } from './tradingUtils'
import { ResourceRequest } from 'international/simpleAllies/types'

export class TerminalProcs {
  preTickRun(room: Room) {
    if (!room.terminal) return
    if (!StructureUtils.isRCLActionable(room.terminal)) return

    const resourceTargets = room.communeManager.resourceTargets

    this.createTerminalRequests(room, resourceTargets)
  }

  run(room: Room) {
    // Stop if there is no terminal
    if (!room.terminal) return
    if (!StructureUtils.isRCLActionable(room.terminal)) return
    if (room.terminal.cooldown > 0) return

    const resourceTargets = room.communeManager.resourceTargets

    if (this.respondToTerminalRequests(room, resourceTargets) === Result.action) return
    if (this.respondToAllyRequests(room, resourceTargets) === Result.action) return

    // Check if the market is disabled by us or the server

    if (!global.settings.marketUsage) return
    // only run every terminal cooldown interval, to have every terminal share the same required data (reduces CPU costs)
    if (Utils.isTickInterval(TERMINAL_COOLDOWN)) return
    if (!MarketManager.isMarketFunctional) return

    if (this.manageResources(room, resourceTargets) === Result.action) return
  }

  private createTerminalRequests(room: Room, resourceTargets: ResourceTargets) {
    const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures
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

      CollectiveManager.terminalRequests[ID] = {
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
    const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures
    const storedEnergy = resourcesInStoringStructures[RESOURCE_ENERGY]
    const budget = Math.min(
      storedEnergy - room.communeManager.minStoredEnergy,
      room.terminal.store.getUsedCapacity(RESOURCE_ENERGY),
    )

    let lowestScore = Infinity
    let bestRequestID: string
    let bestRequest: TerminalRequest
    let amount: number

    for (const ID in CollectiveManager.terminalRequests) {
      const request = CollectiveManager.terminalRequests[ID]

      // Don't respond to requests for this room
      if (request.roomName === room.name) continue
      if (resourceTargets.min[request.resource] === undefined) continue

      const storedResource = resourcesInStoringStructures[request.resource] || 0
      /*       const minStoredResource = resourceTargets.min[request.resource] * 1.1
      if (storedResource <= minStoredResource) continue */

      const ourPriority = Math.max(
        tradingUtils.getPriority(storedResource, resourceTargets.min[request.resource]),
        0,
      )
      // Our priority should be lower
      if (ourPriority >= request.priority) continue
      const priorityDiff = request.priority - ourPriority
      // The request's priority must be 10% greater than our own
      if (priorityDiff < 0.15) continue

      const equivalentAmount = tradingUtils.getAmountFromPriority(
        request.priority,
        resourceTargets.min[request.resource],
      )

      const equivalentPriority = tradingUtils.getPriority(
        equivalentAmount,
        resourceTargets.min[request.resource],
      )

      const consequentSend = storedResource - equivalentAmount

      customLog(
        'TERMINAL SEND SPECIAL VALUES',
        `${equivalentAmount} vs ${storedResource} vs ${
          Game.rooms[request.roomName].roomManager.resourcesInStoringStructures[request.resource]
        }, ${request.amount}, ${equivalentPriority} vs ${request.priority}, ${consequentSend}`,
      )

      if (consequentSend < request.amount) continue

      const maxSendAmount = Math.floor(
        Math.min(
          storedResource * priorityDiff,
          request.amount,
          room.terminal.store.getUsedCapacity(request.resource),
          equivalentAmount,
        ),
      )

      const sendAmount =
        tradingUtils.findLargestTransactionAmount(
          budget,
          maxSendAmount,
          room.name,
          request.roomName,
        ) / 2
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
          ourPriority +
          ', ' +
          (storedResource - request.amount) +
          ', ' +
          (storedResource - request.amount) * priorityDiff +
          ', ' +
          tradingUtils.getAmountFromPriority(priorityDiff, resourceTargets.min[request.resource]),
      )
      // Make sure we are fulfilling at least 10% of the request
      if (request.amount * 0.1 > sendAmount) continue

      const score =
        Game.map.getRoomLinearDistance(room.name, request.roomName) + request.priority * 100
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
    if (room.roomManager.resourcesInStoringStructures.energy < room.communeManager.minStoredEnergy)
      return Result.noAction

    const [request, ID, amount] = this.findBestTerminalRequest(room, resourceTargets)
    if (!request) return Result.noAction

    room.terminal.send(request.resource, amount, request.roomName, 'Terminal request')

    // Consequences

    delete CollectiveManager.terminalRequests[ID]
    room.terminal.intended = true
    return Result.action
  }

  private findBestAllyRequest(
    room: Room,
    resourceTargets: ResourceTargets,
  ): [ResourceRequest, number] {
    const resourcesInStoringStructures = room.roomManager.resourcesInStoringStructures
    const minStoredEnergy = resourceTargets.min[RESOURCE_ENERGY] * 1.1
    const storedEnergy = resourcesInStoringStructures[RESOURCE_ENERGY]
    const budget = Math.min(storedEnergy - minStoredEnergy, room.terminal.store[RESOURCE_ENERGY])

    let lowestScore = Infinity
    let bestRequestID: string
    let bestRequest: ResourceRequest
    let amount: number

    const allyResourceRequests = simpleAllies.allySegmentData.requests.resource
    for (const request of allyResourceRequests) {
      // Don't respond to requests for this room
      if (request.roomName === room.name) continue
      if (resourceTargets.min[request.resourceType] === undefined) continue
      if (Math.floor(request.amount) <= 0) continue

      const minStoredResource = resourceTargets.min[request.resourceType] * 1.1
      const storedResource = resourcesInStoringStructures[request.resourceType] || 0
      if (storedResource <= minStoredResource) continue

      const sendAmount = tradingUtils.findLargestTransactionAmount(
        budget,
        Math.min(request.amount, storedResource - minStoredResource),
        room.name,
        request.roomName,
      )

      // Make sure we are fulfilling at least 10% of the request
      if (request.amount * 0.1 > sendAmount) continue

      const score =
        Game.map.getRoomLinearDistance(room.name, request.roomName) + request.priority * 100
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

    if (room.roomManager.resourcesInStoringStructures.energy < room.communeManager.minStoredEnergy)
      return false

    const [request, amount] = this.findBestAllyRequest(room, resourceTargets)
    if (!request) return Result.noAction

    room.terminal.send(request.resourceType, amount, request.roomName, 'Ally request')

    // Consequences

    room.terminal.intended = true

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
      if (Game.market.credits < CollectiveManager.minCredits) return Result.noAction

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

export const terminalProcs = new TerminalProcs()
