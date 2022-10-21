import { allyManager } from 'international/simpleAllies'
import { createPosMap, customLog, getAvgPrice, packXYAsNum } from './utils'

import {
    cacheAmountModifier,
    ClaimRequestData,
    CPUBucketCapacity,
    mmoShardNames,
    myColors,
    roomDimensions,
} from './constants'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export class InternationalManager {

    /**
     * Tracks and records constructionSites and thier age, deleting old sites
     */
    constructionSiteManager?(): void

    /**
     * Adds colours and annotations to the map if mapVisuals are enabled
     */
    mapVisualsManager?(): void

    /**
     * Handles logging, stat recording, and more at the end of the tick
     */
    endTickManager?(): void

    /**
     * Antifa creeps by combat request name, then by role with an array of creep names
     */
    creepsByCombatRequest: { [key: string]: { [key: string]: string[] } }

    unspawnedPowerCreepNames: string[]

    /**
     * Updates values to be present for this tick
     */
    update() {
        internationalManager.creepsByCombatRequest = {}
        this.unspawnedPowerCreepNames = []
        delete this._myOrders
        delete this._orders
        delete this._myOrdersCount
        delete this._claimRequestsByScore
        delete this._defaultMinCacheAmount
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
        customLog('minPixelPrice', minPrice)
        customLog('avgPixelPrice', avgPrice)

        const buyOrder = this.getBuyOrder(PIXEL, minPrice)

        if (buyOrder) {
            Game.market.deal(buyOrder.id, Math.min(buyOrder.amount, Game.resources[PIXEL]))
            return
        }

        const myPixelOrder = _.filter(Game.market.orders, o => o.type == 'sell' && o.resourceType == PIXEL)[0]

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

        if (this._orders) return this._orders

        this._orders = {
            buy: {},
            sell: {},
        }

        // Get the market's order and loop through them

        const orders = Game.market.getAllOrders()

        let order

        for (const orderID in orders) {
            // Get the order using its ID

            order = orders[orderID]

            // Assign the order to a resource-ordered location, creating it if undefined

            this._orders[order.type][order.resourceType]
                ? this._orders[order.type][order.resourceType].push(order)
                : (this._orders[order.type][order.resourceType] = [order])
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

    _claimRequestsByScore: (string | undefined)[]

    get claimRequestsByScore(): (string | undefined)[] {
        if (this._claimRequestsByScore) return this._claimRequestsByScore

        return (this._claimRequestsByScore = Object.keys(Memory.claimRequests).sort(
            (a, b) =>
                Memory.claimRequests[a].data[ClaimRequestData.score] -
                Memory.claimRequests[b].data[ClaimRequestData.score],
        ))
    }

    _defaultMinCacheAmount: number

    get defaultMinCacheAmount() {
        if (this._defaultMinCacheAmount) return this._defaultMinCacheAmount

        const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit

        return Math.floor(Math.pow(avgCPUUsagePercent * 10, 2.2)) + 1
    }

    _marketIsFunctional: number

    /**
     * Determines if there is functional based on history
     */
    get marketIsFunctional() {
        if (this._marketIsFunctional !== undefined) return this._marketIsFunctional

        return (this._marketIsFunctional = Game.market.getHistory(RESOURCE_ENERGY).length)
    }
}

export const internationalManager = new InternationalManager()
