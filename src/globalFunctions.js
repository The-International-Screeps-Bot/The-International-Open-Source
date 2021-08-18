global.cacheValue = function(value) {

    if (!cachedValues[value]) cachedValues[value] = value

    return value
}
global.avgPrice = function(resource) {

    let resourceHistory = Game.market.getHistory(resource)
    let avgPrices = []
    let totalPrice = 0

    for (let object of resourceHistory) {

        avgPrices.push(object.avgPrice)
    }
    for (let price of avgPrices) {

        totalPrice += price
    }

    let avg = totalPrice / avgPrices.length
    console.log(avg)

    return avg
}

global.findOrders = function(orderType, resourceType) {

    let orders = Game.market.getAllOrders({ type: orderType, resourceType: resourceType })

    return orders
}


global.findObjectWithId = function(id) {

    if (!id || Game.getObjectById(id) == null) return false

    return Game.getObjectById(id)
}