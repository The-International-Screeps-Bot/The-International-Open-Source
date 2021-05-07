module.exports = {
    run: function(creep) {

        //Not on a if full / not full basis, but instead commands. If baseLink is full, run baseLink function. If power spawn is empty and we have energy and power in storage or terminal, fill it. Etc.

        creep.checkRoom()

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

            if (creep.pos != stationaryPos) {

                let origin = creep.pos

                let goal = _.map([stationaryPos], function(target) {
                    return { pos: target, range: 0 }
                })

                creep.intraRoomPathing(origin, goal)
            } else {

                creep.isFull()

                if (baseLink != null && baseLink.store[RESOURCE_ENERGY] >= 700 && storage && storage.store[RESOURCE_ENERGY] <= 200000 && terminal && terminal.store[RESOURCE_ENERGY] <= 100000 && (terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800 || storage.store.getUsedCapacity() <= storage.store.getCapacity() - 800)) {

                    if (creep.memory.isFull == true) {

                        if (storage.store[RESOURCE_ENERGY] <= 200000) {

                            creep.transfer(storage, RESOURCE_ENERGY)
                        } else if (terminal.store[RESOURCE_ENERGY] <= 100000) {

                            creep.transfer(storage, RESOURCE_ENERGY)
                        }
                    } else {

                        creep.withdraw(baseLink, RESOURCE_ENERGY)
                    }
                } else {

                    if (terminal && factory && factory.store.getUsedCapacity() <= factory.store.getCapacity() - 800 && factory.store[RESOURCE_BATTERY] <= 2000 && terminal.store[RESOURCE_BATTERY] >= 800) {

                        if (creep.memory.isFull == true) {

                            creep.transfer(factory, RESOURCE_BATTERY)
                        } else {

                            creep.withdraw(terminal, RESOURCE_BATTERY)
                        }
                    } else {

                        if (terminal && factory && terminal.store.getUsedCapacity() <= terminal.store.getCapacity() - 800) {

                            if (creep.memory.isFull == true) {

                                creep.transfer(terminal, RESOURCE_ENERGY)
                            } else {

                                creep.withdraw(factory, RESOURCE_ENERGY)
                            }
                        }
                    }
                }
            }
            /*
            If storage is too full

            if powerspawn needs filling

            if room.memory.nukeRequest is true
            */


            /*
            if (creep.pos != stationaryPos) {

                let origin = creep.pos

                let goal = _.map([stationaryPos], function(target) {
                    return { pos: target, range: 0 }
                })

                creep.intraRoomPathing(origin, goal)
            }

            if (creep.memory.isFull == false && stationaryPos != null && baseLink != null && terminal && storage && creep.pos.inRangeTo(baseLink, 1) && creep.pos.inRangeTo(terminal, 1) && creep.pos.inRangeTo(storage, 1)) {

                if (baseLink.store[RESOURCE_ENERGY] >= 700) {

                    creep.say("BL")

                    creep.withdraw(baseLink, RESOURCE_ENERGY)
                } else {

                    if (terminal && terminal.store[RESOURCE_ENERGY] >= 125000) {

                        creep.withdraw(terminal, RESOURCE_ENERGY)
                    } else if (terminal.store[RESOURCE_BATTERY] >= 800) {

                        creep.withdraw(terminal, RESOURCE_BATTERY)
                    }
                }
            } else {

                /*
                let powerSpawn = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_POWER_SPAWN
                })
                
                if (powerSpawn && (powerSpawn)
                */
            /*

            let storage = creep.room.storage

            if (storage && storage.store[RESOURCE_ENERGY] <= 400000) {

                creep.transfer(storage, RESOURCE_ENERGY)
            } 
            */
        }
    }
};