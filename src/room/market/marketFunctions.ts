import { customLog, findLargestTransactionAmount, getAvgPrice } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.advancedSell = function (resourceType, amount, targetAmount) {
    // Get orders specific to this situation

    const mySpecificOrders = internationalManager.myOrders[this.name]?.[ORDER_SELL][resourceType] || []

    // Loop through each specific order and subtract the remainingAmount

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    // If the amount is less or equal to 0, stop

    if (amount <= targetAmount * 0.5) return false

    // Otherwise, find buy orders for the resourceType and loop through them

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
            ; (global.roomStats.commune[this.name] as RoomCommuneStats).eos += amount
        }

        return result == OK
    }

    // If there is already an order in this room for the resourceType, inform true

    if (mySpecificOrders.length) return false

    // If there are too many existing orders, inform false

    if (internationalManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    // Decide a price based on existing market orders, at max of the adjusted average price

    const orders = internationalManager.orders[ORDER_SELL][resourceType]
    const price = Math.max(
        Math.min.apply(
            Math,
            orders.map(o => o.price),
        ) * 0.99,
        getAvgPrice(resourceType) * 0.8,
    )

    // Otherwise, create a new market order and inform true

    const result = Game.market.createOrder({
        roomName: this.name,
        type: ORDER_SELL,
        resourceType,
        price,
        totalAmount: amount,
    })
    if (result === OK && resourceType === 'energy') {
        ; (global.roomStats.commune[this.name] as RoomCommuneStats).eos += amount
    }
    return result == OK
}

Room.prototype.advancedBuy = function (resourceType, amount, targetAmount) {
    // Get orders specific to this situation

    const mySpecificOrders = internationalManager.myOrders[this.name]?.[ORDER_BUY][resourceType] || []

    // Loop through each specific order and subtract the remainingAmount

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    // If the amount is less or equal to 0, stop

    if (amount <= targetAmount * 0.5) return false

    // Otherwise, find buy orders for the resourceType and loop through them

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
            ; (global.roomStats.commune[this.name] as RoomCommuneStats).eib += amount
        }
        return result == OK
    }

    // If there is already an order in this room for the resourceType, inform true

    if (mySpecificOrders.length) return false

    // If there are too many existing orders, inform false

    if (internationalManager.myOrdersCount === MARKET_MAX_ORDERS) return false

    // Decide a price based on existing market orders, at min of the adjusted average price

    const orders = internationalManager.orders[ORDER_BUY][resourceType]
    const price = Math.min(
        Math.max.apply(
            Math,
            orders.map(o => o.price),
        ) * 1.01,
        getAvgPrice(resourceType) * 1.2,
    )

    // Otherwise, create a new market order and inform true

    const result = Game.market.createOrder({
        roomName: this.name,
        type: ORDER_BUY,
        resourceType,
        price,
        totalAmount: amount,
    })
    if (result === OK && resourceType === 'energy') {
        ; (global.roomStats.commune[this.name] as RoomCommuneStats).eib += amount
    }
    return result == OK
}
