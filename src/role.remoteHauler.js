module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom

        if (creep.memory.fullEnergy == true && creep.carry.energy == 0) {

            creep.memory.fullEnergy = false;

        } else if (creep.memory.fullEnergy == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.fullEnergy = true;

        }
        if (creep.memory.fullEnergy == false) {

            if (creep.room.name == remoteRoom) {

                var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER && s.energy >= creep.store.getCapacity()
                })

                creep.say("🛄")

                if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(container, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })
                            /*
                            const path = creep.room.findPath(creep.pos, container.pos, { maxOps: 200 })
                        
                            creep.moveByPath(path)
                        */
                    }
                } else {

                    var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                    })

                    creep.say("🛄")

                    if (container) {
                        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(container, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })
                                /*
                            const path = creep.room.findPath(creep.pos, container.pos, { maxOps: 200 })
                        
                            creep.moveByPath(path)
                        */
                        }
                    } else {

                        var droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                        })

                        creep.say("💡")

                        if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(droppedResources, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })
                                /*
                            const path = creep.room.findPath(creep.pos, container.pos, { maxOps: 200 })
                        
                            creep.moveByPath(path)
                        */
                        } else {

                            var source = creep.pos.findClosestByRange(FIND_SOURCES)

                            creep.say("🔦");
                            if (!creep.pos.inRangeTo(source, 2)) {

                                creep.moveTo(source, { reusePath: 50 })

                            }
                        }
                    }
                }
            } else {

                creep.memory.target = remoteRoom;

                const route = Game.map.findRoute(creep.room, remoteRoom);

                if (route.length > 0) {

                    creep.say(remoteRoom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }
        } else {

            //console.log("Returning: " + creep.name)

            if (creep.room.name != creep.memory.roomFrom) {

                creep.say(creep.memory.target)

                creep.memory.target = creep.memory.roomFrom

                const route = Game.map.findRoute(creep.room, creep.memory.target);

                if (route.length > 0) {

                    creep.say(creep.memory.target)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            } else {

                var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 300000
                });

                if (storage) {

                    creep.say("RL S1");

                    if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(storage, { reusePath: 50 });
                    }
                } else {

                    var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

                    let links = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_LINK
                    })

                    let containers = creep.room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    })

                    if (containers.length >= 3 && links.length < 3 && controllerContainer && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                        creep.say("cC1")

                        if (creep.transfer(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(controllerContainer, { reusePath: 50 });

                        }
                    } else {

                        var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 500000
                        });

                        var terminal = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] <= 150000
                        });

                        if (storage) {

                            creep.say("RL S2");

                            if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(storage, { reusePath: 50 });
                            }
                        } else if (terminal) {

                            creep.say("RL T");

                            if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                                creep.moveTo(terminal, { reusePath: 50 });
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

                                let spawns = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                                creep.say("S")

                                if (!creep.pos.isNearTo(spawns)) {

                                    creep.moveTo(spawns, { reusePath: 50 })

                                }
                            }
                        }
                    }
                }
            }
        }
    }
};