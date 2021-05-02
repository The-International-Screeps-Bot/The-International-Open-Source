module.exports = {
    run: function terminals() {
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {
        
                let terminal = room.terminal
            
                if (terminal) {
                    
                    var sellAll = false
                    var orderBlacklist = []
                    
                    _.forEach(Game.market.orders, order => {
                
                        if (sellAll == true) {
                
                            console.log("Terminal is deleting it all")
                            Game.market.cancelOrder(order.id)
                
                        } else {
                            for (let resource in terminal.store) {
                
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
                        if (orderBlacklist.indexOf(resource) == -1 && terminal.store[resource] >= 20000 && Object.keys(Game.market.orders).length < 300 && resource != RESOURCE_ENERGY) {
                
                            let resourceHistory = Game.market.geterminaltory(resource);
                            let sellPrice = resourceHistory[0]["avgPrice"] * 0.8
                            console.log("SP: " + sellPrice + ", " + resource);
                            //console.log(orderBlacklist)
                
                            console.log("Terminal " + room.name + " wants to make a sell order for: " + resource)
                            Game.market.createOrder({ type: ORDER_SELL, resourceType: resource, price: sellPrice, totalAmount: 15000, roomName: room.name });
                
                        }
                    }
                    
                    if (Memory.global.establishedRooms < 3  && Game.market.credits >= 100000 && terminal.store[RESOURCE_ENERGY] <= 100000) {
                        
                        //console.log(RESOURCE_ENERGY + ", " + terminal.room.name)
                
                        let buyOrders = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == RESOURCE_ENERGY && order.price <= 1 && order.amount >= (120000 - terminal.store.getUsedCapacity([RESOURCE_ENERGY])))
                
                        if (buyOrders[0]) {
                
                            //console.log("Found order for: " + RESOURCE_ENERGY + ", " + terminal.room + ", " + buyOrders[0]["id"] + ", " + buyOrders[0].amount + buyOrders[0].roomName)
                            //console.log(120000 - terminal.store[RESOURCE_ENERGY])
                            
                            let buyAmount = 120000 - terminal.store.getUsedCapacity([RESOURCE_ENERGY])
                            let buyCost = Game.market.calcTransactionCost(buyAmount, room.name, buyOrders[0].roomName)
                            
                            //console.log(buyCost + "BC")
                            
                            for (let i = 120000; i > 0; i -= 1000) {
                                
                                console.log(i)
                                Game.market.deal(buyOrders[0]["id"], i, room.name)
                            }
                        }
                    }
                
                    let commodities = []
                
                    let gameResources = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2", "UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2", "UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO", "OH", "ZK", "UL", "G", "OH", "ZK", "UL", "G", "H", "O", "U", "K", "L", "Z", "X"]
                
                    let t3Boosts = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
                    let t2Boosts = ["UH2O", "UHO2", "KH2O", "KHO2", "LH2O", "LHO2", "ZH2O", "ZHO2", "GH2O", "GHO2"]
                    let t1Boosts = ["UH", "UO", "KH", "KO", "LH", "LO", "ZH", "ZO", "GH", "GO"]
                    let bases = ["OH", "ZK", "UL", "G"]
                    let minerals = ["H", "O", "U", "K", "L", "Z", "X"]
                
                    if (terminal.room.controller.level >= 7) {
                        for (let resources of gameResources) {
                
                            for (let resource of t3Boosts) {
                
                                if (resources == resource && terminal.store.getUsedCapacity([resource]) < 5000) {
                
                                    //console.log(resources)
                
                                }
                            }
                            for (let resource of t2Boosts) {
                
                                if (resources == resource && terminal.store.getUsedCapacity([resource]) < 3000) {
                
                                    //console.log(resources)
                
                                }
                            }
                            for (let resource of t1Boosts) {
                
                                if (resources == resource && terminal.store.getUsedCapacity([resource]) < 2000) {
                
                                    //console.log(resources)
                
                                }
                            }
                            for (let resource of bases) {
                
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
                
                                    let buyOrders = Game.market.getAllOrders(order => order.type == ORDER_SELL && order.resourceType == filteredResource && order.price < 1 && order.amount >= (6000 - terminal.store.getUsedCapacity([filteredResource])))
                
                                    if (buyOrders[0]) {
                
                                        console.log("Found order for: " + filteredResource + ", " + room + ", " + buyOrders[0]["id"] + ", " + buyOrders[0].amount)
                                        Game.market.deal(buyOrders[0]["id"], 6000 - terminal.store.getUsedCapacity([filteredResource]), room.name)
                
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }
}