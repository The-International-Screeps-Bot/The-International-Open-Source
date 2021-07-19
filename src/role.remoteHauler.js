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

                    creep.advancedWithdraw(container)
                } else {

                    var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                    })

                    creep.say("🛄")

                    if (container) {

                        creep.advancedWithdraw(container)
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

                let goal = _.map([new RoomPosition(25, 25, remoteRoom)], function(target) {
                    return { pos: target, range: 1 }
                })

                creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
            }
        } else {

            if (creep.room.name != creep.memory.roomFrom) {

                let goal = _.map([new RoomPosition(25, 25, creep.memory.roomFrom)], function(target) {
                    return { pos: target, range: 1 }
                })

                creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])

            } else {

                var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 300000
                });

                if (storage) {

                    creep.say("RL S1");

                    creep.advancedTransfer(storage)
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

                        creep.advancedTransfer(controllerContainer)
                    } else {

                        var storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 500000
                        });

                        var terminal = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] <= 150000
                        });

                        if (storage) {

                            creep.say("RL S2");

                            creep.advancedTransfer(storage)

                        } else if (terminal) {

                            creep.say("RL T");

                            creep.advancedTransfer(terminal)

                        } else {

                            let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                                filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                                        s.structureType == STRUCTURE_SPAWN ||
                                        s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                                    s.energy < s.energyCapacity
                            })

                            if (essentialStructure) {

                                creep.room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                                if (creep.advancedTransfer(essentialStructure) == 0) {

                                    let structureToMoveTo = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                                        filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                                                s.structureType == STRUCTURE_SPAWN ||
                                                s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                                            s.energy < s.energyCapacity && s.id != essentialStructure.id
                                    })

                                    if (structureToMoveTo) {

                                        if (structureToMoveTo.pos.getRangeTo(creep) > 1) {

                                            let goal = _.map([structureToMoveTo], function(target) {
                                                return { pos: target.pos, range: 1 }
                                            })

                                            creep.intraRoomPathing(creep.pos, goal)
                                        }
                                    } else {

                                        if (storage) {

                                            let goal = _.map([storage], function(target) {
                                                return { pos: target.pos, range: 1 }
                                            })

                                            creep.intraRoomPathing(creep.pos, goal)
                                        }
                                    }
                                }
                            } else {

                                let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                                creep.say("S")

                                if (spawn && creep.pos.getRangeTo(spawn) > 5) {

                                    let goal = _.map([spawn], function(target) {
                                        return { pos: target.pos, range: 5 }
                                    })

                                    creep.intraRoomPathing(creep.pos, goal)
                                }
                            }
                        }
                    }
                }
            }
        }

        creep.avoidHostiles()
    }
};