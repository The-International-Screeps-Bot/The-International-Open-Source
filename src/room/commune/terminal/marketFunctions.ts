import { customLog, findLargestTransactionAmount, getAvgPrice } from 'international/utils'
import { internationalManager } from 'international/international'
import { updateStat } from 'international/statsManager'

Room.prototype.advancedSell = function (resourceType, amount, targetAmount) {
    const mySpecificOrders = internationalManager.myOrders[this.name]?.[ORDER_SELL][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= targetAmount * 0.5) return false

    const order = internationalManager.getBuyOrder(resourceType)

    if (order) {
        const dealAmount = findLargestTransactionAmount(
            this.terminal.store.energy * 0.75,
            amount,
            this.name,
            order.roomName,
        )
        const result = Game.market.deal(order.id, Math.min(dealAmount, order.remainingAmount), this.name)
        if (result === OK && resourceType === 'energy') {
            updateStat(this.name, 'eos', amount)
        }

        return result == OK
    }

    if (mySpecificOrders.length) return false
    if (Game.market.credits < internationalManager.minCredits) return false
    if (internationalManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = internationalManager.orders[ORDER_SELL][resourceType]
    if (!orders) return false

    const price = Math.max(Math.min(...orders.map(o => o.price)) * 0.99, getAvgPrice(resourceType) * 0.8)

    const result = Game.market.createOrder({
        roomName: this.name,
        type: ORDER_SELL,
        resourceType,
        price,
        totalAmount: amount,
    })
    if (result === OK && resourceType === 'energy') {
        updateStat(this.name, 'eos', amount)
    }

    return result == OK
}

Room.prototype.advancedBuy = function (resourceType, amount, targetAmount) {
    const mySpecificOrders = internationalManager.myOrders[this.name]?.[ORDER_BUY][resourceType] || []

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    if (amount <= targetAmount * 0.5) return false

    const order = internationalManager.getSellOrder(resourceType, getAvgPrice(resourceType) * 1.2)

    if (order) {
        const dealAmount = findLargestTransactionAmount(
            this.terminal.store.energy * 0.75,
            amount,
            this.name,
            order.roomName,
        )

        const result = Game.market.deal(order.id, Math.min(dealAmount, order.remainingAmount), this.name)
        if (result === OK && resourceType === 'energy') {
            updateStat(this.name, 'eib', amount)
        }
        return result == OK
    }

    if (mySpecificOrders.length) return false
    if (internationalManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    const orders = internationalManager.orders[ORDER_BUY][resourceType]
    if (!orders) return false

    const price = Math.min(Math.max(...orders.map(o => o.price)) * 1.01, getAvgPrice(resourceType) * 1.2)

    const result = Game.market.createOrder({
        roomName: this.name,
        type: ORDER_BUY,
        resourceType,
        price,
        totalAmount: amount,
    })
    if (result === OK && resourceType === 'energy') {
        updateStat(this.name, 'eib', amount)
    }
    return result == OK
}
