import { findHighestScore, randomIntRange, randomTick, Utils } from 'utils/utils'
import { PlayerMemoryKeys, Result, RoomMemoryKeys } from '../../constants/general'
import { CollectiveManager } from '../collective'
import { LogOps } from 'utils/logOps'

const optimizeOrdersInterval = randomIntRange(900, 1000)

export class MarketManager {
  static run() {
    this._myOrders = undefined
    this.cachedOrders = {}
    this._myOrdersCount = undefined
    this.resourceHistory ??= {}

    if (randomTick(100)) {
      this.resourceHistory = {}
    }
    if (Utils.isTickInterval(optimizeOrdersInterval)) {
      this.optimizeMyOrders()
    }

    this.pruneMyOrders()
  }

  private static pruneMyOrders() {
    // If there is sufficiently few orders

    if (this.myOrdersCount < MARKET_MAX_ORDERS * 0.8) return

    for (const ID in Game.market.orders) {
      // If the order is inactive (it likely has no remaining resources), delete it

      if (!Game.market.orders[ID].active) Game.market.cancelOrder(ID)
    }
  }

  private static optimizeMyOrders(): void {
    const myOrders = Game.market.orders
    for (const ID in myOrders) {
      // If the order is inactive (it likely has no remaining resources), delete it

      const order = myOrders[ID]
      if (!order.active) {
        Game.market.cancelOrder(ID)
        continue
      }

      if (order.type === ORDER_BUY) {
        const orders = this.getOrders(order.resourceType, ORDER_BUY)
        if (!orders) continue

        const newPrice = Math.min(this.getAvgPrice(order.resourceType) * 1.2)
        if (order.price === newPrice) continue

        const absDiff = Math.abs(order.price - newPrice)
        // Make sure the difference in price is substantial enough to justify a change
        if (absDiff < order.price * 0.1) continue

        Game.market.changeOrderPrice(ID, newPrice)
        continue
      }

      // The order type is sell

      const orders = this.getOrders(order.resourceType, ORDER_SELL)
      if (!orders) continue

      const newPrice = Math.min(this.getAvgPrice(order.resourceType) * 0.8)
      if (order.price === newPrice) continue

      const absDiff = Math.abs(order.price - newPrice)
      // Make sure the difference in price is substantial enough to justify a change
      if (absDiff < order.price * 0.1) continue

      Game.market.changeOrderPrice(ID, newPrice)
    }
  }

  /**
   * Finds the cheapest sell order
   */
  static getShardSellOrder(
    roomName: string,
    resourceType: MarketResourceConstant,
    amount: number,
    maxPrice = this.getAvgPrice(resourceType) * 1.2,
  ) {
    const orders = this.getOrders(resourceType, ORDER_SELL)
    if (!orders.length) return Result.fail

    let bestOrder: Order
    let bestOrderCost = Infinity

    for (const order of orders) {
      if (order.price > maxPrice) continue
      if (order.price >= bestOrderCost) continue

      // we found a better order

      bestOrder = order
      bestOrderCost = order.price
    }

    if (!bestOrder) return Result.fail
    return bestOrder
  }

  /**
   * Finds the most expensive buy order
   */
  static getShardBuyOrder(
    roomName: string,
    resourceType: MarketResourceConstant,
    amount: number,
    minPrice = this.getAvgPrice(resourceType) * 0.8,
  ) {
    const orders = this.getOrders(resourceType, ORDER_BUY)
    if (!orders.length) return Result.fail

    let bestOrder: Order
    let bestOrderCost = 0

    for (const order of orders) {
      if (order.price < minPrice) continue
      if (order.price <= bestOrderCost) continue

      // we found a better order

      bestOrder = order
      bestOrderCost = order.price
    }

    if (!bestOrder) return Result.fail

    return bestOrder
  }

  /**
   * Finds the cheapest sell order
   */
  static getGlobalSellOrder(
    resourceType: MarketResourceConstant,
    maxPrice = this.getAvgPrice(resourceType) * 1.2,
  ) {
    const orders = this.getOrders(resourceType, ORDER_SELL)
    if (!orders.length) return Result.fail

    let bestOrder: Order
    let bestOrderCost = Infinity

    for (const order of orders) {
      if (order.price > maxPrice) continue
      if (order.price >= bestOrderCost) continue

      // we found a better order

      bestOrder = order
      bestOrderCost = order.price
    }

    if (!bestOrder) return Result.fail

    return bestOrder
  }

  /**
   * Finds the most expensive buy order
   */
  static getGlobalBuyOrder(
    resourceType: MarketResourceConstant,
    minPrice = this.getAvgPrice(resourceType) * 0.8,
  ) {
    const orders = this.getOrders(resourceType, ORDER_BUY)
    if (!orders.length) return Result.fail

    let bestOrder: Order
    let bestOrderPrice = 0

    for (const order of orders) {
      if (order.price < minPrice) continue
      if (order.price <= bestOrderPrice) continue

      // we found a better order

      bestOrder = order
      bestOrderPrice = order.price
    }

    if (!bestOrder) return Result.fail

    return bestOrder
  }

  /**
   * Find the highest order and sell pixels to it
   */
  static advancedSellPixels() {
    if (!global.settings.pixelSelling) return

    if (Game.resources[PIXEL] === 0) return

    const avgPrice = this.getAvgPrice(PIXEL, 7)

    const minPrice = avgPrice * 0.8
    /*
        log('minPixelPrice', minPrice)
        log('avgPixelPrice', avgPrice)
        */
    const buyOrder = this.getGlobalBuyOrder(PIXEL, minPrice)

    if (buyOrder) {
      Game.market.deal(buyOrder.id, Math.min(buyOrder.amount, Game.resources[PIXEL]))
      return
    }

    const myPixelOrder = _.find(
      Game.market.orders,
      o => o.type == 'sell' && o.resourceType == PIXEL,
    )

    const sellOrder = this.getGlobalSellOrder(PIXEL, Infinity)
    if (!sellOrder) return
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

  /**
   * intra-tick cached orders sorted by resourceType and trade type
   */
  static cachedOrders: CachedMarketOrders

  /**
   * orders created by other players that we are on acceptable terms with, for a specified resource and trade type
   * See engine: https://github.com/screeps/engine/blob/7ee5b8e24b16b6b31727a83db15f676f5061a114/src/game/market.js#L13
   * It seems that there is caching for each resource, but nothing else. So we will use that cache while also organizing by order type (BUY or SELL)
   */
  static getOrders(resourceType: MarketResourceConstant, orderType: MarketOrderTypes) {
    if (this.cachedOrders[resourceType]) {
      return this.cachedOrders[resourceType][orderType]
    }

    const ordersByType: CachedMarketOrders[MarketResourceConstant] = {
      [ORDER_BUY]: [],
      [ORDER_SELL]: [],
    }

    const orders = Game.market.getAllOrders({ resourceType })
    for (const order of orders) {
      // Make sure the order isn't coming from a room we own
      if (CollectiveManager.communes.has(order.roomName)) continue

      const roomMemory = Memory.rooms[order.roomName]
      // Filter out orders from players we hate
      if (
        roomMemory &&
        Memory.players[roomMemory[RoomMemoryKeys.owner]] &&
        Memory.players[roomMemory[RoomMemoryKeys.owner]][PlayerMemoryKeys.hate] > 0
      ) {
        continue
      }

      ordersByType[order.type as MarketOrderTypes].push(order)
    }

    this.cachedOrders[resourceType] = ordersByType
    return ordersByType[orderType]
  }

  /**
   * My outgoing orders organized by room, order type and resourceType
   */
  static _myOrders: {
    [roomName: string]: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>>
  }

  /**
   * Gets my outgoing orders organized by room, order type and resourceType
   */
  static get myOrders() {
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
  static _myOrdersCount: number

  /**
   * Gets the number of orders owned by me
   */
  static get myOrdersCount() {
    if (this._myOrdersCount !== undefined) return this._myOrdersCount

    return (this._myOrdersCount = Object.keys(Game.market.orders).length)
  }

  static _isMarketFunctional: boolean
  /**
   * Determines if it is functional based on the existence of orders
   */
  static get isMarketFunctional() {
    if (this._isMarketFunctional !== undefined) return this._isMarketFunctional

    return (this._isMarketFunctional = !!Game.market.getAllOrders().length)
  }

  private static resourceHistory: Partial<{
    [key in MarketResourceConstant]: { [days: string]: number }
  }>
  /**
   * Finds the average trading price of a resourceType over a set amount of days
   */
  static getAvgPrice(resourceType: MarketResourceConstant, days = 2) {
    if (this.resourceHistory[resourceType] && this.resourceHistory[resourceType][days]) {
      return this.resourceHistory[resourceType][days]
    }

    // Get the market history for the specified resourceType

    const history = Game.market.getHistory(resourceType)
    if (!history.length) return 1

    let totalPrice = 0

    // For every day of history, add to the total price

    for (let index = 0; index <= days; index += 1) {
      if (!history[index]) continue
      totalPrice += history[index].avgPrice
    }

    // Inform the average price
    const avgPrice = totalPrice / days
    //cache the result
    this.resourceHistory[resourceType] ??= {}
    this.resourceHistory[resourceType][days]
    return avgPrice
  }

  static decidePrice(
    resourceType: ResourceConstant,
    priority: number,
    startTick: number = Game.time,
  ) {}
}

export type MarketOrderTypes = ORDER_BUY | ORDER_SELL

export type CachedMarketOrders = Partial<{
  [key in MarketResourceConstant]: {
    [key in MarketOrderTypes]: Order[]
  }
}>
