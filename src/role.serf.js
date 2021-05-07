module.exports = {
    run: function(creep) {

        //Not on a if full / not full basis, but instead commands. If baseLink is full, run baseLink function. If power spawn is empty and we have energy and power in storage or terminal, fill it. Etc.

        let baseLink = Game.getObjectById(creep.room.memory.baseLink)
        let terminal = creep.room.terminal
        let storage = creep.room.storage
        let factory = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_FACTORY
        })[0]

        // requiredStructures = array listed structures that are not null of undefined

        // for every requiredStructure until if number of structures == i return stationaryPoint

        let unfilteredRequiredStructures = [baseLink, terminal, storage, factory]
        let requiredStructures = []

        for (let structure of unfilteredRequiredStructures) {

            if (structure && structure != null) {

                requiredStructures.push(structure)
            }
        }

        const stationaryPos = creep.room.memory.stationaryPos

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

                            creep.room.memory.stationaryPos = position
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

                const withdrawBaseLink = creep.memory.withdrawBaseLink
                const terminalWithdrawBattery = creep.memory.terminalWithdrawBattery
                const factoryWithdrawEnergy = creep.memory.factoryWithdrawEnergy

                if (baseLink != null && baseLink.store[RESOURCE_ENERGY] >= 700 && storage && storage.store[RESOURCE_ENERGY] <= 200000 && terminal && terminal.store[RESOURCE_ENERGY] <= 100000 && (terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 || storage.store.getUsedCapacity() <= storage.store.getCapacity() - 800)) {

                    withdrawBaseLink = true
                }
                if (terminal && factory && terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 && factory.store[RESOURCE_ENERGY] >= 800) {

                    factoryWithdrawEnergy = true
                }
                if (terminal && factory && factory.store.getUsedCapacity() <= factory.store.getCapacity() - 800 && factory.store[RESOURCE_BATTERY] <= 2000 && terminal.store[RESOURCE_BATTERY] >= 800) {

                    terminalWithdrawBattery = true
                }

                if (withdrawBaseLink) {

                    if (creep.memory.isFull == true) {

                        if (storage.store[RESOURCE_ENERGY] <= 200000) {

                            creep.transfer(storage, RESOURCE_ENERGY)
                            withdrawBaseLink = false
                        } else if (terminal.store[RESOURCE_ENERGY] <= 100000) {

                            creep.transfer(storage, RESOURCE_ENERGY)
                            withdrawBaseLink = false
                        }
                    } else {

                        creep.withdraw(baseLink, RESOURCE_ENERGY)
                    }
                } else {

                    if (factoryWithdrawEnergy) {

                        if (creep.memory.isFull == true) {

                            creep.transfer(terminal, RESOURCE_ENERGY)
                            factoryWithdrawEnergy = false

                        } else {

                            creep.withdraw(factory, RESOURCE_ENERGY)
                        }
                    } else {

                        if (terminalWithdrawBattery) {

                            if (creep.memory.isFull == true) {

                                creep.transfer(factory, RESOURCE_BATTERY)
                                terminalWithdrawBattery = false
                            } else {

                                creep.withdraw(terminal, RESOURCE_BATTERY)
                            }
                        }
                    }
                }
            }
        }
    }
};