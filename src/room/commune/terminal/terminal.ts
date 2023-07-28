import { minerals, Result, RoomMemoryKeys, terminalResourceTargets } from 'international/constants'
import { customLog, findLargestTransactionAmount, newID, roundTo } from 'international/utils'
import './marketFunctions'
import { allyRequestManager, AllyRequest, AllyRequestTypes } from 'international/AllyRequests'
import { collectiveManager } from 'international/collective'
import { CommuneManager } from 'room/commune/commune'

export class TerminalManager {
    communeManager: CommuneManager
    room: Room
    terminal: StructureTerminal

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        const { terminal } = this.communeManager.room
        if (!terminal) return
        if (!terminal.RCLActionable) return

        this.createTerminalRequests()
    }

    private createTerminalRequests() {
        const { room } = this.communeManager
        const { terminal } = room

        for (const key in terminalResourceTargets) {
            const resource = key as ResourceConstant
            const resourceTarget = terminalResourceTargets[resource]
            let targetAmount = resourceTarget.min(this.communeManager)
            if (targetAmount <= 0) continue
            if (resourceTarget.conditions && !resourceTarget.conditions(this.communeManager))
                continue

            // We have enough

            const storedResourceAmount =
                this.communeManager.room.resourcesInStoringStructures[resource] || 0
            if (storedResourceAmount >= targetAmount) continue

            targetAmount = Math.floor(targetAmount * 1.1)
            const priority = roundTo(1 - storedResourceAmount / targetAmount, 2)
            const amount = Math.min(
                targetAmount - storedResourceAmount,
                terminal.store.getFreeCapacity(),
            )

            // If we have allies to trade with, alternate requesting eveyr tick

            allyRequestManager.requestResource(room.name, resource, amount, priority)

            const ID = newID()

            collectiveManager.terminalRequests[ID] = {
                ID,
                priority,
                resource: resource,
                amount,
                roomName: room.name,
            }
        }
    }

    run() {
        const { room } = this.communeManager
        const { terminal } = room

        // Stop if there is no terminal

        if (!terminal) return
        if (!terminal.RCLActionable) return

        /* this.createAllyRequests() */

        if (terminal.cooldown > 0) return

        if (this.respondToTerminalRequests()) return
        if (this.respondToAllyRequests()) return

        // The market is disabled by us or the server

        if (!global.settings.marketUsage) return
        if (!collectiveManager.marketIsFunctional) return

        this.manageResources()
    }
    findBestTerminalRequest(): [TerminalRequest, number] {
        const budget = Math.min(
            this.communeManager.room.resourcesInStoringStructures.energy -
                this.communeManager.minStoredEnergy,
            this.communeManager.room.terminal.store[RESOURCE_ENERGY],
        )

        let lowestScore = Infinity
        let bestRequest: TerminalRequest
        let amount: number

        for (const ID in collectiveManager.terminalRequests) {
            const request = collectiveManager.terminalRequests[ID]

            // Don't respond to requests for this room

            if (request.roomName === this.communeManager.room.name) continue

            // Ensure we have more than the asking amount

            const newAmount = findLargestTransactionAmount(
                budget,
                Math.min(
                    request.amount,
                    this.communeManager.room.resourcesInStoringStructures[request.resource] -
                        terminalResourceTargets[request.resource]?.min(this.communeManager) || 0,
                ),
                this.communeManager.room.name,
                request.roomName,
            )
            if (newAmount / request.amount < 0.25) continue

            const score =
                Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) +
                request.priority * 100
            if (score >= lowestScore) continue

            amount = newAmount
            bestRequest = request
            lowestScore = score
        }

        return [bestRequest, amount]
    }

    private respondToTerminalRequests() {
        // We don't have enough energy to help other rooms

        if (
            this.communeManager.room.resourcesInStoringStructures.energy <
            this.communeManager.minStoredEnergy
        )
            return false

        const [request, amount] = this.findBestTerminalRequest()
        if (!request) return false

        this.communeManager.room.terminal.send(
            request.resource,
            amount,
            request.roomName,
            'Terminal request',
        )
        delete collectiveManager.terminalRequests[request.ID]
        this.communeManager.room.terminal.intended = true
        return true
    }

    private findBestAllyRequest(): [AllyRequest, number] {
        const budget = Math.min(
            this.communeManager.room.resourcesInStoringStructures.energy -
                this.communeManager.minStoredEnergy,
            this.communeManager.room.terminal.store[RESOURCE_ENERGY],
        )

        let lowestScore = Infinity
        let bestRequest: AllyRequest
        let amount: number

        // Filter out allyRequests that are requesting resources

        const resourceRequests = allyRequestManager.allyRequests.resource

        for (const ID in resourceRequests) {
            const request = resourceRequests[ID]

            // Ensure we have more than the asking amount

            const newAmount = findLargestTransactionAmount(
                budget,
                Math.min(
                    request.maxAmount,
                    this.communeManager.room.resourcesInStoringStructures[request.resourceType] -
                        terminalResourceTargets[request.resourceType]?.min(this.communeManager) ||
                        0,
                ),
                this.communeManager.room.name,
                request.roomName,
            )
            if (newAmount / request.maxAmount < 0.25) continue

            const score =
                Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) +
                request.priority * 100
            if (score >= lowestScore) continue

            amount = newAmount
            bestRequest = request
            lowestScore = score
        }

        return [bestRequest, amount]
    }

    private respondToAllyRequests() {
        if (!global.settings.allyTrading) return Result.noAction

        // We don't have enough energy to help other rooms

        if (
            this.communeManager.room.resourcesInStoringStructures.energy <
            this.communeManager.minStoredEnergy
        )
            return false

        const [request, amount] = this.findBestAllyRequest()
        if (!request) return Result.noAction

        this.communeManager.room.terminal.send(
            request.resourceType,
            amount,
            request.roomName,
            'Ally request',
        )
        this.communeManager.room.terminal.intended = true

        // Remove the request so other rooms don't try to respond to it

        delete allyRequestManager._allyRequests.resource[request.ID]
        return Result.action
    }

    private manageResources() {
        const { room } = this.communeManager
        const { terminal } = room

        for (const key in terminalResourceTargets) {
            const resource = key as ResourceConstant
            const resourceTarget = terminalResourceTargets[resource]
            if (resourceTarget.conditions && !resourceTarget.conditions(this.communeManager))
                continue

            let min = resourceTarget.min(this.communeManager)

            // We don't have enough

            if (terminal.store[resource] < min) {
                if (Game.market.credits < collectiveManager.minCredits) continue

                min *= 1.2

                if (room.advancedBuy(resource, min - terminal.store[resource], min)) return
                continue
            }

            let max = resourceTarget.max(this.communeManager)

            // We have enough

            if (terminal.store[resource] < max) continue

            max *= 0.8

            // Try to sell the excess amount

            if (room.advancedSell(resource, terminal.store[resource] - max, max)) return
        }
    }
}
