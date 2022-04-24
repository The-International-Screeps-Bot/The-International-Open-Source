import { customLog, findLargestTransactionAmount, getAvgPrice } from "international/generalFunctions"
import { internationalManager } from "international/internationalManager"

Room.prototype.advancedSell = function(resourceType, amount) {

    const room = this,

    // Get orders specific to this situation

    mySpecificOrders = internationalManager.myOrders[room.name]?.[ORDER_SELL][resourceType] || []

    // Loop through each specific order and subtract the remainingAmount

    for (const order of mySpecificOrders) amount -= order.remainingAmount

    // If the amount is less or equal to 0, stop

    if (amount <= 0) return false

    // Otherwise, find buy orders for the resourceType and loop through them

    for (const order of internationalManager.getBuyOrders(resourceType)) {

        amount = findLargestTransactionAmount(room.terminal.store.getUsedCapacity(RESOURCE_ENERGY), amount, room.name, order.roomName)

        Game.market.deal(order.id, Math.min(amount, order.remainingAmount), room.name)
        return true
    }

    // If there is already an order in this room for the resourceType, inform true

    if (mySpecificOrders.length) return false

    // If there are too many existing orders, inform false

    if (internationalManager.myOrdersCount == 300) return false

    // Otherwise, create a new market order and inform true

    Game.market.createOrder({
        roomName: room.name,
        type: ORDER_SELL,
        resourceType,
        price: getAvgPrice(resourceType) * 0.8,
        totalAmount: amount
    })

    return true
}

Room.prototype.advancedBuy = function(resourceType, amount) {

    const room = this

    return false


}
