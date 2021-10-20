module.exports = function terminals(room) {

    // Stop if Game.time is not divisible by 10

    if (Game.time % 10 != 0) return

    //

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

    buyMinerals()

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

        // Stop if there is more than 5k power in the room

        if (room.findStoredResourceAmount(RESOURCE_POWER) >= requestedAmount / 2) return

        // Find sell orders with resource

        let orders = findOrders(ORDER_SELL, RESOURCE_POWER, avgPrice(resource) * 1.2)

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