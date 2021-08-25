global.avgPrice = function(resource) {

    let resourceHistory = Game.market.getHistory(resource)

    return resourceHistory[0].avgPrice
}

global.findOrders = function(orderType, resourceType) {

    let orders = Game.market.getAllOrders({ type: orderType, resourceType: resourceType })

    return orders
}

global.findObjectWithId = function(id) {

    if (!id || Game.getObjectById(id) == null) return false

    return Game.getObjectById(id)
}

global.removePropertyFromArray = function(array, property) {

    let i = 0

    while (i < array.length) {

        if (array[i] == property) return array.slice(i + 1)

        i++
    }

    return false
}