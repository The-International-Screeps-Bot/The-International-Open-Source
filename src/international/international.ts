import { createPosMap, customLog, getAvgPrice, packXYAsNum, randomRange, randomTick } from './utils'

import {
    cacheAmountModifier,
    WorkRequestKeys,
    CPUBucketCapacity,
    mmoShardNames,
    customColors,
    roomDimensions,
    RoomMemoryKeys,
} from './constants'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export class InternationalManager {
    /**
     * Antifa creeps by combat request name, then by role with an array of creep names
     */
    creepsByCombatRequest: { [requestName: string]: Partial<{ [key in CreepRoles]: string[] }> }

    creepsByHaulRequest: { [requestName: string]: string[] }

    unspawnedPowerCreepNames: string[]

    terminalRequests: { [ID: string]: TerminalRequest }

    tickID: number
    customCreepIDs: true[]
    customCreepIDIndex: number

    internationalDataVisuals: boolean

    terminalCommunes: string[]

    /**
     * The number of minerals in communes
     */
    mineralCommunes: { [key in MineralConstant]: number }

    /**
     * Updates values to be present for this tick
     */
    update() {
        this.creepsByCombatRequest = {}
        this.creepsByHaulRequest = {}
        this.unspawnedPowerCreepNames = []
        this.terminalRequests = {}
        this.terminalCommunes = []

        this.tickID = 0
        this.customCreepIDs = []
        this.customCreepIDIndex = 0

        delete this._myOrders
        delete this._orders
        delete this._myOrdersCount
        delete this._workRequestsByScore
        delete this._defaultMinCacheAmount
        delete this.internationalDataVisuals

        if (randomTick()) {
            delete this._mineralPriority
            delete this._funnelOrder
            delete this._minCredits
            delete this._resourcesInStoringStructures
            delete this._maxCSitesPerRoom
        }
    }

    newCustomCreepID() {
        // Try to use an existing unused ID index

        for (; this.customCreepIDIndex < this.customCreepIDs.length; this.customCreepIDIndex++) {
            if (this.customCreepIDs[this.customCreepIDIndex]) continue

            this.customCreepIDs[this.customCreepIDIndex] = true
            this.customCreepIDIndex += 1
            return this.customCreepIDIndex - 1
        }

        // All previous indexes are being used, add a new index

        this.customCreepIDs.push(true)
        this.customCreepIDIndex += 1
        return this.customCreepIDIndex - 1
    }

    /**
     * Removes inactive orders if the bot is reaching max orders
     */
    orderManager() {
        // If there is sufficiently few orders

        if (MARKET_MAX_ORDERS * 0.8 > this.myOrdersCount) return

        // Loop through my orders

        for (const ID in Game.market.orders) {
            // If the order is inactive (it likely has no remaining resources), delete it

            if (!Game.market.orders[ID].active) Game.market.cancelOrder(ID)
        }
    }

    /**
     * Finds the cheapest sell order
     */
    getSellOrder(resourceType: MarketResourceConstant, maxPrice = getAvgPrice(resourceType) * 1.2) {
        const orders = this.orders.sell?.[resourceType] || []

        let bestOrder: Order

        for (const order of orders) {
            if (order.price >= maxPrice) continue

            if (order.price < (bestOrder ? bestOrder.price : Infinity)) bestOrder = order
        }

        return bestOrder
    }

    /**
     * Finds the most expensive buy order
     */
    getBuyOrder(resourceType: MarketResourceConstant, minPrice = getAvgPrice(resourceType) * 0.8) {
        const orders = this.orders.buy?.[resourceType] || []

        let bestOrder: Order

        for (const order of orders) {
            if (order.price <= minPrice) continue

            if (order.price > (bestOrder ? bestOrder.price : 0)) bestOrder = order
        }

        return bestOrder
    }

    /**
     * Find the highest order and sell pixels to it
     */
    advancedSellPixels() {
        if (!Memory.pixelSelling) return

        if (Game.resources[PIXEL] === 0) return

        const avgPrice = getAvgPrice(PIXEL, 7)

        const minPrice = avgPrice * 0.8
        /*
        customLog('minPixelPrice', minPrice)
        customLog('avgPixelPrice', avgPrice)
 */
        const buyOrder = this.getBuyOrder(PIXEL, minPrice)

        if (buyOrder) {
            Game.market.deal(buyOrder.id, Math.min(buyOrder.amount, Game.resources[PIXEL]))
            return
        }

        const myPixelOrder = _.find(Game.market.orders, o => o.type == 'sell' && o.resourceType == PIXEL)

        const sellOrder = this.getSellOrder(PIXEL, Infinity)
        let price: number

        if (sellOrder.price < avgPrice) {
            price = avgPrice
        } else {
            price = sellOrder.price
        }

        if (myPixelOrder) {
            if (Game.time % 100 == 0) {
                if (myPixelOrder.remainingAmount < Game.resources[PIXEL]) {
                    Game.market.extendOrder(myPixelOrder.id, Game.resources[PIXEL] - myPixelOrder.remainingAmount)
                    return
                } else {
                    if (myPixelOrder.price == price) return
                    Game.market.changeOrderPrice(myPixelOrder.id, price - 0.001)
                    return
                }
            } else {
                return
            }
        }

        Game.market.createOrder({
            type: ORDER_SELL,
            resourceType: PIXEL,
            price: price - 0.001,
            totalAmount: Game.resources[PIXEL],
        })
    }

    advancedGeneratePixel() {
        if (!Memory.pixelGeneration) return

        // Stop if the bot is not running on MMO

        if (!mmoShardNames.has(Game.shard.name)) return

        // Stop if the cpu bucket isn't full

        if (Game.cpu.bucket !== 10000) return

        // Try to generate a pixel

        Game.cpu.generatePixel()
    }

    getTerrainCoords(roomName: string) {
        if (!global.terrainCoords) global.terrainCoords = {}

        if (global.terrainCoords[roomName]) return global.terrainCoords[roomName]

        global.terrainCoords[roomName] = new Uint8Array(2500)

        const terrain = Game.map.getRoomTerrain(roomName)

        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                global.terrainCoords[roomName][packXYAsNum(x, y)] = terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0
            }
        }

        return global.terrainCoords[roomName]
    }

    newTickID() {
        return (this.tickID += 1).toString()
    }

    _minCredits: number

    get minCredits() {
        if (this._minCredits !== undefined) return this._minCredits

        return (this._minCredits = global.communes.size * 10000)
    }

    /**
     * My outgoing orders organized by room, order type and resourceType
     */
    _myOrders: {
        [roomName: string]: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>>
    }

    /**
     * Gets my outgoing orders organized by room, order type and resourceType
     */
    get myOrders() {
        // If _myOrders are already defined, inform them

        if (this._myOrders) return this._myOrders

        this._myOrders = {}

        // Loop through each orderID in the market's orders

        for (const orderID in Game.market.orders) {
            // Get the order using its ID

            const order = Game.market.orders[orderID]

            // If the order is inactive (it likely has 0 remaining amount)

            if (order.remainingAmount == 0) continue

            // If there is foundation for this structure, create it

            if (!this._myOrders[order.roomName]) {
                this._myOrders[order.roomName] = {
                    sell: {},
                    buy: {},
                }
            }

            // If there is no array for this structure, create one

            if (!this._myOrders[order.roomName][order.type][order.resourceType])
                this._myOrders[order.roomName][order.type][order.resourceType] = []

            // Add the order to the structure's array

            this._myOrders[order.roomName][order.type][order.resourceType].push(order)
        }

        return this._myOrders
    }

    /**
     * Existing other-player orders ordered by order type and resourceType
     */
    _orders?: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>>

    /**
     * Gets existing other-player orders ordered by order type and resourceType
     */
    get orders() {
        // If _orders are already defined, inform them

        /* if (this._orders) return this._orders */

        this._orders = {
            buy: {},
            sell: {},
        }

        // Get the market's order and loop through them

        const orders = Game.market.getAllOrders()

        for (const orderID in orders) {
            // Get the order using its ID

            const order = orders[orderID]

            if (!this._orders[order.type][order.resourceType]) {
                this._orders[order.type][order.resourceType] = [order]
                continue
            }

            // Assign the order to a resource-ordered location

            this._orders[order.type][order.resourceType].push(order)
        }

        return this._orders
    }

    /**
     * The number of orders owned by me
     */
    _myOrdersCount: number

    /**
     * Gets the number of orders owned by me
     */
    get myOrdersCount() {
        // If _myOrdersCount are already defined, inform them

        if (this._myOrdersCount) return this._myOrdersCount

        // Inform and set the number of my orders

        return (this._myOrdersCount = Object.keys(Game.market.orders).length)
    }

    _workRequestsByScore: (string | undefined)[]

    get workRequestsByScore(): (string | undefined)[] {
        if (this._workRequestsByScore) return this._workRequestsByScore

        return (this._workRequestsByScore = Object.keys(Memory.workRequests).sort(
            (a, b) =>
                (Memory.workRequests[a][WorkRequestKeys.priority] ??
                    Memory.rooms[a][RoomMemoryKeys.score] + Memory.rooms[a][RoomMemoryKeys.dynamicScore]) -
                (Memory.workRequests[b][WorkRequestKeys.priority] ??
                    Memory.rooms[b][RoomMemoryKeys.score] + Memory.rooms[b][RoomMemoryKeys.dynamicScore]),
        ))
    }

    _defaultMinCacheAmount: number

    get defaultMinCacheAmount() {
        if (this._defaultMinCacheAmount !== undefined) return this._defaultMinCacheAmount

        const avgCPUUsagePercent = Memory.stats.cpu.usage / Game.cpu.limit

        return (this._defaultMinCacheAmount = Math.floor(Math.pow(avgCPUUsagePercent * 10, 2.2)) + 1)
    }

    _marketIsFunctional: number

    /**
     * Determines if there is functional based on history
     */
    get marketIsFunctional() {
        if (this._marketIsFunctional !== undefined) return this._marketIsFunctional

        return (this._marketIsFunctional = Game.market.getHistory(RESOURCE_ENERGY).length)
    }

    _maxCommunes: number
    get maxCommunes() {
        return (this._maxCommunes = Math.round(Game.cpu.limit / 10))
    }

    /**
     * The priority for claiming new rooms, for each mineral
     */
    _mineralPriority: Partial<{ [key in MineralConstant]: number }>

    /**
     * The priority for claiming new rooms, for each mineral
     */
    get mineralPriority() {
        if (this._mineralPriority) return this._mineralPriority

        this._mineralPriority = {}

        for (const resource of MINERALS) {
            this._mineralPriority[resource] = this.mineralCommunes[resource]
        }

        return this._mineralPriority
    }

    _compoundPriority: Partial<{ [key in MineralCompoundConstant]: number }>
    get compoundPriority() {
        if (this._compoundPriority) return this._compoundPriority

        this._compoundPriority = {}

        return this._compoundPriority
    }

    _funnelOrder: string[]

    /**
     * Commune names sorted by
     */
    get funnelOrder() {
        if (this._funnelOrder) return this._funnelOrder

        // organize RCLs 1-7

        const communesByLevel: { [level: string]: [string, number][] } = {}
        for (let i = 1; i < 8; i++) communesByLevel[i] = []

        for (const roomName of global.communes) {
            const controller = Game.rooms[roomName].controller
            communesByLevel[controller.level].push([roomName, controller.progressTotal / controller.progress])
        }

        for (const key in communesByLevel) {
            const level = key as unknown as number
        }

        this._funnelOrder = Array.from(global.communes).sort((a, b) => {
            const controllerA = Game.rooms[a].controller
            const controllerB = Game.rooms[b].controller
            return (
                controllerA.level +
                controllerA.progressTotal / controllerA.progress -
                (controllerB.level + controllerB.progressTotal / controllerB.progress)
            )
        })

        return this._funnelOrder
    }

    _resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>
    get resourcesInStoringStructures() {
        if (this._resourcesInStoringStructures) return this._resourcesInStoringStructures

        this._resourcesInStoringStructures = {}

        for (const roomName of global.communes) {
            const room = Game.rooms[roomName]
            const resources = room.resourcesInStoringStructures

            for (const key in resources) {
                const resource = key as unknown as ResourceConstant

                if (!this._resourcesInStoringStructures[resource])
                    this._resourcesInStoringStructures[resource] = resources[resource]
                this._resourcesInStoringStructures[resource] = resources[resource]
            }
        }

        return this._resourcesInStoringStructures
    }

    _maxCSitesPerRoom: number
    get maxCSitesPerRoom() {
        if (this._maxCSitesPerRoom) return this._maxCSitesPerRoom

        return Math.max(Math.min(MAX_CONSTRUCTION_SITES / global.communes.size, 20), 3)
    }
}

export const internationalManager = new InternationalManager()
