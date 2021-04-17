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

            if (creep.memory.fullEnergy == true && creep.carry.energy == 0) {

                creep.memory.fullEnergy = false;

            } else if (creep.memory.fullEnergy == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.fullEnergy = true;

            }
            if (creep.memory.fullEnergy == true) {

                let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
                });

                let myCreeps = creep.room.find(FIND_MY_CREEPS)

                if (lowTower && myCreeps.length > 2) {

                    creep.say("LT")

                    if (creep.transfer(lowTower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(lowTower, { reusePath: 50 });
                    }
                } else {

                    let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                            s.energy < s.energyCapacity
                    })

                    if (structure) {

                        creep.say("➡️")

                        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(structure, { reusePath: 50 });
                        }
                    } else {

                        var storage = creep.room.storage

                        if (storage && storage.store[RESOURCE_ENERGY] <= 250000) {

                            creep.say("S")

                            if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(storage, { reusePath: 50 });

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
            } else {

                var sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)
                var sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)

                let links = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_LINK
                })

                if (sourceLink1 && sourceLink1.store[RESOURCE_ENERGY] >= 750 && links.length < 4) {

                    creep.say("Link")

                    if (creep.withdraw(sourceLink1, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(sourceLink1, { reusePath: 50 });

                    }
                } else if (sourceLink2 && sourceLink2.store[RESOURCE_ENERGY] >= 750 && links.length < 4) {

                    creep.say("Link")

                    if (creep.withdraw(sourceLink2, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(sourceLink2, { reusePath: 50 });

                    }
                } else {

                    let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_TOWER && s.energy < 500)
                    });

                    let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                            s.energy < s.energyCapacity
                    });

                    var storage = creep.room.storage

                    let terminal = creep.room.terminal

                    if (structure || lowTower) {
                        if (storage) {

                            creep.say("Storage")

                            if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(storage, { reusePath: 50 });

                            }
                        } else if (terminal) {

                            creep.say("Terminal")

                            if (creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(terminal, { reusePath: 50 });

                            }
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
                                filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.5
                            })

                            if (tombstones) {

                                creep.say("⚰️")

                                if (creep.withdraw(tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(tombstones, { reusePath: 50 });

                                }
                            } else {

                                let ruins = creep.pos.findClosestByRange(FIND_RUINS, {
                                    filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.5
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
            }
        } else {

            if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

            if (creep.memory.fullEnergy == true && creep.carry.energy == 0) {

                creep.memory.fullEnergy = false;

            } else if (creep.memory.fullEnergy == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.fullEnergy = true;

            }
            if (creep.memory.fullEnergy == true) {

                let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
                });

                let myCreeps = creep.room.find(FIND_MY_CREEPS)

                if (lowTower && myCreeps.length > 2) {

                    creep.say("LT")

                    if (creep.transfer(lowTower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(lowTower, { reusePath: 50 });
                    }
                } else {

                    let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_EXTENSION) &&
                            s.energy < s.energyCapacity
                    })

                    if (structure) {

                        creep.say("➡️")

                        if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(structure, { reusePath: 50 });
                        }
                    } else {

                        let tower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_TOWER && s.energy < 710
                        })

                        if (tower && myCreeps.length > 2) {

                            creep.say("➡️")

                            if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(tower, { reusePath: 50 })

                            }
                        } else {

                            var storage = creep.room.storage

                            if (storage && storage.store[RESOURCE_ENERGY] <= 5000 && creep.room.energyAvailable != creep.room.energyCapacityAvailable) {

                                creep.say("S")

                                if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(storage, { reusePath: 50 })

                                }
                            } else {

                                var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

                                let links = creep.room.find(FIND_MY_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_LINK
                                })

                                let containers = creep.room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_CONTAINER
                                })

                                if (containers.length >= 3 && links.length < 3 && controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 100) {

                                    creep.say("cC1")

                                    if (creep.transfer(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                        creep.moveTo(controllerContainer, { reusePath: 50 });

                                    }
                                } else {

                                    var storage = creep.room.storage

                                    if (storage && storage.store[RESOURCE_ENERGY] <= 250000) {

                                        creep.say("S")

                                        if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                            creep.moveTo(storage, { reusePath: 50 });

                                        }
                                    } else {

                                        if (containers.length >= 3 && links.length < 3 && controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1500) {

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

                                                let source = creep.pos.findClosestByRange(FIND_SOURCES)

                                                if (source) {

                                                    if (creep.pos.inRangeTo(source, 2)) {

                                                        creep.say("D, So")
                                                    } else {

                                                        creep.say("D, So")

                                                        creep.moveTo(storage, { reusePath: 50 })
                                                    }
                                                } else {

                                                    creep.say("D, No So")
                                                }
                                            }
                                        }
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

                    let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_TOWER && s.energy < 500)
                    });

                    let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                            s.energy < s.energyCapacity
                    });

                    var storage = creep.room.storage

                    let terminal = creep.room.terminal

                    if (storage && storage.store.getUsedCapacity([RESOURCE_ENERGY]) >= creep.store.getCapacity()) {

                        creep.say("Storage")

                        if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(storage, { reusePath: 50 });

                        }
                    } else if (terminal && terminal.store.getUsedCapacity([RESOURCE_ENERGY]) >= creep.store.getCapacity()) {

                        creep.say("Terminal")

                        if (creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(terminal, { reusePath: 50 });

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
                                filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.5
                            })

                            if (tombstones) {

                                creep.say("⚰️")

                                if (creep.withdraw(tombstones, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                    creep.moveTo(tombstones, { reusePath: 50 });

                                }
                            } else {

                                let ruins = creep.pos.findClosestByRange(FIND_RUINS, {
                                    filter: s => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.5
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
            }
        }
    }
};