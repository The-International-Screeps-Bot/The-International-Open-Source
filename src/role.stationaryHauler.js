let roomVariables = require("roomVariables")

module.exports = {
    run: function(creep) {

        let { specialStructures } = roomVariables(creep.room)

        let baseLink = specialStructures.links.baseLink

        let terminal = creep.room.terminal

        let storage = creep.room.storage

        let factory = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_FACTORY
        })[0]

        const anchorPoint = creep.room.memory.anchorPoint

        if (creep.pos.x != anchorPoint.x || creep.pos.y != anchorPoint.y) {

            creep.say("M A")

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: anchorPoint, range: 0 },
                plainCost: 1,
                swampCost: 1,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })
        } else {

            creep.hasResource()

            if (baseLink && baseLink.store[RESOURCE_ENERGY] >= 700 && ((storage && storage.store[RESOURCE_ENERGY] <= 400000) || (terminal && terminal.store[RESOURCE_ENERGY] <= 100000)) && (terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 || storage.store.getUsedCapacity() <= storage.store.getCapacity() - 800)) {

                creep.memory.withdrawBaseLink = true
            }
            if (terminal && factory && terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 && factory.store[RESOURCE_ENERGY] >= 800) {

                creep.memory.factoryWithdrawEnergy = true
            }
            if (terminal && factory && factory.store.getUsedCapacity() <= factory.store.getCapacity() - 800 && factory.store[RESOURCE_BATTERY] <= 2000 && terminal.store[RESOURCE_BATTERY] >= 800) {

                creep.memory.terminalWithdrawBattery = true
            }
            if (storage && storage.store[RESOURCE_ENERGY] >= 120000 && terminal && terminal.store[RESOURCE_ENERGY] < 120000 && terminal.store.getFreeCapacity() >= creep.store.getCapacity()) {

                creep.memory.storageToTerminal = true
            }
            if (storage && storage.store[RESOURCE_ENERGY] < 10000 && terminal && terminal.store[RESOURCE_ENERGY] > storage.store[RESOURCE_ENERGY]) {

                creep.memory.terminalToStorage = true
            }

            //if (storage && storage.store[RESOURCE_ENERGY] >= 200000 && controllerLink != null && controllerLink.store[RESOURCE_ENERGY] <= 400) {

            //creep.memory.transferControllerLink = true
            //}

            const withdrawBaseLink = creep.memory.withdrawBaseLink

            const terminalWithdrawBattery = creep.memory.terminalWithdrawBattery

            const factoryWithdrawEnergy = creep.memory.factoryWithdrawEnergy

            const transferControllerLink = creep.memory.transferControllerLink

            const storageToTerminal = creep.memory.storageToTerminal

            const terminalToStorage = creep.memory.terminalToStorage

            creep.say("🚬")

            if (withdrawBaseLink) {

                creep.say("WBL")

                if (creep.memory.isFull == true) {

                    if (storage.store[RESOURCE_ENERGY] <= 250000 && storage.store.getUsedCapacity() < storage.store.getCapacity() - 800) {

                        for (let resource in creep.store) {

                            creep.transfer(storage, resource)
                        }

                        creep.memory.withdrawBaseLink = false

                    } else if (terminal.store.getUsedCapacity() < terminal.store.getCapacity() - 800) {

                        for (let resource in creep.store) {

                            creep.transfer(terminal, resource)
                        }

                        creep.memory.withdrawBaseLink = false
                    }
                } else {

                    creep.withdraw(baseLink, RESOURCE_ENERGY)
                }
            } else {

                if (factoryWithdrawEnergy) {

                    creep.say("FWE")

                    if (creep.memory.isFull == true) {

                        for (let resource in creep.store) {

                            creep.transfer(terminal, resource)
                        }

                        creep.memory.factoryWithdrawEnergy = false

                    } else {

                        creep.withdraw(factory, RESOURCE_ENERGY)
                    }
                } else {

                    if (terminalWithdrawBattery) {

                        creep.say("TWB")

                        if (creep.memory.isFull == true) {

                            creep.transfer(factory, RESOURCE_BATTERY)
                            creep.memory.terminalWithdrawBattery = false
                        } else {

                            creep.withdraw(terminal, RESOURCE_BATTERY)
                        }
                    } else {

                        if (transferControllerLink) {

                            creep.say("TCL")

                            if (creep.memory.isFull == true) {

                                creep.transfer(baseLink, RESOURCE_ENERGY)
                            } else {

                                creep.withdraw(storage, RESOURCE_ENERGY)
                            }
                        } else {

                            if (storageToTerminal) {

                                creep.say("STT")

                                if (creep.memory.isFull == true) {

                                    creep.transfer(terminal, RESOURCE_ENERGY)
                                    creep.memory.storageToTerminal = false

                                } else {

                                    creep.withdraw(storage, RESOURCE_ENERGY)
                                }
                            } else {

                                if (terminalToStorage) {

                                    creep.say("TTS")

                                    if (creep.memory.isFull == true) {

                                        creep.transfer(storage, RESOURCE_ENERGY)
                                        creep.memory.terminalToStorage = false

                                    } else {

                                        creep.withdraw(terminal, RESOURCE_ENERGY)
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