import { getAvgPrice } from 'utils/utils'
import { PlayerMemoryKeys, RoomMemoryKeys } from './constants'
import { collectiveManager } from './collective'

class MarketOrdersManager {
    run() {
        this._allOrdersUnorganized = undefined
        this._myOrders = undefined
        this._orders = undefined
        this._myOrdersCount = undefined

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
        if (!global.settings.pixelSelling) return

        if (Game.resources[PIXEL] === 0) return

        const avgPrice = getAvgPrice(PIXEL, 7)

        const minPrice = avgPrice * 0.8
        /*
        log('minPixelPrice', minPrice)
        log('avgPixelPrice', avgPrice)
        */
        const buyOrder = this.getBuyOrder(PIXEL, minPrice)

        if (buyOrder) {
            Game.market.deal(buyOrder.id, Math.min(buyOrder.amount, Game.resources[PIXEL]))
            return
        }

        const myPixelOrder = _.find(
            Game.market.orders,
            o => o.type == 'sell' && o.resourceType == PIXEL,
        )

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
                    Game.market.extendOrder(
                        myPixelOrder.id,
                        Game.resources[PIXEL] - myPixelOrder.remainingAmount,
                    )
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

    _allOrdersUnorganized: Order[]
    get allOrdersUnorganized() {
        if (this._allOrdersUnorganized) return this._allOrdersUnorganized

        return this._allOrdersUnorganized = Game.market.getAllOrders()
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

        const orders: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>> = {
            buy: {},
            sell: {},
        }

        // Get the market's order and loop through them

        const unorganizedOrders = this.allOrdersUnorganized

        for (const order of unorganizedOrders) {

            // Make sure the order isn't coming from a room we own
            if (collectiveManager.communes.has(order.roomName)) continue

            const roomMemory = Memory.rooms[order.roomName]
            // Filter out orders from players we hate
            if (
                roomMemory &&
                roomMemory[RoomMemoryKeys.owner] &&
                Memory.players[roomMemory[RoomMemoryKeys.owner]] &&
                Memory.players[roomMemory[RoomMemoryKeys.owner]][PlayerMemoryKeys.hate] > 0
            )
                continue

            if (!orders[order.type][order.resourceType]) {
                orders[order.type][order.resourceType] = [order]
                continue
            }

            // Assign the order to a resource-ordered location

            orders[order.type][order.resourceType].push(order)
        }

        return (this._orders = orders)
    }

    /**
     * My outgoing orders organized by room, order type and resourceType
     */
    _myOrders: {
        [roomName: string]: Partial<
            Record<string, Partial<Record<MarketResourceConstant, Order[]>>>
        >
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
     * The number of orders owned by me
     */
    _myOrdersCount: number

    /**
     * Gets the number of orders owned by me
     */
    get myOrdersCount() {
        if (this._myOrdersCount !== undefined) return this._myOrdersCount

        return (this._myOrdersCount = Object.keys(Game.market.orders).length)
    }

    _isMarketFunctional: boolean
    /**
     * Determines if there is functional based on history
     */
    get isMarketFunctional() {
        if (this._isMarketFunctional !== undefined) return this._isMarketFunctional

        return (this._isMarketFunctional = !!this.allOrdersUnorganized.length)
    }
}

export const marketOrdersManager = new MarketOrdersManager()
