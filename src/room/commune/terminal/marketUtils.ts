import { customLog } from 'utils/logging'
import { findLowestScore, getAvgPrice } from 'utils/utils'
import { collectiveManager } from 'international/collective'
import { statsManager } from 'international/statsManager'
import { marketOrdersManager } from 'international/marketOrders'
import { Result } from 'international/constants'

export const marketUtils = {
    advancedSell(room: Room, resourceType: ResourceConstant, amount: number, targetAmount: number) {
        const mySpecificOrders =
            marketOrdersManager.myOrders[room.name]?.[ORDER_SELL][resourceType] || []

        for (const order of mySpecificOrders) amount -= order.remainingAmount

        if (amount <= targetAmount * 0.5) return false

        const order = marketOrdersManager.getBuyOrder(resourceType)

        if (order) {
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

            if (result === OK && resourceType === 'energy') {
                statsManager.updateStat(room.name, 'eos', amount)
            } else if (result === OK && resourceType === 'battery') {
                statsManager.updateStat(room.name, 'eos', amount * 10)
            }

            return Result.success
        }

        if (mySpecificOrders.length) return false
        if (Game.market.credits < collectiveManager.minCredits) return false
        if (marketOrdersManager.myOrdersCount === MARKET_MAX_ORDERS) return false

        const orders = marketOrdersManager.orders[ORDER_SELL][resourceType]
        if (!orders) return false

        const price = Math.max(
            Math.min(...orders.map(o => o.price)) * 0.99,
            getAvgPrice(resourceType) * 0.8,
        )

        const result = Game.market.createOrder({
            roomName: room.name,
            type: ORDER_SELL,
            resourceType,
            price,
            totalAmount: amount,
        })
        if (result !== OK) return Result.fail

        if (result === OK && resourceType === 'energy') {
            statsManager.updateStat(room.name, 'eos', amount)
        } else if (result === OK && resourceType === 'battery') {
            statsManager.updateStat(room.name, 'eos', amount * 10)
        }

        return Result.success
    },
    advancedBuy(room: Room, resourceType: ResourceConstant, amount: number, targetAmount: number) {
        const mySpecificOrders =
            marketOrdersManager.myOrders[room.name]?.[ORDER_BUY][resourceType] || []

        for (const order of mySpecificOrders) amount -= order.remainingAmount

        if (amount <= targetAmount * 0.5) return false

        const order = marketOrdersManager.getSellOrder(
            resourceType,
            getAvgPrice(resourceType) * 1.2,
        )

        if (order) {
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

            if (result === OK && resourceType === 'energy') {
                statsManager.updateStat(room.name, 'eib', amount)
            } else if (result === OK && resourceType === 'battery') {
                statsManager.updateStat(room.name, 'eib', amount * 10)
            }
            return Result.success
        }

        if (mySpecificOrders.length) return false
        if (marketOrdersManager.myOrdersCount === MARKET_MAX_ORDERS) return false

        const orders = marketOrdersManager.orders[ORDER_BUY][resourceType]
        if (!orders) return false

        const price = Math.min(
            Math.max(...orders.map(o => o.price)) * 1.01,
            getAvgPrice(resourceType) * 1.2,
        )

        const result = Game.market.createOrder({
            roomName: room.name,
            type: ORDER_BUY,
            resourceType,
            price,
            totalAmount: amount,
        })
        if (result !== OK) return Result.fail

        if (result === OK && resourceType === 'energy') {
            statsManager.updateStat(room.name, 'eib', amount)
        } else if (result === OK && resourceType === 'battery') {
            statsManager.updateStat(room.name, 'eib', amount * 10)
        }

        return Result.success
    },
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
    },
}
