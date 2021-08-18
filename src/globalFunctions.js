global.avgPrice = function(resource) {

    let avg = 0
    let total = 0

    let history = Game.market.getHistory(resource)

    for (let trade of history) {

        total += trade.avgPrice
    }

    avg = total / history.length

    return avg
}

global.findOrders = function(orderType, resourceType) {

    let orders = Game.market.getAllOrders({ type: orderType, resourceType: resourceType })

    return orders
}

global.findObjectWithId = function(id) {

    if (!id || Game.getObjectById(id) == false) return false

    return Game.getObjectById(id)
}