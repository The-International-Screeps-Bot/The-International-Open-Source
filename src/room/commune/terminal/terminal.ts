import {
    minerals,
    RESULT_ACTION,
    RESULT_NO_ACTION,
    RoomMemoryKeys,
    terminalResourceTargets,
} from 'international/constants'
import { customLog, findLargestTransactionAmount, newID, roundToDecimals } from 'international/utils'
import './marketFunctions'
import { allyManager, AllyRequest, AllyRequestTypes } from 'international/simpleAllies'
import { internationalManager } from 'international/international'
import { CommuneManager } from 'room/commune/commune'

const MAX_TRANSFER = 20000
const TERMINAL_MAX_FILL = 270000

const allowedSalesHistoryDeviation = 0.5
const allowedBuySellPriceRatio = 0.9

const npcRoomRegex = /^[WE][0-9]*0[NS][0-9]*0$/

function loadLocalMarketMemory() {
    let segment = JSON.parse(InterShardMemory.getLocal() || '{}')
    return segment.market || { departures: {} }
}

function loadRemoteMarketMemory(shardId: string) {
    let segment = JSON.parse(InterShardMemory.getRemote(shardId) || '{}')
    return segment.market || { departures: {} }
}

function storeLocalMarketMemory(memory: string) {
    let segment = JSON.parse(InterShardMemory.getLocal() || '{}')
    segment.market = memory
    InterShardMemory.setLocal(JSON.stringify(segment))
}

const tradeBlacklistRoomNames = [
    //Don't trade with myself.
    'W21N9',
    'W21N8',
    'W17N16',
]

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
            if (resourceTarget.conditions && !resourceTarget.conditions(this.communeManager)) continue

            // We have enough

            const storedResourceAmount = this.communeManager.room.resourcesInStoringStructures[resource] || 0
            if (storedResourceAmount >= targetAmount) continue

            targetAmount = Math.floor(targetAmount * 1.1)
            const priority = roundToDecimals(1 - storedResourceAmount / targetAmount, 2)
            const amount = Math.min(targetAmount - storedResourceAmount, terminal.store.getFreeCapacity())

            // If we have allies to trade with, alternate requesting eveyr tick

            allyManager.requestResource(room.name, resource, amount, priority)

            const ID = newID()

            internationalManager.terminalRequests[ID] = {
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

        if (!Memory.marketUsage) return
        if (!internationalManager.marketIsFunctional) return

        this.manageResources()
    }
    /*
    private createAllyRequests() {
        if (!Memory.allyTrading) return

        const { room } = this.communeManager
        const { terminal } = room

        let targetAmount = this.communeManager.minStoredEnergy * 1.5
        let resource: MarketResourceConstant = RESOURCE_ENERGY

        // If the terminal has less than x energy in the terminal, request y

        if (terminal.store.getUsedCapacity(resource) < targetAmount) {
            let priority: number

            const { controller } = this.communeManager.room
            if (controller.level < 8) {
                priority = Math.max(Math.min(controller.progress / controller.progressTotal, 0.9), 0.2)
            } else priority = 0.5

            allyManager.requestResource(
                room.name,
                resource,
                targetAmount * 1.2 - room.resourcesInStoringStructures[resource],
                priority,
            )
        }

        // For each mineral

        for (resource of minerals) {
            const mineralAmount = room.resourcesInStoringStructures[resource]
            const min = room.communeManager.storingStructuresCapacity * 0.01

            if (min > mineralAmount) continue

            allyManager.requestResource(room.name, resource, 7000 - mineralAmount, 0.25)
        }
    }
 */
    findBestTerminalRequest(): [TerminalRequest, number] {
        const budget = Math.min(
            this.communeManager.room.resourcesInStoringStructures.energy - this.communeManager.minStoredEnergy,
            this.communeManager.room.terminal.store[RESOURCE_ENERGY],
        )

        let lowestScore = Infinity
        let bestRequest: TerminalRequest
        let amount: number

        for (const ID in internationalManager.terminalRequests) {
            const request = internationalManager.terminalRequests[ID]

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
                Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) + request.priority * 100
            if (score >= lowestScore) continue

            amount = newAmount
            bestRequest = request
            lowestScore = score
        }

        return [bestRequest, amount]
    }

    private respondToTerminalRequests() {
        // We don't have enough energy to help other rooms

        if (this.communeManager.room.resourcesInStoringStructures.energy < this.communeManager.minStoredEnergy)
            return false

        const [request, amount] = this.findBestTerminalRequest()
        if (!request) return false

        this.communeManager.room.terminal.send(request.resource, amount, request.roomName, 'Terminal request')
        delete internationalManager.terminalRequests[request.ID]
        this.communeManager.room.terminal.intended = true
        return true
    }

    private findBestAllyRequest(): [AllyRequest, number] {
        const budget = Math.min(
            this.communeManager.room.resourcesInStoringStructures.energy - this.communeManager.minStoredEnergy,
            this.communeManager.room.terminal.store[RESOURCE_ENERGY],
        )

        let lowestScore = Infinity
        let bestRequest: AllyRequest
        let amount: number

        // Filter out allyRequests that are requesting resources

        const resourceRequests = allyManager.allyRequests.resource

        for (const ID in resourceRequests) {
            const request = resourceRequests[ID]

            // Ensure we have more than the asking amount

            const newAmount = findLargestTransactionAmount(
                budget,
                Math.min(
                    request.maxAmount,
                    this.communeManager.room.resourcesInStoringStructures[request.resourceType] -
                        terminalResourceTargets[request.resourceType]?.min(this.communeManager) || 0,
                ),
                this.communeManager.room.name,
                request.roomName,
            )
            if (newAmount / request.maxAmount < 0.25) continue

            const score =
                Game.map.getRoomLinearDistance(this.communeManager.room.name, request.roomName) + request.priority * 100
            if (score >= lowestScore) continue

            amount = newAmount
            bestRequest = request
            lowestScore = score
        }

        return [bestRequest, amount]
    }

    private respondToAllyRequests() {
        if (!Memory.allyTrading) return RESULT_NO_ACTION

        // We don't have enough energy to help other rooms

        if (this.communeManager.room.resourcesInStoringStructures.energy < this.communeManager.minStoredEnergy)
            return false

        const [request, amount] = this.findBestAllyRequest()
        if (!request) return RESULT_NO_ACTION

        this.communeManager.room.terminal.send(request.resourceType, amount, request.roomName, 'Ally request')
        this.communeManager.room.terminal.intended = true

        // Remove the request so other rooms don't try to respond to it

        delete allyManager._allyRequests.resource[request.ID]
        return RESULT_ACTION
    }

    private manageResources() {
        const { room } = this.communeManager
        const { terminal } = room

        for (const key in terminalResourceTargets) {
            const resource = key as ResourceConstant
            const resourceTarget = terminalResourceTargets[resource]
            if (resourceTarget.conditions && !resourceTarget.conditions(this.communeManager)) continue

            let min = resourceTarget.min(this.communeManager)

            // We don't have enough

            if (terminal.store[resource] < min) {
                if (Game.market.credits < internationalManager.minCredits) continue

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

    // "New" version, not yet in use

    isTradingPossible() {
        return this.room.terminal && this.room.storage
    }

    runNewVersion() {
        this.room = this.communeManager.room
        this.terminal = this.room.terminal

        if (!this.room.storage || !this.room.terminal) return

        //if (this.room.memory.trading === undefined) this.room.memory.trading = {}
        //if (this.room.memory.trading.purchaseTarget === undefined) this.room.memory.trading.purchaseTarget = {}

        if (Game.cpu.bucket > 6000 || (Game.cpu.bucket > 3000 && Game.time % 10 == 0)) {
            this.doTransfers()
        }

        if (this.room.name != 'W17N16' && this.room.name != 'W21N9' && this.room.name != 'W21N8') return
        //This should be below the isTradingPossible check, but that doesn't use the correct
        //  logic.  It needs to use the same work queue that the creep does.
        if (!this.isTradingPossible()) return

        if (Game.cpu.bucket > 6000 || (Game.cpu.bucket > 3000 && Game.time % 10 == 0)) {
            this.doTrading()
        }
    }

    amountInRoom(resource: ResourceConstant, roomName: string = null) {
        let room = this.room
        if (roomName) room = Game.rooms[roomName]
        if (!room) console.log('Somethings wrong.  room is null.  RN: ' + roomName)
        return (
            (room.terminal.store[resource] || 0) +
            (room.storage.store[resource] || 0) +
            (room.roomManager.structures.factory ? room.roomManager.structures.factory[0].store[resource] || 0 : 0)
        )
    }

    sendResourceToRoom(resource: ResourceConstant, rooms: string[]) {
        for (let room of rooms) {
            if (this.room.name == room) continue

            if (this.amountInRoom(resource) > this.amountInRoom(resource, room) * 2) {
                let transferAmount = Math.min(
                    this.amountInRoom(resource) / 2,
                    this.terminal.store[resource],
                    this.terminal.store[RESOURCE_ENERGY],
                )
                if (transferAmount == 0) continue

                let result = this.terminal.send(resource, transferAmount, room)
                if (result != OK) {
                    console.log(`Error ${result} in transfer from ${this.room.name} to ${room}. ${resource}`)
                } else return true
            }
        }
        return false
    }

    doTransfers(): boolean {
        if (this.terminal.cooldown > 0) return false

        //    if (Game.shard.name == 'shard1') {
        //        if (this.room.name == 'W29N19') {
        //            if (this.sendAllToRooms('KH2O', ['W21N8'])) return true
        //            if (this.terminal.store['UL'] > 5000) if (this.sendAllToRooms('UL', ['W21N8'])) return true
        //            if (this.terminal.store[RESOURCE_UTRIUM_BAR] > 5000)
        //                if (this.sendAllToRooms(RESOURCE_UTRIUM_BAR, ['W21N8'])) return true
        //            if (this.terminal.store[RESOURCE_LEMERGIUM_BAR] > 5000)
        //                if (this.sendAllToRooms(RESOURCE_LEMERGIUM_BAR, ['W21N8'])) return true
        //            if (this.terminal.store[RESOURCE_OXIDANT] > 5000)
        //                if (this.sendAllToRooms(RESOURCE_OXIDANT, ['W21N8'])) return true
        //            if (this.terminal.store[RESOURCE_OXYGEN] > 5000)
        //                if (this.sendAllToRooms(RESOURCE_OXYGEN, ['W21N8'])) return true
        //        }
        //    }

        if (Game.shard.name != 'shard3') return false

        //Balance out the energy some.
        let amountOfEnergy = this.amountInRoom(RESOURCE_ENERGY)
        if (amountOfEnergy > 450000) {
            let result = _.min(
                _.filter(
                    Game.rooms,
                    rm =>
                        rm.controller &&
                        rm.controller.my &&
                        rm.storage &&
                        rm.terminal &&
                        rm.name != 'W19N15' &&
                        rm.name != 'W15N18',
                ),
                room => (room.terminal.store[RESOURCE_ENERGY] || 0) + (room.storage.store[RESOURCE_ENERGY] || 0),
                //The TS @type for _min is wrong, it'll return infinity, if there's no results.
            ) as Room | number
            let lowestRoom = result === Infinity ? null : (result as Room)
            //console.log('Pondering Energy transfer from ' + this.room.name + ' to ' + lowestRoom.name + '  E:' + amountOfEnergy + ' targetE: ' + this.amountInRoom(RESOURCE_ENERGY, lowestRoom.name));
            //If there was a room, and it's not the current room, and there's a big difference between the lowest room and this room
            if (
                lowestRoom != null &&
                lowestRoom.name != this.room.name &&
                amountOfEnergy - this.amountInRoom(RESOURCE_ENERGY, lowestRoom.name) > 100000 &&
                lowestRoom.terminal &&
                lowestRoom.terminal.store.getFreeCapacity(RESOURCE_ENERGY) > 50000
            ) {
                console.log('LowTransfer to: ' + lowestRoom.name)
                let amountToTransfer = Math.min(this.terminal.store[RESOURCE_ENERGY], 50000)
                let transactionCost = Game.market.calcTransactionCost(1000, this.room.name, lowestRoom.name)
                //The rounding is slightly off, so don't transfer all the energy, just 99% of it...
                amountToTransfer = (1000 / (1000 + transactionCost)) * amountToTransfer * 0.99
                let result = this.terminal.send(RESOURCE_ENERGY, amountToTransfer, lowestRoom.name)
                if (result != OK) {
                    console.log('Error in energy balance transfer.  ' + result)
                }
                return result == OK
            }
        }

        if (this.room.name == 'W19N15') {
            for (let resource of [RESOURCE_MIST, RESOURCE_WIRE, RESOURCE_CONDENSATE, RESOURCE_CELL]) {
                if (this.terminal.store[resource] > 100) {
                    let result = this.terminal.send(resource, this.terminal.store[resource], 'W17N16')
                    if (result != OK) {
                        console.log('Error in transfer.  ' + result + resource)
                    }
                    return result == OK
                }
            }
        }

        // if(this.room.name == "W19N15" || this.room.name == "W15N18") {
        //         if(this.amountInRoom(RESOURCE_ENERGY) > 200000 && this.terminal.store[RESOURCE_ENERGY] > 40000) {
        //         this.terminal.send(RESOURCE_ENERGY, this.terminal.store[RESOURCE_ENERGY] * .9, "W17N16")
        //         return true;
        //     }
        // }

        if (this.sendResourceToRoom(RESOURCE_MIST, ['W14N18'])) return true
        if (this.sendResourceToRoom(RESOURCE_CONDENSATE, ['W15N18', 'W17N16'])) return true

        if (this.sendAllToRooms(RESOURCE_MUSCLE, ['W17N16'])) return true
        if (this.sendAllToRooms(RESOURCE_TISSUE, ['W18N16'])) return true
        if (this.sendAllToRooms(RESOURCE_PHLEGM, ['W18N16', 'W15N18'])) return true
        if (this.sendAllToRooms(RESOURCE_CELL, ['W17N16', 'W15N18'])) return true
        if (this.sendAllToRooms('XGH2O', ['W17N16'])) return true

        if (this.sendAllToRooms(RESOURCE_WIRE, ['W17N16', 'W18N16', 'W15N18'])) return true
        if (this.sendAllToRooms(RESOURCE_SWITCH, ['W15N18'])) return true
        if (this.sendSomeToRooms(RESOURCE_COMPOSITE, ['W18N16'])) return true
        if (this.sendAllToRooms(RESOURCE_TRANSISTOR, ['W18N16'])) return true
        if (this.sendAllToRooms(RESOURCE_MICROCHIP, ['W17N16'])) return true

        if (
            this.terminal.store[RESOURCE_CONCENTRATE] > 100 &&
            this.room.name != 'W18N16' &&
            this.room.name != 'W15N18'
        ) {
            let result = this.terminal.send(RESOURCE_CONCENTRATE, this.terminal.store[RESOURCE_CONCENTRATE], 'W15N18')
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_CONCENTRATE)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_OPS) > this.amountInRoom(RESOURCE_OPS, 'W15N18') * 2 &&
            this.room.name != 'W15N18' &&
            this.terminal.store[RESOURCE_OPS]
        ) {
            let result = this.terminal.send(
                RESOURCE_OPS,
                Math.min(
                    this.amountInRoom(RESOURCE_OPS) / 2,
                    this.terminal.store[RESOURCE_OPS],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W15N18',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_OPS)
            }
            return result == OK
        }
        if (
            this.amountInRoom(RESOURCE_OPS) > this.amountInRoom(RESOURCE_OPS, 'W17N16') * 2 &&
            this.room.name != 'W17N16' &&
            this.terminal.store[RESOURCE_OPS]
        ) {
            let result = this.terminal.send(
                RESOURCE_OPS,
                Math.min(
                    this.amountInRoom(RESOURCE_OPS) / 2,
                    this.terminal.store[RESOURCE_OPS],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W17N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_OPS)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_CONCENTRATE) > this.amountInRoom(RESOURCE_CONCENTRATE, 'W18N16') * 2 &&
            this.room.name != 'W18N16' &&
            this.terminal.store[RESOURCE_CONCENTRATE]
        ) {
            let result = this.terminal.send(
                RESOURCE_CONCENTRATE,
                Math.min(
                    this.amountInRoom(RESOURCE_CONCENTRATE) / 2,
                    this.terminal.store[RESOURCE_CONCENTRATE],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W18N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_CONCENTRATE)
            }
            return result == OK
        }
        if (
            this.amountInRoom(RESOURCE_CONCENTRATE) > this.amountInRoom(RESOURCE_CONCENTRATE, 'W15N18') * 2 &&
            this.room.name != 'W15N18' &&
            this.terminal.store[RESOURCE_CONCENTRATE]
        ) {
            let result = this.terminal.send(
                RESOURCE_CONCENTRATE,
                Math.min(
                    this.amountInRoom(RESOURCE_CONCENTRATE) / 2,
                    this.terminal.store[RESOURCE_CONCENTRATE],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W15N18',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_CONCENTRATE)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_EXTRACT) > this.amountInRoom(RESOURCE_EXTRACT, 'W18N16') * 2 &&
            this.room.name != 'W18N16' &&
            this.terminal.store[RESOURCE_EXTRACT]
        ) {
            let result = this.terminal.send(
                RESOURCE_EXTRACT,
                Math.min(
                    this.amountInRoom(RESOURCE_EXTRACT) / 2,
                    this.terminal.store[RESOURCE_EXTRACT],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W18N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_EXTRACT)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_KEANIUM_BAR) > this.amountInRoom(RESOURCE_KEANIUM_BAR, 'W17N16') * 2 &&
            this.room.name != 'W17N16' &&
            this.terminal.store[RESOURCE_KEANIUM_BAR]
        ) {
            let result = this.terminal.send(
                RESOURCE_KEANIUM_BAR,
                Math.min(
                    this.amountInRoom(RESOURCE_KEANIUM_BAR) / 2,
                    this.terminal.store[RESOURCE_KEANIUM_BAR],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W17N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_KEANIUM_BAR)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_REDUCTANT) > this.amountInRoom(RESOURCE_REDUCTANT, 'W17N16') * 2 &&
            this.room.name != 'W17N16' &&
            this.terminal.store[RESOURCE_REDUCTANT]
        ) {
            let result = this.terminal.send(
                RESOURCE_REDUCTANT,
                Math.min(
                    this.amountInRoom(RESOURCE_REDUCTANT) / 2,
                    this.terminal.store[RESOURCE_REDUCTANT],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W17N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_REDUCTANT)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_REDUCTANT) > this.amountInRoom(RESOURCE_REDUCTANT, 'W15N18') * 2 &&
            this.room.name != 'W15N18' &&
            this.terminal.store[RESOURCE_REDUCTANT]
        ) {
            let result = this.terminal.send(
                RESOURCE_REDUCTANT,
                Math.min(
                    this.amountInRoom(RESOURCE_REDUCTANT) / 2,
                    this.terminal.store[RESOURCE_REDUCTANT],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W15N18',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_REDUCTANT)
            }
            return result == OK
        }

        if (
            this.amountInRoom(RESOURCE_REDUCTANT) > this.amountInRoom(RESOURCE_REDUCTANT, 'W18N16') * 2 &&
            this.room.name != 'W18N16' &&
            this.terminal.store[RESOURCE_REDUCTANT]
        ) {
            let result = this.terminal.send(
                RESOURCE_REDUCTANT,
                Math.min(
                    this.amountInRoom(RESOURCE_REDUCTANT) / 2,
                    this.terminal.store[RESOURCE_REDUCTANT],
                    this.terminal.store[RESOURCE_ENERGY],
                ),
                'W18N16',
            )
            if (result != OK) {
                console.log('Error in transfer.  ' + result + RESOURCE_REDUCTANT)
            }
            return result == OK
        }

        if (this.sendResourceToRoom(RESOURCE_REDUCTANT, ['W18N16', 'W17N16'])) return true
        if (this.balanceResourceToRCL8Rooms([RESOURCE_POWER])) {
        } //this function doesn't return it's bool correctly...  It needs to be re-tested now.

        //Move finished good for final delivery.
        if (this.room.name != 'W17N16')
            for (let resource of [RESOURCE_SPIRIT]) {
                if (this.terminal.store[resource] > 0) {
                    let result = this.terminal.send(
                        resource,
                        Math.min(this.terminal.store[resource], this.terminal.store[RESOURCE_ENERGY]),
                        'W17N16',
                    )
                    if (result != OK) {
                        console.log(`Error ${result} in ${resource} transfer.`)
                    }
                    return result == OK
                }
            }
        return false
    }

    //This should evenly divide the resources between the two rooms, including the rooms sending supplies to each other.  Right now, this
    //  Is just the first draft.  But the key part of this function is the only room that should need the resource are specified in rooms, and
    //  Anyone else who has that resource is wrong.
    sendAllToRooms(resource: ResourceConstant, rooms: string[]) {
        if (!this.room.terminal.store[resource]) return false

        let result = _.min(
            rooms.map(rm => Game.rooms[rm]).filter(rm => rm.terminal && rm.storage && rm != this.room),
            rm => (rm.storage.store[resource] || 0) + (rm.terminal.store[resource] || 0),
        ) as Room | number
        let neediestRoom = result === Infinity ? null : (result as Room)
        if (neediestRoom != null) {
            let amount = Math.min(this.terminal.store[resource], this.terminal.store[RESOURCE_ENERGY])

            //Don't send all of the resource, only send 1/3 of the colonly's total assets (if there's 2 rooms) to each room, this way the lower rooms
            //Get a decent chance at the resources.
            if (rooms.length > 1)
                amount = Math.min(amount, Math.ceil((Memory.masterPlan.resources[resource] || 0) / (rooms.length + 1)))

            //If the current room needs the resource as well, use totally different logic.  Send half the difference between this room and the other
            if (rooms.includes(this.room.name)) {
                if (this.amountInRoom(resource) / 2 < this.amountInRoom(resource, neediestRoom.name)) return false

                amount = Math.min(
                    (this.amountInRoom(resource) - this.amountInRoom(resource, neediestRoom.name)) / 2,
                    this.terminal.store[resource],
                    this.terminal.store[RESOURCE_ENERGY],
                )
            }

            if (amount <= 0) return false
            let result = this.terminal.send(resource, amount, neediestRoom.name)
            //console.log(`Sending all ${resource} from ${this.room.name} to ${neediestRoom.name}.`)
            if (result != OK) {
                console.log(`sendAllToRooms: Error ${result} in ${resource} transfer from ${this.room.name}.`)
            }
            return result == OK
        }
        return false
    }

    sendSomeToRooms(resource: ResourceConstant, rooms: string[]): boolean {
        if (!this.room.terminal.store[resource]) return false

        for (let room of rooms) {
            if (
                this.amountInRoom(resource) > this.amountInRoom(resource, room) * 2 &&
                this.room.name != room &&
                this.terminal.store[resource]
            ) {
                let result = this.terminal.send(
                    resource,
                    Math.min(
                        this.amountInRoom(resource) / 2,
                        this.terminal.store[resource],
                        this.terminal.store[RESOURCE_ENERGY],
                    ),
                    room,
                )
                console.log(`Sending some ${resource} from ${this.room.name} to ${room}.`)
                if (result != OK) {
                    console.log('Error in transfer.  ' + result + resource)
                }
                return result == OK
            }
        }
        return false
    }

    balanceResourceToRCL8Rooms(resources: ResourceConstant[]): boolean {
        let possibleRooms = _.filter(
            Game.rooms,
            rm => rm.controller && rm.controller.my && rm.controller.level == 8 && rm.terminal && rm != this.room,
        )
        for (let resource of resources) {
            let thisRoomAmount = (this.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)
            if (thisRoomAmount === 0) continue
            for (let targetRoom of possibleRooms) {
                let targetRoomAmount =
                    (targetRoom.terminal.store[resource] || 0) + (targetRoom.storage.store[resource] || 0)
                if (thisRoomAmount > targetRoomAmount * 2) {
                    let amount = Math.min(
                        thisRoomAmount / 2,
                        this.terminal.store[resource],
                        this.terminal.store[RESOURCE_ENERGY],
                    )
                    if (amount == 0) continue
                    let result = this.terminal.send(resource, amount, targetRoom.name)
                    if (result != OK) {
                        console.log(
                            `balanceResourceToRCL8Rooms: Error ${result} in ${resource} transfer from ${this.room.name}.`,
                        )
                    }
                    return result == OK
                }
            }
        }
        return false
    }

    getBestSell(resource: ResourceConstant, energyPrice: number) {
        return _.first(
            _.sortBy(
                _.map(
                    this.dataCache[ORDER_SELL][resource].filter(ord => ord.remainingAmount > 0),
                    order => ({
                        orderId: order.id,
                        remainingAmount: order.remainingAmount,
                        adjCost:
                            order.price +
                            (energyPrice * Game.market.calcTransactionCost(1000, this.room.name, order.roomName)) /
                                1000,
                        origPrice: order.price,
                    }),
                ),
                o => o.adjCost,
            ),
        )
    }

    getBestBuy(resource: ResourceConstant, energyPrice: number) {
        return _.first(
            _.sortBy(
                _.map(
                    this.dataCache[ORDER_BUY][resource]
                        .filter(ord => !tradeBlacklistRoomNames.includes(ord.roomName))
                        .filter(ord => ord.remainingAmount > 0 && ord.amount > 0),
                    order => ({
                        orderId: order.id,
                        remainingAmount: order.remainingAmount,
                        adjCost:
                            order.price -
                            (energyPrice * Game.market.calcTransactionCost(1000, this.room.name, order.roomName)) /
                                1000,
                        origPrice: order.price,
                    }),
                ),
                o => -o.adjCost,
            ),
        )
    }

    updateBuyAvg(energyPrice: number) {
        if (Game.time % 10 == 0) {
            if (!this.room.memory[RoomMemoryKeys.marketData].buyAvg)
                this.room.memory[RoomMemoryKeys.marketData].buyAvg = {}

            let resourceToTrackBuy = [
                RESOURCE_METAL,
                RESOURCE_BIOMASS,
                RESOURCE_SILICON,
                RESOURCE_MIST,
                RESOURCE_ZYNTHIUM_KEANITE,
                RESOURCE_UTRIUM_LEMERGITE,
                RESOURCE_POWER,
                ...(_.keys(COMMODITIES) as ResourceConstant[]),
            ]
            for (let resource of resourceToTrackBuy) {
                let bestBuy = this.getBestBuy(resource, energyPrice)

                if (bestBuy) {
                    if (!this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource])
                        this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] = bestBuy.adjCost
                    else
                        this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] =
                            this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] * 0.98 + bestBuy.adjCost * 0.02
                } else {
                    //If we're not seeing people buying an item, let the price drift down slowly, so this number doesn't stay high.
                    this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] =
                        this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] * 0.995

                    //If the data is messed up somehow (either zero or null, force it to a low value)
                    if (!this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource])
                        this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] = 0
                }
            }

            let marketData = loadLocalMarketMemory()
            marketData[this.room.name] = this.room.memory[RoomMemoryKeys.marketData]
            storeLocalMarketMemory(marketData)
        }
    }

    updateSellAvg(energyPrice: number) {
        if (Game.time % 10 == 0) {
            if (!this.room.memory[RoomMemoryKeys.marketData].sellAvg)
                this.room.memory[RoomMemoryKeys.marketData].sellAvg = {}

            let resourceToTrackSell: ResourceConstant[] = [
                RESOURCE_ZYNTHIUM_KEANITE,
                RESOURCE_UTRIUM_LEMERGITE,
                RESOURCE_POWER,
                RESOURCE_METAL,
                RESOURCE_BIOMASS,
                RESOURCE_SILICON,
                RESOURCE_MIST,
                ...(_.keys(COMMODITIES) as ResourceConstant[]),
            ]
            for (let resource of resourceToTrackSell) {
                let bestSell = this.getBestSell(resource, energyPrice)

                //Detect market fuckery.  Skip updates during it.
                //Count the number of days in the past 14 where the current price is more then 3sigma outside of normal.
                //  If there's too many days outside of normal, refuse the price update, there's probably some price messing going on.
                //  The sell price doesn't have an upper bound, so it's easy to mess with this.
                if (bestSell) {
                    //This is the number of days out of 14...
                    let daysOutside3Sigma = _.filter(
                        Game.market.getHistory(resource),
                        mh => bestSell.origPrice > mh.avgPrice + 3 * mh.stddevPrice,
                    ).length
                    if (daysOutside3Sigma >= 12) {
                        //console.log("Possible market manipulation of " + resource + " skipping price update for that resource.");
                        continue
                    }

                    if (!this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource])
                        this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] = bestSell.adjCost
                    else
                        this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] =
                            this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] * 0.995 +
                            bestSell.adjCost * 0.005
                } else {
                    //If we're not seeing the item for sale, let the price drift up slowly, so this number doesn't stay too low.
                    this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] =
                        this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] * 1.005

                    //If the data is messed up somehow (either zero or null, force it to a high value)
                    if (!this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource])
                        this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] = 99999999
                }
            }

            //Now create the aquireCost tables, which is the cost to get it, either by buying the resource itself, or buying the inputs.
            this.room.memory[RoomMemoryKeys.marketData].aquire = {}
            for (let resource of [...(_.keys(COMMODITIES) as ResourceConstant[])]) {
                if (resource == RESOURCE_ENERGY) continue
                this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = null
            }
            //Step 1: Energy
            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_ENERGY] = Math.min(
                this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY],
                (this.room.memory[RoomMemoryKeys.marketData].sellAvg[RESOURCE_BATTERY] *
                    COMMODITIES[RESOURCE_ENERGY].components[RESOURCE_BATTERY]) /
                    COMMODITIES[RESOURCE_ENERGY].amount,
            )
            //then the basic resource & the basic resource bars.  But all of these involve energy, so we need to have an energy price to work from.
            //This does not calculate G and GMelt, because those can be obtained from reactions.
            for (let resource of [
                RESOURCE_HYDROGEN,
                RESOURCE_OXYGEN,
                RESOURCE_UTRIUM,
                RESOURCE_KEANIUM,
                RESOURCE_LEMERGIUM,
                RESOURCE_ZYNTHIUM,
                RESOURCE_CATALYST,
                RESOURCE_UTRIUM_BAR,
                RESOURCE_LEMERGIUM_BAR,
                RESOURCE_ZYNTHIUM_BAR,
                RESOURCE_KEANIUM_BAR,
                RESOURCE_OXIDANT,
                RESOURCE_REDUCTANT,
                RESOURCE_PURIFIER,
                RESOURCE_BATTERY,
            ]) {
                let buildCost = 0
                for (let comp in COMMODITIES[resource].components) {
                    let amount =
                        COMMODITIES[resource].components[
                            comp as
                                | DepositConstant
                                | CommodityConstant
                                | MineralConstant
                                | RESOURCE_ENERGY
                                | RESOURCE_GHODIUM
                        ]
                    if (comp == RESOURCE_ENERGY) {
                        buildCost += this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_ENERGY] * amount
                    } else {
                        buildCost +=
                            this.room.memory[RoomMemoryKeys.marketData].sellAvg[
                                comp as
                                    | DepositConstant
                                    | CommodityConstant
                                    | MineralConstant
                                    | RESOURCE_ENERGY
                                    | RESOURCE_GHODIUM
                            ] * amount
                    }
                }
                this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = Math.min(
                    this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource],
                    buildCost / COMMODITIES[resource].amount,
                )
            }

            //Now setup ZK, UL, and OH, since it's all the same logic.
            for (let resource of [RESOURCE_ZYNTHIUM_KEANITE, RESOURCE_UTRIUM_LEMERGITE, RESOURCE_HYDROXIDE]) {
                let buildCost = 0
                switch (resource) {
                    case RESOURCE_ZYNTHIUM_KEANITE:
                        buildCost =
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_ZYNTHIUM] +
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_KEANIUM]
                        break
                    case RESOURCE_UTRIUM_LEMERGITE:
                        buildCost =
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_UTRIUM] +
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_LEMERGIUM]
                        break
                    case RESOURCE_HYDROXIDE:
                        buildCost =
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_OXYGEN] +
                            this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_HYDROGEN]
                        break
                }
                this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = Math.min(
                    this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource],
                    buildCost,
                )
            }
            //Now calculate G, and GMelt, including the possibility of reacting it.
            let gReactionCost =
                this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_ZYNTHIUM_KEANITE] +
                this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_UTRIUM_LEMERGITE]
            for (let resource of [RESOURCE_GHODIUM, RESOURCE_GHODIUM_MELT]) {
                let buildCost = 0
                for (let comp in COMMODITIES[resource].components) {
                    let amount =
                        COMMODITIES[resource].components[
                            comp as
                                | DepositConstant
                                | CommodityConstant
                                | MineralConstant
                                | RESOURCE_ENERGY
                                | RESOURCE_GHODIUM
                        ]
                    if (comp == RESOURCE_ENERGY) {
                        buildCost += this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_ENERGY] * amount
                    } else if (comp == RESOURCE_GHODIUM) {
                        buildCost += gReactionCost * amount
                    } else {
                        buildCost +=
                            this.room.memory[RoomMemoryKeys.marketData].sellAvg[
                                comp as
                                    | DepositConstant
                                    | CommodityConstant
                                    | MineralConstant
                                    | RESOURCE_ENERGY
                                    | RESOURCE_GHODIUM
                            ] * amount
                    }
                }
                this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = Math.min(
                    this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource],
                    buildCost / COMMODITIES[resource].amount,
                )
                if (resource == RESOURCE_GHODIUM)
                    this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = Math.min(
                        this.room.memory[RoomMemoryKeys.marketData].aquire[resource],
                        gReactionCost,
                    )
            }

            for (let resource of [RESOURCE_METAL, RESOURCE_BIOMASS, RESOURCE_SILICON, RESOURCE_MIST]) {
                let priceToUse = this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource]
                if (priceToUse === undefined || priceToUse === null || priceToUse >= 99999999) {
                    this.room.memory[RoomMemoryKeys.marketData].buyAvg
                        ? (priceToUse = this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource] * 1.5)
                        : 99999999
                }
                this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = priceToUse
            }
            let didWork = true
            while (didWork) {
                didWork = false
                for (let resource of [
                    ...(_.keys(COMMODITIES) as (
                        | CommodityConstant
                        | MineralConstant
                        | RESOURCE_ENERGY
                        | RESOURCE_GHODIUM
                    )[]),
                ]) {
                    //This is handled erlier in the code.
                    if (resource == RESOURCE_ENERGY) continue
                    if (this.room.memory[RoomMemoryKeys.marketData].aquire[resource]) continue
                    let buildCost = 0
                    for (let comp in COMMODITIES[resource].components) {
                        let amount =
                            COMMODITIES[resource].components[
                                comp as
                                    | DepositConstant
                                    | CommodityConstant
                                    | MineralConstant
                                    | RESOURCE_ENERGY
                                    | RESOURCE_GHODIUM
                            ]
                        //This will go to undefined if we don't have an aquire cost set.
                        buildCost +=
                            this.room.memory[RoomMemoryKeys.marketData].aquire[
                                comp as
                                    | DepositConstant
                                    | CommodityConstant
                                    | MineralConstant
                                    | RESOURCE_ENERGY
                                    | RESOURCE_GHODIUM
                            ] * amount
                    }
                    if (buildCost) {
                        this.room.memory[RoomMemoryKeys.marketData].aquire[resource] = Math.min(
                            this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource] || 99999999,
                            buildCost / COMMODITIES[resource].amount,
                        )
                        if (this.room.memory[RoomMemoryKeys.marketData].aquire[resource]) didWork = true
                    }
                }
            }

            let marketData = loadLocalMarketMemory()
            marketData[this.room.name] = this.room.memory[RoomMemoryKeys.marketData]
            storeLocalMarketMemory(marketData)
        }
    }

    useTerminal(bestEnergySellOrder: {
        adjPrice: number
        orderId: string
        remainingAmount: number
        origPrice: number
    }) {
        if (this.room.name == 'W21N8') {
            // let sellTarget = [
            //     //{ resource: RESOURCE_LEMERGIUM_BAR, sellPast: 0, orderSize: 1000 },
            //     { resource: RESOURCE_ENERGY, sellPast: 500000, orderSize: 20000 },
            // ]
            // this.extendSellOrders(sellTarget);

            let purchaseTarget = [
                //{ valuePrice: 4.8, targetAmount: 200000, orderSize: 20000, resource: RESOURCE_ENERGY },
                { valuePrice: 1.8, targetAmount: 20000, orderSize: 2000, resource: RESOURCE_HYDROGEN },
                { valuePrice: 10, targetAmount: 20000, orderSize: 2000, resource: RESOURCE_REDUCTANT },
                { valuePrice: 0.7, targetAmount: 10000, orderSize: 2000, resource: RESOURCE_ZYNTHIUM },
                { valuePrice: 0.8, targetAmount: 10000, orderSize: 2000, resource: RESOURCE_KEANIUM },
            ]
            this.extendBuyOrders(purchaseTarget)
        }
        return

        if (this.terminal.cooldown > 0) return

        let energyPrice = this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY]

        let targetEnergyLevel = 200000
        let totalBetweenStorageAndTerminal =
            (this.terminal.store[RESOURCE_ENERGY] || 0) + (this.room.storage.store[RESOURCE_ENERGY] || 0)

        if (totalBetweenStorageAndTerminal < targetEnergyLevel) {
            let amountToBuy = targetEnergyLevel - totalBetweenStorageAndTerminal
            //Buy some extra energy, just so we're not buying stupidlly small amounts.
            amountToBuy += 10000

            //Limit the amount because we won't always have enough energy to move large quantities around.
            //  This ensures we have the energy to do the trade.
            amountToBuy = Math.min(amountToBuy, this.terminal.store[RESOURCE_ENERGY])

            let rate = 1
            if (targetEnergyLevel - totalBetweenStorageAndTerminal > 50000) rate = 1.1
            // if(targetEnergyLevel - totalBetweenStorageAndTerminal > 100000 )
            //     rate = 1.2
            // if(targetEnergyLevel - totalBetweenStorageAndTerminal > 150000 )
            //     rate = 1.3

            let bestSell = this.getBestSell(RESOURCE_ENERGY, energyPrice)

            if (bestSell && bestSell.adjCost < energyPrice * rate) {
                console.log(
                    'buying ' +
                        JSON.stringify(bestSell) +
                        ' qty: ' +
                        amountToBuy +
                        ' energyPrice: ' +
                        energyPrice +
                        ' price*rate: ' +
                        energyPrice * rate,
                )
                let result = Game.market.deal(bestSell.orderId, amountToBuy, this.room.name)
                if (result == OK) return

                console.log(result)
            }
        }

        //Sell off energy we're willing to sell off.  The difference in the numbers is so we don't do super small transactions when we're low on energy.
        if (this.terminal.store[RESOURCE_ENERGY] > 10000) {
            let amountToTrade = this.terminal.store[RESOURCE_ENERGY] - 9000

            //don't sell all the energy, we can only sell half of it because of transport.
            amountToTrade = Math.floor(amountToTrade / 2)

            //If we have a lot of energy, be more agressive in selling.  If we're low, be less aggressive.
            let baseEnergy = this.terminal.store[RESOURCE_ENERGY] + this.room.storage.store[RESOURCE_ENERGY]
            let sellMultiplier = 1.2
            if (baseEnergy > 150000) sellMultiplier = 1.1
            if (baseEnergy > 250000) sellMultiplier = 1.05
            if (baseEnergy > 350000) sellMultiplier = 1.03
            if (baseEnergy > 500000) sellMultiplier = 1.02

            if (Game.shard.name == 'shard3') sellMultiplier = sellMultiplier * 2

            if (bestEnergySellOrder && bestEnergySellOrder.adjPrice > energyPrice * sellMultiplier) {
                console.log('selling ' + JSON.stringify(bestEnergySellOrder) + ' qty: ' + amountToTrade)
                let result = Game.market.deal(bestEnergySellOrder.orderId, amountToTrade, this.room.name)
                if (result != 0) console.log(result)
            }
        }

        //Don't run the terminal out of energy.
        if (this.room.terminal.store[RESOURCE_ENERGY] < 5000) return

        //if(this.tryBuyingStuff([RESOURCE_MIST], energyPrice)) return;
        if (this.buyAt(RESOURCE_MIST, 80, energyPrice)) return

        //This is the best price I expect to get cross-shard.  I'd normally expect it on the target shard, but if I find it elsewhere
        //  I'll take it!
        if (this.sellAt(RESOURCE_SPIRIT, 180000, energyPrice)) return
        if (this.sellAt(RESOURCE_MUSCLE, 440000, energyPrice)) return
        if (this.sellAt(RESOURCE_MICROCHIP, 290000, energyPrice)) return

        if (this.room.name == 'W21N9') {
            //if(this.tryBuyingStuff([RESOURCE_METAL], energyPrice)) return;
            //if(this.tryBuyingStuff([RESOURCE_SILICON], energyPrice)) return;
            if (
                this.trySellingOffStuff(
                    [
                        RESOURCE_OXIDANT,
                        RESOURCE_GHODIUM_MELT,
                        RESOURCE_LEMERGIUM_BAR,
                        RESOURCE_UTRIUM_BAR,
                        RESOURCE_PURIFIER,
                        RESOURCE_REDUCTANT,
                        RESOURCE_BATTERY,
                        RESOURCE_KEANIUM_BAR,
                    ],
                    energyPrice,
                )
            )
                return
        }

        if (this.room.name == 'W17N16') {
            //Sell off resources we're making for a profit...
            //if(this.trySellingOffStuff([RESOURCE_EXTRACT], energyPrice)) return;
            //Check to see what we want to buy...
            //if(this.tryBuyingStuff([RESOURCE_CATALYST, RESOURCE_HYDROGEN, RESOURCE_ZYNTHIUM_KEANITE], energyPrice)) return;
            //let xshard = JSON.parse(InterShardMemory.getRemote("shard2")).market["W21N9"];
            //if(xshard.buyAvg[RESOURCE_PURIFIER] > 2 * this.room.memory[RoomMemoryKeys.marketData].aquire[RESOURCE_PURIFIER]) {
            //    if(this.tryBuyingStuff([RESOURCE_CATALYST], energyPrice, 1.7)) return;
            //}
        }
    }

    buyAt(resource: ResourceConstant, price: number, energyPrice: number) {
        let amountOnHand = (this.room.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)
        let targetAmount = 10000
        let epislon = Math.ceil(targetAmount / 10)

        if (amountOnHand < targetAmount) {
            let bestSell = this.getBestSell(resource, energyPrice)
            if (!bestSell) return false

            let amountToBuy = targetAmount - amountOnHand
            //Buy some extra, just so we're not buying stupidlly small amounts.
            amountToBuy += epislon

            //Don't run the terminal out of energy.
            amountToBuy = Math.min(amountToBuy, Math.floor(this.terminal.store[RESOURCE_ENERGY] / 2))

            let rate = 1

            let avg = this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource]
            if (bestSell.adjCost > price) {
                // if(avg * rate < bestSell.adjCost) {
                //console.log("not buying : " + resource + " " + JSON.stringify(bestSell) + " avg*rate:" + avg * rate + " amount:" + amountToBuy + "  adj:" + bestSell.adjCost);
                return false
            }

            console.log(
                'buyAt ' +
                    resource +
                    ' bestSell: ' +
                    JSON.stringify(bestSell) +
                    ' qty: ' +
                    amountToBuy +
                    ' avg*rate: ' +
                    avg * rate,
            )
            let result = Game.market.deal(bestSell.orderId, amountToBuy, this.room.name)
            if (result != 0) console.log(result)
            else return true
        }
        return false
    }

    sellAt(resource: ResourceConstant, price: number, energyPrice: number) {
        //console.log( + resource + price)
        if (!this.terminal.store[resource]) return false
        let bestSell = this.getBestBuy(resource, energyPrice)
        //console.log('trying sellat: ' + JSON.stringify(bestSell))
        if (bestSell && bestSell.adjCost > price) {
            let result = Game.market.deal(
                bestSell.orderId,
                Math.min(this.terminal.store[resource], bestSell.remainingAmount),
                this.room.name,
            )
            //console.log(bestSell.orderId);
            if (result != OK)
                console.log(
                    'Error ' +
                        result +
                        ' while sellAt the order. ' +
                        JSON.stringify({
                            orderId: bestSell.orderId,
                            amount: this.terminal.store[resource],
                            roomName: this.room.name,
                            order: Game.market.getOrderById(bestSell.orderId),
                        }),
                )
            return true
        }
        return false
    }

    extendSellOrders(sellTarget: { resource: ResourceConstant; sellPast: number; orderSize: number }[]) {
        for (let thisTarget of sellTarget) {
            let resource = thisTarget.resource
            //Keep the sales order up.  The trader will deal with loading it every now and then.
            let sellOrder = _.head(
                _.filter(
                    _.values(Game.market.orders) as Order[],
                    ord => ord.resourceType == resource && ord.roomName == this.room.name && ord.type == ORDER_SELL,
                ),
            )
            if (!sellOrder) continue

            let totalBetweenStorageAndTerminal =
                (this.room.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)

            let targetOrderSize = Math.min(totalBetweenStorageAndTerminal - thisTarget.sellPast, thisTarget.orderSize)

            let amountToAdjust = Math.min(targetOrderSize, totalBetweenStorageAndTerminal) - sellOrder.remainingAmount
            if (amountToAdjust > 0) {
                let result = Game.market.extendOrder(sellOrder.id, amountToAdjust)
                if (result != OK) {
                    console.log(
                        'doTrading extendOrder failed in ' +
                            this.room.name +
                            ' for ' +
                            resource +
                            '.  Error code' +
                            result +
                            '.',
                    )
                }
            }
        }
    }

    extendBuyOrders(
        purchaseTarget: { resource: ResourceConstant; valuePrice: number; orderSize: number; targetAmount: number }[],
    ) {
        for (let thisTarget of purchaseTarget) {
            let targetOrderPrice = thisTarget.valuePrice
            let result = _.min(this.dataCache[ORDER_BUY][thisTarget.resource], ord => -ord.price) as Order | number
            let highestOrder = result === Infinity ? null : (result as Order)
            if (highestOrder) targetOrderPrice = Math.min(thisTarget.valuePrice, highestOrder.price)

            //Keep the sales order up.  The trader will deal with loading it every now and then.
            let totalBetweenStorageAndTerminal =
                (this.room.terminal.store[thisTarget.resource] || 0) +
                (this.room.storage.store[thisTarget.resource] || 0)
            let buyOrder = _.head(
                _.filter(
                    _.values(Game.market.orders) as Order[],
                    ord =>
                        ord.resourceType == thisTarget.resource &&
                        ord.roomName == this.room.name &&
                        ord.type == ORDER_BUY,
                ),
            )
            if (!buyOrder) {
                let amountToBuy = Math.min(
                    thisTarget.orderSize,
                    thisTarget.targetAmount - totalBetweenStorageAndTerminal,
                )
                if (amountToBuy > 0) {
                    console.log(
                        'Creating order: rsc:' +
                            thisTarget.resource +
                            ' qty:' +
                            amountToBuy +
                            ' price:' +
                            targetOrderPrice +
                            JSON.stringify([totalBetweenStorageAndTerminal, thisTarget]),
                    )
                    let result = Game.market.createOrder({
                        roomName: this.room.name,
                        type: ORDER_BUY,
                        resourceType: thisTarget.resource,
                        price: targetOrderPrice,
                        totalAmount: amountToBuy,
                    })
                    if (result != OK)
                        console.log(
                            'Error ' +
                                result +
                                ' while creating the order.' +
                                JSON.stringify({
                                    ORDER_BUY,
                                    resource: thisTarget.resource,
                                    targetOrderPrice,
                                    amountToBuy,
                                    roomName: this.room.name,
                                }),
                        )
                }
                continue
            }

            //Amount to adjust also needs to leave some room in the terminal as well.
            let amountToAdjust = thisTarget.targetAmount - totalBetweenStorageAndTerminal - buyOrder.remainingAmount
            amountToAdjust = Math.min(amountToAdjust, thisTarget.orderSize - buyOrder.remainingAmount)

            //Only do the adjustment if it's more then 5% of the max.  This is to keep down the spam in the transaction history.
            if (amountToAdjust < thisTarget.orderSize * 0.05) continue

            if (amountToAdjust > 0) {
                console.log(
                    'Extending order.  ' +
                        JSON.stringify({
                            amountToAdjust: amountToAdjust,
                            totalBetweenStorageAndTerminal: totalBetweenStorageAndTerminal,
                            buyOrder: buyOrder,
                        }),
                )

                let result = Game.market.extendOrder(buyOrder.id, amountToAdjust)
                if (result != OK) {
                    console.log(
                        'doTrading extendOrder failed in ' +
                            this.room.name +
                            ' for ' +
                            thisTarget.resource +
                            '.  Error code' +
                            result +
                            '.',
                    )
                }
            }
        }
    }

    tryBuyingStuff(resourcesToDirectBuy: ResourceConstant[], energyPrice: number, rateOverride: number) {
        for (let resource of resourcesToDirectBuy) {
            let totalBetweenStorageAndTerminal =
                (this.room.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)
            let amountOnHand = (this.room.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)
            let targetAmount = 10000
            let epislon = Math.ceil(targetAmount / 10)

            if (amountOnHand < targetAmount) {
                let bestSell = this.getBestSell(resource, energyPrice)
                if (!bestSell) continue

                let amountToBuy = targetAmount - amountOnHand
                //Buy some extra, just so we're not buying stupidlly small amounts.
                amountToBuy += epislon

                //Don't run the terminal out of energy.
                amountToBuy = Math.min(amountToBuy, Math.floor(this.terminal.store[RESOURCE_ENERGY] / 2))

                let rate = 1

                if (totalBetweenStorageAndTerminal < 20000) rate = 1.1
                if (totalBetweenStorageAndTerminal < 10000) rate = 1.3
                if (totalBetweenStorageAndTerminal < 5000) rate = 1.5

                //Exclude the level 0 commodities, because they are things like L and L_bars which behave much more normally.
                if (
                    (COMMODITIES[
                        resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY
                    ] &&
                        COMMODITIES[
                            resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY
                        ].level > 0) ||
                    //When we're working with commodities, margins are thin, prices are high.
                    resource == RESOURCE_METAL ||
                    resource == RESOURCE_SILICON ||
                    resource == RESOURCE_BIOMASS ||
                    resource == RESOURCE_MIST
                ) {
                    rate = 1
                    if (totalBetweenStorageAndTerminal < 1000) rate = 1.05
                }

                if (resource == RESOURCE_ZYNTHIUM || resource == RESOURCE_ZYNTHIUM_KEANITE) rate = 4

                if (rateOverride) rate = rateOverride

                let avg = this.room.memory[RoomMemoryKeys.marketData].sellAvg[resource]
                if (avg * rate < bestSell.adjCost) {
                    console.log(
                        'not buying : ' +
                            resource +
                            ' ' +
                            JSON.stringify(bestSell) +
                            ' avg*rate:' +
                            avg * rate +
                            ' amount:' +
                            amountToBuy +
                            '  adj:' +
                            bestSell.adjCost,
                    )
                    continue
                }

                console.log(
                    'buying ' +
                        resource +
                        ' bestSell: ' +
                        JSON.stringify(bestSell) +
                        ' qty: ' +
                        amountToBuy +
                        ' avg*rate: ' +
                        avg * rate,
                )
                let result = Game.market.deal(bestSell.orderId, amountToBuy, this.room.name)
                if (result != 0) console.log(result)
                else return
            }
        }
    }

    trySellingOffStuff(resources: ResourceConstant[], energyPrice: number): boolean {
        let importedResourceCosts: { [key in ResourceConstant]?: number } = {}
        if (this.room.name == 'W21N9') {
            importedResourceCosts[RESOURCE_UTRIUM] = 5
            importedResourceCosts[RESOURCE_ZYNTHIUM_BAR] = 30
            importedResourceCosts[RESOURCE_PURIFIER] = 140
            importedResourceCosts[RESOURCE_OXIDANT] = 65
            importedResourceCosts[RESOURCE_REDUCTANT] = 120
            importedResourceCosts[RESOURCE_KEANIUM_BAR] = 20
            importedResourceCosts[RESOURCE_UTRIUM_BAR] = 40
        } else {
            importedResourceCosts[RESOURCE_ZYNTHIUM_BAR] = 20
            importedResourceCosts[RESOURCE_COMPOSITE] = 30
        }

        //Sell off resources we're making for a profit...
        for (let resource of resources) {
            let amountOnHand = (this.room.terminal.store[resource] || 0) + (this.room.storage.store[resource] || 0)

            let amount = this.room.terminal.store[resource]

            //We should ignore the amount for sale sometimes.... I haven't figured out the rule for this.  It's something like
            //  If the sell order is crappy ignore it.
            if (resource !== RESOURCE_LEMERGIUM_BAR) {
                //Subtract the amount on the market...
                amount -=
                    _.sum(
                        _.filter(
                            Game.market.orders,
                            ord => ord.resourceType == resource && ord.roomName == this.room.name,
                        ),
                        ord => ord.remainingAmount,
                    ) / 2
            }

            if (amount < 1) continue

            let bestBuy = this.getBestBuy(resource, energyPrice)
            if (!bestBuy) continue

            //Figure out how desperate I am to sell..  If I'm nearly empty, wait for a good margin.  If I'm nearly full... SELL!
            let multiplier = 0.95
            if (amountOnHand > 15000) multiplier = 0.9

            //If this is an item with a high margin, we don't care if we're selling it dirt cheap.
            if (importedResourceCosts[resource] && importedResourceCosts[resource] > bestBuy.adjCost) continue

            let avg = this.room.memory[RoomMemoryKeys.marketData].buyAvg[resource]
            if (avg * multiplier > bestBuy.adjCost) {
                //if(this.room.name == "W21N9") console.log("not selling : " + resource + " " + JSON.stringify(bestBuy) + " avg:" + avg + " amount:" + amount + "  adj:" + bestBuy.adjCost);
                continue
            }
            if (bestBuy.adjCost < 0) {
                continue
            }

            //This is something that we're importing, we know the safe price is, so we can use that to guard instead.
            if (!importedResourceCosts[resource]) {
                let daysOutside3Sigma = _.filter(
                    Game.market.getHistory(resource),
                    mh => bestBuy.origPrice < mh.avgPrice - 3 * mh.stddevPrice,
                ).length
                if (daysOutside3Sigma >= 6) {
                    console.log(
                        'not selling due to sigma : ' +
                            resource +
                            ' ' +
                            JSON.stringify(bestBuy) +
                            ' avg:' +
                            avg +
                            ' amount:' +
                            amount +
                            '  adj:' +
                            bestBuy.adjCost,
                    )
                    continue
                }
            }

            amount = Math.min(amount, bestBuy.remainingAmount)

            amount = Math.min(amount, this.room.terminal.store[RESOURCE_ENERGY])

            console.log(
                'selling : ' +
                    resource +
                    ' ' +
                    JSON.stringify(bestBuy) +
                    ' avg:' +
                    avg +
                    ' amount:' +
                    amount +
                    '  adj:' +
                    bestBuy.adjCost +
                    ' oh: ' +
                    amountOnHand,
            )
            let result = Game.market.deal(bestBuy.orderId, amount, this.room.name)
            if (result != 0) {
                console.log(result)
            } else {
                return true
            }
        }
        return false
    }

    dataCache: {
        [key in ORDER_BUY | ORDER_SELL]?: { [key in ResourceConstant | InterShardResourceConstant]?: Order[] }
    }
    buildDataCache(): void {
        const result: {
            [key in ORDER_BUY | ORDER_SELL]?: { [key in ResourceConstant | InterShardResourceConstant]?: Order[] }
        } = { [ORDER_SELL]: {}, [ORDER_BUY]: {} }

        for (let resource of [...RESOURCES_ALL, ...INTERSHARD_RESOURCES]) {
            result[ORDER_SELL][resource] = []
            result[ORDER_BUY][resource] = []
        }
        for (let ord of Game.market.getAllOrders()) {
            if (tradeBlacklistRoomNames.includes(ord.roomName)) continue
            result[ord.type as ORDER_BUY | ORDER_SELL][ord.resourceType].push(ord)
        }
        this.dataCache = result
    }

    doTrading() {
        this.buildDataCache()

        let bestSell = _.first(
            _.sortBy(
                _.map(this.dataCache[ORDER_SELL][RESOURCE_ENERGY], order => ({
                    orderId: order.id,
                    remainingAmount: order.remainingAmount,
                    adjCost:
                        order.price /
                        (1 - Game.market.calcTransactionCost(1000, this.room.name, order.roomName) / 1000),
                    origPrice: order.price,
                })),
                function (o) {
                    return o.adjCost
                },
            ),
        )

        let bestOrder = _.head(
            _.sortBy(
                _.map(this.dataCache[ORDER_BUY][RESOURCE_ENERGY], order => ({
                    orderId: order.id,
                    remainingAmount: order.remainingAmount,
                    adjPrice:
                        order.price -
                        1.4 * (Game.market.calcTransactionCost(1000, this.room.name, order.roomName) / 1000),
                    origPrice: order.price,
                })),
                function (o) {
                    return -o.adjPrice
                },
            ),
        )

        if (bestSell && bestOrder && Game.time % 10 == 0) {
            let avg = (bestSell.adjCost + bestOrder.adjPrice) / 2
            if (!this.room.memory[RoomMemoryKeys.marketData]) this.room.memory[RoomMemoryKeys.marketData] = {}

            if (!this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY]) {
                this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY] = avg
            } else {
                this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY] =
                    this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY] * 0.995 + avg * 0.005
            }
        }

        let energyPrice = this.room.memory[RoomMemoryKeys.marketData][RESOURCE_ENERGY]
        this.updateSellAvg(energyPrice)
        this.updateBuyAvg(energyPrice)
        //this.useTerminal(bestOrder)
    }
}
