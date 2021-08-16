module.exports = {
    avgPrice: function(resource) {

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
    },

    findOrders: function(orderType, resourceType) {

        let orders = Game.market.getAllOrders({ type: orderType, resourceType: resourceType })

        return orders
    }
}