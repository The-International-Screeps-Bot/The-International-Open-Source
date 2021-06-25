module.exports = {
    run: function(creep) {

        //Not on a if full / not full basis, but instead commands. If baseLink is full, run baseLink function. If power spawn is empty and we have energy and power in storage or terminal, fill it. Etc.

        let baseLink = Game.getObjectById(creep.room.memory.baseLink)

        let terminal = creep.room.terminal

        let storage = creep.room.storage

        let factory = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_FACTORY
        })[0]

        let nuker = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_NUKER
        })[0]

        let unfilteredRequiredStructures = [baseLink, terminal, storage, factory, nuker]
        let requiredStructures = []

        for (let structure of unfilteredRequiredStructures) {

            if (structure && structure != null) {

                requiredStructures.push(structure)
            }
        }

        const stationaryPos = creep.memory.stationaryPos

        if (stationaryPos == null && requiredStructures[0]) {

            for (let x = 5; x <= 45; x++) {
                for (let y = 5; y <= 45; y++) {

                    let position = new RoomPosition(x, y, creep.room.name)

                    for (let i = 0; i < requiredStructures.length; i++) {

                        let structure = requiredStructures[i]

                        if (!position.inRangeTo(structure, 1)) {

                            break
                        }
                        if (i + 1 == requiredStructures.length) {

                            creep.memory.stationaryPos = position
                        }
                    }
                }
            }
        } else {

            if (creep.pos.x != stationaryPos.x || creep.pos.y != stationaryPos.y) {

                let origin = creep.pos

                let goal = _.map([stationaryPos], function(target) {
                    return { pos: target, range: 0 }
                })

                creep.intraRoomPathing(origin, goal)
            } else {

                creep.hasResource()

                if (baseLink != null && baseLink.store[RESOURCE_ENERGY] >= 700 && ((storage && storage.store[RESOURCE_ENERGY] <= 400000) || (terminal && terminal.store[RESOURCE_ENERGY] <= 100000)) && (terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 || storage.store.getUsedCapacity() <= storage.store.getCapacity() - 800)) {

                    creep.memory.withdrawBaseLink = true
                }
                if (terminal && factory && terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 && factory.store[RESOURCE_ENERGY] >= 800) {

                    creep.memory.factoryWithdrawEnergy = true
                }
                if (terminal && factory && factory.store.getUsedCapacity() <= factory.store.getCapacity() - 800 && factory.store[RESOURCE_BATTERY] <= 2000 && terminal.store[RESOURCE_BATTERY] >= 800) {

                    creep.memory.terminalWithdrawBattery = true
                }
                if (nuker && nuker.store[RESOURCE_ENERGY] > 0 && ((storage && storage.store[RESOURCE_ENERGY] >= 100000) || (terminal && terminal.store[RESOURCE_ENERGY] >= 100000))) {

                    creep.memory.fillNukerEnergy = true
                }
                if (nuker && nuker.store[RESOURCE_GHODIUM] > 0 && ((storage && storage.store[RESOURCE_GHODIUM] >= 100000) || (terminal && terminal.store[RESOURCE_GHODIUM] >= 100000))) {

                    creep.memory.fullNukerGhodium = true
                }
                creep.say("AAA")
                if (storage && storage.store[RESOURCE_ENERGY] >= 120000 && terminal.store[RESOURCE_ENERGY] < 120000) {

                    creep.memory.storageToTerminal = true
                }
                //if (storage && storage.store[RESOURCE_ENERGY] >= 200000 && controllerLink != null && controllerLink.store[RESOURCE_ENERGY] <= 400) {

                //creep.memory.transferControllerLink = true
                //}

                creep.say("BBB")

                const withdrawBaseLink = creep.memory.withdrawBaseLink

                const terminalWithdrawBattery = creep.memory.terminalWithdrawBattery

                const factoryWithdrawEnergy = creep.memory.factoryWithdrawEnergy

                const fillNukerEnergy = creep.memory.fillNukerEnergy

                const fillNukerGhodium = creep.memory.fullNukerGhodium

                const transferControllerLink = creep.memory.transferControllerLink

                const storageToTerminal = creep.memory.storageToTerminal

                if (withdrawBaseLink) {

                    if (creep.memory.isFull == true) {

                        if (storage.store[RESOURCE_ENERGY] <= 210000) {

                            creep.transfer(storage, RESOURCE_ENERGY)
                            creep.memory.withdrawBaseLink = false

                        } else if (terminal.store.getUsedCapacity() < 300000 - 800) {

                            creep.transfer(terminal, RESOURCE_ENERGY)
                            creep.memory.withdrawBaseLink = false
                        }
                    } else {

                        creep.withdraw(baseLink, RESOURCE_ENERGY)
                    }
                } else {

                    if (factoryWithdrawEnergy) {

                        if (creep.memory.isFull == true) {

                            creep.transfer(terminal, RESOURCE_ENERGY)
                            creep.memory.factoryWithdrawEnergy = false

                        } else {

                            creep.withdraw(factory, RESOURCE_ENERGY)
                        }
                    } else {

                        if (terminalWithdrawBattery) {

                            if (creep.memory.isFull == true) {

                                creep.transfer(factory, RESOURCE_BATTERY)
                                creep.memory.terminalWithdrawBattery = false
                            } else {

                                creep.withdraw(terminal, RESOURCE_BATTERY)
                            }
                        } else {

                            if (transferControllerLink) {

                                if (creep.memory.isFull == true) {

                                    creep.transfer(baseLink, RESOURCE_ENERGY)
                                } else {

                                    creep.withdraw(storage, RESOURCE_ENERGY)
                                }
                            } else {

                                if (fillNukerEnergy) {

                                    if (creep.memory.isFull == true) {

                                        creep.transfer(nuker, RESOURCE_ENERGY)

                                    } else {

                                        if ((storage.store[RESOURCE_ENERGY] <= 80000 && terminal.store[RESOURCE_ENERGY] <= 80000) || nuker.store[RESOURCE_ENERGY] == nuker.store.getCapacity(RESOURCE_ENERGY)) {

                                            creep.memory.fillNukerEnergy = false
                                        } else {

                                            if (storage && storage.store[RESOURCE_ENERGY] >= 100000) {

                                                creep.withdraw(storage, RESOURCE_ENERGY)

                                            } else if (terminal && terminal.store[RESOURCE_ENERGY] >= 100000) {

                                                creep.withdraw(terminal, RESOURCE_ENERGY)
                                            }
                                        }
                                    }
                                } else {

                                    if (fillNukerGhodium) {

                                        if (creep.memory.isFull == true) {

                                            creep.transfer(nuker, RESOURCE_GHODIUM)

                                        } else {

                                            if ((storage.store[RESOURCE_GHODIUM] <= 80000 && terminal.store[RESOURCE_GHODIUM] <= 80000) || nuker.store[RESOURCE_GHODIUM] == nuker.store.getCapacity(RESOURCE_GHODIUM)) {

                                                creep.memory.fillNukerGhodium = false
                                            } else {

                                                if (storage && storage.store[RESOURCE_GHODIUM] >= 100000) {

                                                    creep.withdraw(storage, RESOURCE_GHODIUM)

                                                } else if (terminal && terminal.store[RESOURCE_GHODIUM] >= 100000) {

                                                    creep.withdraw(terminal, RESOURCE_GHODIUM)
                                                }
                                            }
                                        }
                                    } else {

                                        if (storageToTerminal) {

                                            if (creep.memory.isFull == true) {

                                                creep.transfer(terminal, RESOURCE_ENERGY)
                                                creep.memory.storageToTerminal = false

                                            } else {

                                                creep.withdraw(storage, RESOURCE_ENERGY)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};