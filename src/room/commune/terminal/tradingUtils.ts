import { LogOps } from 'utils/logOps'
import { findLowestScore, roundTo } from 'utils/utils'
import { CollectiveManager } from 'international/collective'
import { StatsManager } from 'international/stats'
import { MarketManager } from 'international/market/marketOrders'
import { Result } from '../../../constants/general'
import { RoomStatsKeys } from '../../../constants/stats'

export class TradingUtils {
  static advancedSell(room: Room, resourceType: ResourceConstant, amount: number) {
    const mySpecificOrders = MarketManager.myOrders[room.name]?.[ORDER_SELL][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= 0) return false

    const order = MarketManager.getShardBuyOrder(room.name, resourceType, amount)

    if (order !== Result.fail) {
      const dealAmount = this.findLargestTransactionAmount(
        room.terminal.store.energy * 0.75,
        amount,
        room.name,
        order.roomName,
      )
      const actualDealAmount = Math.min(dealAmount, order.remainingAmount)
      const result = Game.market.deal(order.id, actualDealAmount, room.name)
      if (result !== OK) return Result.fail

      // Success

      const transactionCost = Game.market.calcTransactionCost(
        actualDealAmount,
        room.name,
        order.roomName,
      )

      StatsManager.updateCommuneStat(
        room.name,
        RoomStatsKeys.EnergyOutputTransactionCosts,
        transactionCost,
      )
      return Result.success
    }

    if (mySpecificOrders.length) return false
    if (Game.market.credits < CollectiveManager.minCredits) return false
    if (MarketManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = MarketManager.getOrders(resourceType, ORDER_SELL)
    if (!orders) return false

    const price = Math.max(
      Math.min(...orders.map(o => o.price)) * 0.99,
      MarketManager.getAvgPrice(resourceType) * 0.8,
    )

    const result = Game.market.createOrder({
      roomName: room.name,
      type: ORDER_SELL,
      resourceType,
      price,
      totalAmount: amount,
    })
    if (result !== OK) return Result.fail

    // Success

    return Result.success
  }

  static advancedBuy(room: Room, resourceType: ResourceConstant, amount: number) {
    const mySpecificOrders = MarketManager.myOrders[room.name]?.[ORDER_BUY][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= 0) return false

    const order = MarketManager.getShardSellOrder(room.name, resourceType, amount)

    if (order !== Result.fail) {
      const dealAmount = this.findLargestTransactionAmount(
        room.terminal.store.energy * 0.75,
        amount,
        room.name,
        order.roomName,
      )

      const result = Game.market.deal(
        order.id,
        Math.min(dealAmount, order.remainingAmount),
        room.name,
      )
      if (result !== OK) return Result.fail

      // Success

      const transactionCost = Game.market.calcTransactionCost(dealAmount, room.name, order.roomName)
      StatsManager.updateCommuneStat(
        room.name,
        RoomStatsKeys.EnergyOutputTransactionCosts,
        transactionCost,
      )

      return Result.success
    }

    if (mySpecificOrders.length) return false
    if (MarketManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = MarketManager.getOrders(resourceType, ORDER_BUY)
    if (!orders) return false

    const price = Math.min(
      Math.max(...orders.map(o => o.price)) * 1.01,
      MarketManager.getAvgPrice(resourceType) * 1.2,
    )

    const result = Game.market.createOrder({
      roomName: room.name,
      type: ORDER_BUY,
      resourceType,
      price,
      totalAmount: amount,
    })
    if (result !== OK) return Result.fail

    // Success

    return Result.success
  }

  /**
   * Finds the largest possible transaction amount given a budget and starting amount
   * @param budget The number of energy willing to be invested in the trade
   * @param amount The number of resources that would like to be traded
   * @param roomName1
   * @param roomName2
   * @returns
   */
  static findLargestTransactionAmount(
    budget: number,
    amount: number,
    roomName1: string,
    roomName2: string,
  ) {
    budget = Math.max(budget, 1)

    // So long as the the transactions cost is more than the budget

    while (Game.market.calcTransactionCost(amount, roomName1, roomName2) >= budget) {
      // Decrease amount exponentially

      amount = (amount - 1) * 0.8
    }

    return Math.floor(amount)
  }
  static advancedDeal(room: Room, order: Order, amount: number) {
    const dealAmount = this.findLargestTransactionAmount(
      room.terminal.store.energy * 0.75,
      amount,
      room.name,
      order.roomName,
    )

    const result = Game.market.deal(
      order.id,
      Math.min(dealAmount, order.remainingAmount),
      room.name,
    )
    if (result !== OK) return Result.fail

    // the deal was an apparent success
    return Result.success
  }

  static getPriority(amount: number, targetAmount: number) {
    // the / 2 is temporary
    const priority = roundTo(1 - amount / targetAmount, 2)
    return priority
  }

  /**
   * Inverse function of priority
   */
  static getTargetAmountFromPriority(priority: number, amount: number) {
    return amount / -(priority - 1)
  }

  /**
   * Inverse function of priority
   */
  static getAmountFromPriority(priority: number, targetAmount: number) {
    return targetAmount * -(priority - 1)
  }
}
