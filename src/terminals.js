let globalFunctions = require("globalFunctions")

function terminals(room, terminal) {

    if (!terminal) return

    if (Game.shard.name == "CarsonComputer") return

    var sellAll = false
    var orderBlacklist = [RESOURCE_ENERGY]

    _.forEach(Game.market.orders, order => {

        // Delete all orders if requested
        if (sellAll == true) {

            console.log("Terminal is deleting it all")
            Game.market.cancelOrder(order.id)

        } else {
            for (let resource in terminal.store) {

                // If not resources left remove the order, otherwise put the resource type in the black list
                if (order.remainingAmount == 0) {

                    console.log("Terminal " + room.name + " wants to delete order for:" + resource)
                    Game.market.cancelOrder(order.id)

                } else if (order.resourceType == resource) {


                    orderBlacklist.push(resource)
                    console.log("Terminal " + room.name + " has a market offer for: " + resource + ", " + (order.remainingAmount / 1000).toFixed(0) + "k")

                }
            }
        }
    })
    for (let resource in terminal.store) {

        if (terminal.store[resource] >= 20000 && orderBlacklist.indexOf(resource) == -1) {

            let buyOrder

            // First try to find a buy offer
            if (globalFunctions.findOrders(ORDER_BUY, resource).length > 0) {

                for (let order of globalFunctions.findOrders(ORDER_BUY, resource)) {

                    if (order && order.price >= globalFunctions.avgPrice(resource) * 0.9) {

                        let buyAmount = 10000

                        if (order.amount < 10000) {

                            buyAmount = order.amount
                        }

                        Game.market.deal(order.id, buyAmount, room.name)

                        buyOrder = true
                        break
                    }
                }
            }

            // If no buy orders make a sell order
            if (!buyOrder && Object.keys(Game.market.orders).length < 300) {

                //console.log("Terminal " + room.name + " wants to make a sell order for: " + resource)
                Game.market.createOrder({ type: ORDER_SELL, resourceType: resource, price: globalFunctions.avgPrice(resource) * 0.9, totalAmount: 10000, roomName: room.name });
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

            let batterySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_BATTERY && order.price <= globalFunctions.avgPrice(RESOURCE_BATTERY) * 1.2 && order.amount >= (batteryQuota - terminal.store.getUsedCapacity([RESOURCE_BATTERY])))

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

            let energySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_ENERGY && order.price <= globalFunctions.avgPrice(RESOURCE_ENERGY) * 1.2 && order.amount >= (energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])))

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

            let energySellOffers = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_ENERGY && order.price <= globalFunctions.avgPrice(RESOURCE_ENERGY) * 1.2 && order.amount >= (energyQuota - terminal.store.getUsedCapacity([RESOURCE_ENERGY])))

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

                    let buyOrders = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == filteredResource && order.price < globalFunctions.avgPrice(filteredResource) * 1.2 && order.amount >= (6000 - terminal.store.getUsedCapacity([filteredResource])))

                    if (buyOrders[0]) {

                        console.log("Found order for: " + filteredResource + ", " + room + ", " + buyOrders[0]["id"] + ", " + buyOrders[0].amount)
                        Game.market.deal(buyOrders[0]["id"], 6000 - terminal.store.getUsedCapacity([filteredResource]), room.name)

                    }
                }
            }
        }
    }

    if (room.controller.level == 8) {

        if (terminal.store[RESOURCE_POWER] < 5000 && globalFunctions.findOrders(ORDER_SELL, RESOURCE_POWER).length > 0) {

            for (let order of globalFunctions.findOrders(ORDER_SELL, RESOURCE_POWER)) {

                if (order && order.price >= globalFunctions.avgPrice(RESOURCE_POWER) * 0.9) {

                    let buyAmount = 6000

                    if (order.amount < 6000) {

                        buyAmount = order.amount
                    }

                    Game.market.deal(order.id, buyAmount, room.name)

                    buyOrder = true
                    break
                }
            }
        }
    }
}

module.exports = terminals