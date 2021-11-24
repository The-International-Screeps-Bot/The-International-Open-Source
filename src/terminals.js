module.exports = function terminals(room) {

    let terminal = room.get("terminal")

    // Stop if no terminal exists

    if (!terminal) return

    // Stop if terminal can't do things

    if (terminal.cooldown > 0) return

    // Stop if on my private server

    if (Game.shard.name == "CarsonComputer") return

    //

    var orderBlacklist = [RESOURCE_ENERGY]

    //

    let roomOrders = room.get("orders")

    manageOrders()

    function manageOrders() {

        for (let orderId in roomOrders) {

            //

            let order = roomOrders[orderId]

            // If order has no resources left

            if (order.remainingAmount == 0) {

                // Cancel order

                Game.market.cancelOrder(order.id)
                continue
            }

            // Add resource to blacklist so we don't make duplicate orders

            orderBlacklist.push(resource)
        }
    }

    //

    let minResources = {

    }

    //

    manageResources()

    function manageResources() {

        for (let resource in terminal.store) {

            // Iterate if terminal has less than 20k of resource

            if (terminal.store.getUsedCapacity(resource) < 20000) continue

            // Iterate if resource is blackListed

            if (orderBlacklist.includes(resource)) continue

            let requestedAmount = room.findStoredResourceAmount(resource) / 2

            // Try to find and sell to a buy order

            if (buyResource()) return

            function buyResource() {

                // Find sell orders with resource

                let orders = findOrders(ORDER_SELL, resource, avgPrice(resource) * 1.2)

                // Loop through orders so long as there are orders left and we don't have enough resource

                let i = 0

                while (i < orders.length && room.findStoredResourceAmount(resource) < requestedAmount) {

                    let order = orders[i]

                    // Buy resource

                    Game.market.deal(order.id, requestedAmount - room.findStoredResourceAmount(resource), room.name)

                    // Record iteration

                    i++
                }

                // Inform the operation worked if we have enough of resource

                if (room.findStoredResourceAmount(resource) >= requestedAmount) return true
            }

            // Try to create a sell order

            if (createSellOrder()) return

            function createSellOrder() {

                // Stop if there are max number of orders

                if (findMyOrdersAmount() >= 300) return

                // Stop if credits are less than 50,000

                if (Game.market.credits < 50000) return

                // Create sell order

                Game.market.createOrder({ type: ORDER_SELL, resourceType: resource, price: avgPrice(resource) * 0.9, totalAmount: 10000, roomName: room.name })
                return true
            }
        }
    }

    let commodities = []

    let t3Boosts = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
    let t2Boosts = ["UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2"]
    let t1Boosts = ["UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO"]
    let bases = ["OH", "ZK", "UL", "G"]
    let minerals = ["H", "O", "U", "K", "L", "Z", "X"]

    // buyMinerals()

    function buyMinerals() {

        let requestedAmount = 5000

        for (let resource of minerals) {

            // Iterate if we have enough of the resource

            if (room.findStoredResourceAmount(resource) >= requestedAmount / 2) continue

            // Find sell orders with resource

            let orders = findOrders(ORDER_SELL, resource, avgPrice(resource) * 1.2)

            // Loop through orders so long as there are orders left and we don't have enough resource

            let i = 0

            while (i < orders.length && room.findStoredResourceAmount(resource) < requestedAmount) {

                let order = orders[i]

                // Buy resource

                Game.market.deal(order.id, requestedAmount - room.findStoredResourceAmount(resource), room.name)

                // Record iteration

                i++
            }
        }
    }

    function manageResourceRequests() {


    }

    buyPower()

    function buyPower() {

        const controller = room.get("controller")

        // Stop if controller leve isn't 8

        if (controller.level != 8) return

        //

        let requestedAmount = 5000
        let resource = RESOURCE_POWER

        // Stop if there is more than 5k power in the room

        if (room.findStoredResourceAmount(resource) >= requestedAmount / 2) return

        // Find sell orders with resource

        let orders = findOrders(ORDER_SELL, resource, avgPrice(resource) * 1.2)

        // Loop through orders so long as there are orders left and we don't have enough resource

        let i = 0

        while (i < orders.length && room.findStoredResourceAmount(resource) < requestedAmount) {

            let order = orders[i]

            // Buy resource

            Game.market.deal(order.id, requestedAmount - room.findStoredResourceAmount(resource), room.name)

            // Record iteration

            i++
        }
    }
}