import { customLog, findLargestTransactionAmount, getAvgPrice } from 'utils/utils'
import { collectiveManager } from 'international/collective'
import { updateStat } from 'international/statsManager'

export const marketUtils = {
    advancedSell(room: Room, resourceType: ResourceConstant, amount: number, targetAmount: number) {
        const mySpecificOrders = collectiveManager.myOrders[room.name]?.[ORDER_SELL][resourceType] || []

        for (const order of mySpecificOrders) amount -= order.remainingAmount

        if (amount <= targetAmount * 0.5) return false

        const order = collectiveManager.getBuyOrder(resourceType)

        if (order) {
            const dealAmount = findLargestTransactionAmount(
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
            if (result === OK && resourceType === 'energy') {
                updateStat(room.name, 'eos', amount)
            }

            return result == OK
        }

        if (mySpecificOrders.length) return false
        if (Game.market.credits < collectiveManager.minCredits) return false
        if (collectiveManager.myOrdersCount === MARKET_MAX_ORDERS) return false

        const orders = collectiveManager.orders[ORDER_SELL][resourceType]
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
        if (result === OK && resourceType === 'energy') {
            updateStat(room.name, 'eos', amount)
        }

        return result == OK
    },
    advancedBuy(room: Room, resourceType: ResourceConstant, amount: number, targetAmount: number) {
        const mySpecificOrders = collectiveManager.myOrders[room.name]?.[ORDER_BUY][resourceType] || []

        for (const order of mySpecificOrders) amount -= order.remainingAmount

        if (amount <= targetAmount * 0.5) return false

        const order = collectiveManager.getSellOrder(resourceType, getAvgPrice(resourceType) * 1.2)

        if (order) {
            const dealAmount = findLargestTransactionAmount(
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
            if (result === OK && resourceType === 'energy') {
                updateStat(room.name, 'eib', amount)
            }
            return result == OK
        }

        if (mySpecificOrders.length) return false
        if (collectiveManager.myOrdersCount === MARKET_MAX_ORDERS) return false

        const orders = collectiveManager.orders[ORDER_BUY][resourceType]
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
        if (result === OK && resourceType === 'energy') {
            updateStat(room.name, 'eib', amount)
        }
        return result == OK
    },
}
