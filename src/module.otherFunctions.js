// for things like terminal functions, spawn function, etc.

function avgPrice(resource) {

    let resourceHistory = Game.market.getHistory(resource)
    let avgPrices = []
    let totalPrice = 0

    for (let object of resourceHistory) {

        avgPrice.push(object.avgPrice)
    }
    _.forEach(avgPrices, function price() {

        totalPrice += price
    })

    let avg = totalPrice / avgPrices.length

    return avg
}