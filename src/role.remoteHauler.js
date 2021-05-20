module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom

        if (creep.memory.isFull == true && creep.carry.energy == 0) {

            creep.memory.isFull = false;

        } else if (creep.memory.isFull == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.isFull = true;

        }
        if (creep.memory.isFull == false) {

            if (creep.room.name == remoteRoom) {

                var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER && s.energy >= creep.store.getCapacity()
                })

                creep.say("🛄")

                if (container) {

                    creep.energyWithdraw(container)
                } else {

                    var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                    })

                    creep.say("🛄")

                    if (container) {

                        creep.energyWithdraw(container)
                    } else {

                        let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                        });

                        if (droppedResources) {

                            creep.say("💡")

                            target = droppedResources

                            creep.pickupDroppedEnergy(target)
                        } else {

                            var source = creep.pos.findClosestByRange(FIND_SOURCES)

                            creep.say("🔦");
                            if (!creep.pos.inRangeTo(source, 2)) {

                                let origin = creep.pos

                                let goal = _.map([source], function(target) {
                                    return { pos: target.pos, range: 1 }
                                })

                                creep.intraRoomPathing(origin, goal)
                            }
                        }
                    }
                }
            } else {

                creep.memory.target = remoteRoom;

                creep.memory.goal = new RoomPosition(25, 25, remoteRoom)

                let origin = creep.pos

                let goal = _.map([creep.memory.goal], function(target) {
                    return { pos: creep.memory.goal, range: 1 }
                })

                creep.roadPathing(origin, goal)

            }
        } else {

            //console.log("Returning: " + creep.name)

            if (creep.room.name != creep.memory.roomFrom) {

                creep.memory.goal = new RoomPosition(25, 25, creep.memory.roomFrom)

                let origin = creep.pos

                let goal = _.map([creep.memory.goal], function(target) {
                    return { pos: creep.memory.goal, range: 1 }
                })

                creep.roadPathing(origin, goal)
            } else {

                var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 300000
                });

                if (storage) {

                    creep.say("RL S1");

                    creep.energyTransfer(storage)
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

                        creep.energyTransfer(controllerContainer)
                    } else {

                        var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 500000
                        });

                        var terminal = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] <= 150000
                        });

                        if (storage) {

                            creep.say("RL S2");

                            creep.energyTransfer(storage)
                        } else if (terminal) {

                            creep.say("RL T");

                            creep.energyTransfer(terminal)
                        } else {

                            let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                                filter: (s) => (s.structureType == STRUCTURE_SPAWN ||
                                        s.structureType == STRUCTURE_EXTENSION) &&
                                    s.energy < s.energyCapacity
                            })

                            if (structure) {

                                creep.say("➡️")

                                creep.energyTransfer(structure)
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