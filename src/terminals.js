module.exports = function terminals(room) {

    let terminal = room.get("terminal")

    // Stop if no terminal exists

    if (!terminal) return

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

            // Try to find and sell to a buy order

            if (createBuyOrder()) return

            function createBuyOrder() {

                // Find buy orders with resource

                let orders = findOrders(ORDER_BUY, resource)

                // Stop if there are no orders

                if (orders.length == 0) return

                // Loop through buy orders of this resource

                for (let order of orders) {

                    // Iterate if price less fairly below avgPrice

                    if (order.price < avgPrice(resource) * 0.9) continue

                    // Buy amount is the lowest of 10,000 or order amount

                    let buyAmount = Math.min(order.amount, 10000)

                    // Sell resources order

                    Game.market.deal(order.id, buyAmount, room.name)
                    return
                }
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
            }
        }
    }

    if (Memory.global.globalStage <= 2 && Game.market.credits >= 100000 && terminal.store[RESOURCE_ENERGY] <= 100000 && room.controller.level <= 7) {

        //console.log(RESOURCE_ENERGY + ", " + terminal.room.name)

        let factory = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_FACTORY
        })[0]

        if (factory) {

            let batteryQuota = 10000 // 10k

            let batterySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_BATTERY && order.price <= avgPrice(RESOURCE_BATTERY) * 1.2 && order.amount >= (batteryQuota - terminal.store.getUsedCapacity([RESOURCE_BATTERY])))

            if (terminal.store[RESOURCE_BATTERY] < batteryQuota && batterySellOffers[0]) {

                //console.log("Found order for: " + RESOURCE_BATTERY + ", " + terminal.room + ", " + batterySellOffers[0]["id"] + ", " + batterySellOffers[0].amount + batterySellOffers[0].roomName)
                //console.log(batteryQuota - terminal.store[RESOURCE_BATTERY])

                let buyAmount = batteryQuota - terminal.store.getUsedCapacity([RESOURCE_BATTERY])
                let buyCost = Game.market.calcTransactionCost(buyAmount, room.name, batterySellOffers[0].roomName)

                //console.log(buyCost + "BC")

                for (let i = batteryQuota; i > 0; i -= 1000) {

                    Game.market.deal(batterySellOffers[0]["id"], i, room.name)
                }
            }

            let energyQuota = 50000 // 50k

            let energySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_ENERGY && order.price <= avgPrice(RESOURCE_ENERGY) * 1.2 && order.amount >= (energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])))

            if (energySellOffers[0]) {

                //console.log("Found order for: " + RESOURCE_ENERGY + ", " + terminal.room + ", " + energySellOffers[0]["id"] + ", " + energySellOffers[0].amount + energySellOffers[0].roomName)
                //console.log(energyQuota - terminal.store[RESOURCE_ENERGY])

                let buyAmount = energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])
                let buyCost = Game.market.calcTransactionCost(buyAmount, room.name, energySellOffers[0].roomName)

                //console.log(buyCost + "BC")

                for (let i = energyQuota; i > 0; i -= 1000) {

                    Game.market.deal(energySellOffers[0]["id"], i, room.name)
                }
            }
        } else {

            let energyQuota = 100000 // 100k

            let energySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_ENERGY && order.price <= avgPrice(RESOURCE_ENERGY) * 1.2 && order.amount >= (energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])))

            if (energySellOffers[0]) {

                //console.log("Found order for: " + RESOURCE_ENERGY + ", " + terminal.room + ", " + energySellOffers[0]["id"] + ", " + energySellOffers[0].amount + energySellOffers[0].roomName)
                //console.log(energyQuota - terminal.store[RESOURCE_ENERGY])

                let buyAmount = energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])
                let buyCost = Game.market.calcTransactionCost(buyAmount, room.name, energySellOffers[0].roomName)

                //console.log(buyCost + "BC")

                for (let i = energyQuota; i > 0; i -= 1000) {

                    Game.market.deal(energySellOffers[0]["id"], i, room.name)
                }
            }
        }
    }

    if (room.controller.level == 8) {

        //Check if room needs to support another room

        if (Memory.global.needsEnergy.length > 0 && terminal.store[RESOURCE_ENERGY] >= 100000) {

            terminal.send(RESOURCE_ENERGY, 50000, Memory.global.needsEnergy[0], 'needsEnergy Fulfillment')
        }
    }

    let commodities = []

    let t3Boosts = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
    let t2Boosts = ["UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2"]
    let t1Boosts = ["UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO"]
    let bases = ["OH", "ZK", "UL", "G"]
    let minerals = ["H", "O", "U", "K", "L", "Z", "X"]

    if (room.controller.level >= 7) {
        for (let resources of minerals) {

            for (let resource of t3Boosts) {

                if (resources == resource && terminal.store.getUsedCapacity([resource]) < 5000) {

                    //console.log(resources)

                }
            }
            for (let resource of minerals) {

                let filteredMinerals = []

                if (resources == resource && terminal.store.getUsedCapacity([resources]) < 5000) {

                    filteredMinerals.push(resources)

                }

                for (let filteredResource of filteredMinerals) {

                    //console.log(filteredResource + ", " + terminal.room.name)

                    let buyOrders = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == filteredResource && order.price < avgPrice(filteredResource) * 1.2 && order.amount >= (6000 - terminal.store.getUsedCapacity([filteredResource])))

                    if (buyOrders[0]) {

                        console.log("Found order for: " + filteredResource + ", " + room + ", " + buyOrders[0]["id"] + ", " + buyOrders[0].amount)
                        Game.market.deal(buyOrders[0]["id"], 6000 - terminal.store.getUsedCapacity([filteredResource]), room.name)

                    }
                }
            }
        }
    }

    buyPower()

    function buyPower() {

        const controller = room.get("controller")

        // Stop if controller leve isn't 8

        if (controller.level != 8) return

        // Stop if there is more than 5k power in the room

        if (room.findStoredResourceAmount(RESOURCE_POWER) >= 5000) return

        // Find power orders

        let powerOrders = findOrders(ORDER_SELL, RESOURCE_POWER)

        for (let order of powerOrders) {

            // Iterate if the price is fairly above average

            if (order.price >= avgPrice(RESOURCE_POWER) * 0.9) continue

            // Purchase lowest of order amount or 6000

            let buyAmount = Math.min(order.amount, 6000)

            // Buy resource

            Game.market.deal(order.id, buyAmount, room.name)
            break
        }
    }
}