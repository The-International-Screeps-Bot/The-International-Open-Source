module.exports = {
    run: function(creep) {
        if (creep.memory.working == true && creep.carry.energy == 0) {

            creep.memory.working = false;

        } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.working = true;

        }

        if (creep.memory.working == true) {

            if (creep.memory.quota) {

                creep.say(creep.memory.quota.toFixed(0) / 1000 + "k")
            }

            var barricades = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
            })

            let target = creep.memory.target
            target = undefined

            if (creep.memory.target) {

                target = Game.getObjectById(creep.memory.target)

                if (creep.repair(target) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(target, { reusePath: 50 })
                }
            } else {

                creep.say("Broken")
            }

            for (let quota = 10000; quota < 3000000; quota += 50000) {

                creep.memory.quota = quota

                for (let barricade of barricades) {

                    if (barricade.hits < quota) {

                        target = barricade.id
                        creep.memory.target = target

                        return;
                    }
                }
            }
        } else {

            var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)
            var controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

            if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] >= 500) {

                wallRepairerGetEnergy()

            } else if (controllerLink && controllerLink.store[RESOURCE_ENERGY] >= 100) {

                wallRepairerGetEnergy()

            } else if (creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] >= 275000) {

                wallRepairerGetEnergy()
            } else {

                creep.say("W")

                if (creep.room.storage) {

                    creep.moveTo(creep.room.storage, { reusePath: 50 })
                }
            }

            function wallRepairerGetEnergy() {

                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER
                })

                var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                })

                var storage = creep.room.storage

                creep.say("S")

                if (storage && storage.store[RESOURCE_ENERGY] >= 5000) {
                    if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.say("S")
                        creep.moveTo(storage, { reusePath: 50 })

                    }
                } else if (containers.length >= 2 && container && creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.say("🛄" + containers.length)
                    creep.moveTo(container, { reusePath: 50 });

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

                        let source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                        creep.say("Source")

                        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(source, { reusePath: 50 })
                        }
                    }
                }
            }
        }
    }
};