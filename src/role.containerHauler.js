var roleBaseHauler = require('role.baseHauler');

module.exports = {
    run: function(creep) {
        if (creep.room.storage && creep.room.memory.stage >= 4) {

            if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

            if (creep.memory.isFull == true && creep.carry.energy == 0) {

                creep.memory.isFull = false;

            } else if (creep.memory.isFull == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.isFull = true;

            }
            if (creep.memory.isFull == true) {

                var storage = creep.room.storage

                if (storage && storage.store[RESOURCE_ENERGY] <= 5000 && creep.room.energyAvailable != creep.room.energyCapacityAvailable) {

                    creep.say("S")

                    if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(storage, { reusePath: 50 })

                    }
                } else {

                    var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

                    if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 100) {

                        creep.say("cC1")

                        if (creep.transfer(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(controllerContainer, { reusePath: 50 });

                        }
                    } else {

                        if (storage && storage.store[RESOURCE_ENERGY] <= 500000) {

                            creep.say("S")

                            if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(storage, { reusePath: 50 });

                            }
                        } else {

                            if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] <= 1500) {

                                creep.say("cC2")

                                if (creep.transfer(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(controllerContainer, { reusePath: 50 });

                                }
                            } else {

                                let terminal = creep.room.terminal

                                if (terminal && terminal.store[RESOURCE_ENERGY] <= 75000) {

                                    creep.say("T")

                                    if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(terminal, { reusePath: 50 });


                                    }
                                } else {

                                    if (creep.room.storage) {

                                        if (creep.pos.inRangeTo(creep.room.storage, 2)) {

                                            creep.say("D, S")
                                        } else {

                                            creep.say("D, S")

                                            creep.moveTo(storage, { reusePath: 50 })
                                        }
                                    } else {

                                        creep.say("D, No S")
                                    }
                                }
                            }
                        }
                    }
                }
            } else {

                creep.say("F2")

                var sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
                var sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

                creep.say("SC")

                let containerTarget = [sourceContainer1, sourceContainer2]

                //console.log(containerTarget)

                for (var i = 0; i < containerTarget.length; i++) {

                    let container = containerTarget[i]
                    if (container != null) {
                        if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                            break
                        }
                    } else {

                        i = 0

                        break
                    }
                }
                let container = creep.pos.findClosestByRange(containerTarget)

                if (container != null && container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(container)
                    }
                } else if (containerTarget[0] != null && i < containerTarget.length) {

                    if (creep.withdraw(containerTarget[i], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(containerTarget[i])
                    }
                } else {

                    var droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                    });

                    if (droppedResources) {

                        creep.say("💡")

                        if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(droppedResources, { reusePath: 50 })

                        }
                    } else {

                        let tombstones = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                            filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.25
                        })

                        if (tombstones) {

                            creep.say("⚰️")

                            if (creep.withdraw(tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(tombstones, { reusePath: 50 });

                            }
                        } else {

                            let ruins = creep.pos.findClosestByRange(FIND_RUINS, {
                                filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.25
                            })

                            if (ruins) {

                                creep.say("🏗️")

                                if (creep.withdraw(ruins, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(ruins, { reusePath: 50 });

                                }
                            } else {

                                if (creep.room.storage) {

                                    if (creep.pos.inRangeTo(creep.room.storage, 2)) {

                                        creep.say("W, S")
                                    } else {

                                        creep.say("W, S")

                                        creep.moveTo(storage, { reusePath: 50 })
                                    }
                                } else {

                                    creep.say("W, No S")
                                }
                            }
                        }
                    }
                }
            }
        } else if (Game.getObjectById(creep.room.memory.controllerContainer)) {

            if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

            if (creep.memory.isFull == true && creep.carry.energy == 0) {

                creep.memory.isFull = false;

            } else if (creep.memory.isFull == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.isFull = true;

            }
            if (creep.memory.isFull == true) {

                var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

                if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1500) {

                    creep.say("cC1")

                    if (creep.transfer(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(controllerContainer, { reusePath: 50 });

                    }
                } else {

                    creep.say("D")
                }
            } else {

                creep.say("F2")

                var sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
                var sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

                creep.say("SC")

                let containerTarget = [sourceContainer1, sourceContainer2]

                //console.log(containerTarget)

                for (var i = 0; i < containerTarget.length; i++) {

                    let container = containerTarget[i]
                    if (container != null) {
                        if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                            break
                        }
                    } else {

                        i = 0

                        break
                    }
                }
                let container = creep.pos.findClosestByRange(containerTarget)

                if (container != null && container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(container)
                    }
                } else if (containerTarget[0] != null && i < containerTarget.length) {

                    if (creep.withdraw(containerTarget[i], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(containerTarget[i])
                    }
                } else {

                    var droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                    });

                    if (droppedResources) {

                        creep.say("💡")

                        if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(droppedResources, { reusePath: 50 })

                        }
                    } else {

                        let tombstones = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                            filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.25
                        })

                        if (tombstones) {

                            creep.say("⚰️")

                            if (creep.withdraw(tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(tombstones, { reusePath: 50 });

                            }
                        } else {

                            let ruins = creep.pos.findClosestByRange(FIND_RUINS, {
                                filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.25
                            })

                            if (ruins) {

                                creep.say("🏗️")

                                if (creep.withdraw(ruins, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(ruins, { reusePath: 50 });

                                }
                            } else {

                                creep.say("W")
                            }
                        }
                    }
                }
            }
        } else {

            roleBaseHauler.run(creep)
        }
    }
};