import { customLog } from 'utils/logging'
import { findLowestScore, roundTo } from 'utils/utils'
import { collectiveManager } from 'international/collective'
import { statsManager } from 'international/statsManager'
import { marketManager } from 'international/market/marketOrders'
import { Result, RoomStatsKeys } from 'international/constants'

export class TradingUtils {
  advancedSell(room: Room, resourceType: ResourceConstant, amount: number) {
    const mySpecificOrders = marketManager.myOrders[room.name]?.[ORDER_SELL][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= 0) return false

    const order = marketManager.getShardBuyOrder(room.name, resourceType, amount)

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

      statsManager.updateCommuneStat(room.name, RoomStatsKeys.EnergyOutputTransactionCosts, transactionCost)
      return Result.success
    }

    if (mySpecificOrders.length) return false
    if (Game.market.credits < collectiveManager.minCredits) return false
    if (marketManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = marketManager.getOrders(resourceType, ORDER_SELL)
    if (!orders) return false

    const price = Math.max(
      Math.min(...orders.map(o => o.price)) * 0.99,
      marketManager.getAvgPrice(resourceType) * 0.8,
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
  advancedBuy(room: Room, resourceType: ResourceConstant, amount: number) {
    const mySpecificOrders = marketManager.myOrders[room.name]?.[ORDER_BUY][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= 0) return false

    const order = marketManager.getShardSellOrder(room.name, resourceType, amount)

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
      statsManager.updateCommuneStat(room.name, RoomStatsKeys.EnergyOutputTransactionCosts, transactionCost)

      return Result.success
    }

    if (mySpecificOrders.length) return false
    if (marketManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = marketManager.getOrders(resourceType, ORDER_BUY)
    if (!orders) return false

    const price = Math.min(
      Math.max(...orders.map(o => o.price)) * 1.01,
      marketManager.getAvgPrice(resourceType) * 1.2,
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
  findLargestTransactionAmount(
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
  advancedDeal(room: Room, order: Order, amount: number) {
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

  getPriority(currentAmount: number, targetAmount: number) {

    // the / 2 is temporary
    const priority = roundTo((1 - currentAmount / targetAmount) / 2, 2)
    return priority
  }

  /**
   * Inverse function of priority
   */
  getTargetAmountFromPriority(priority: number, currentAmount: number) {
    return currentAmount / -((2 * priority) - 1)
  }
}

export const tradingUtils = new TradingUtils()
