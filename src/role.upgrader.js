module.exports = {
    run: function(creep) {
        
        if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

        var controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        if (controllerContainer || controllerLink) {

            creep.memory.upgrading = "constant"

        } else if (creep.memory.upgrading == true && creep.carry.energy == 0) {

            creep.memory.upgrading = false;

        } else if (creep.memory.upgrading == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.upgrading = true;

        }
        if (creep.memory.upgrading == true || creep.memory.upgrading == "constant") {

            creep.say("🔋")

            var controller = creep.room.controller
            /*
            if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {

                creep.moveTo(controller, { reusePath: 50 })

            }
            */
            
            creep.controllerUpgrade(controller)
            
            if (creep.store[RESOURCE_ENERGY] <= 10) {

                creep.say("W")

                if (controllerLink && creep.room.controller.level >= 7) {
                    if (controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.say("🔋 CL")

                        if (creep.withdraw(controllerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(controllerLink, { reusePath: 50 })

                        }
                    } else {

                        creep.moveTo(controllerLink)

                    }
                } else if (controllerContainer) {
                    if (controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.say("🔋 CL")

                        if (creep.withdraw(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(controllerContainer, { reusePath: 50 })

                        }
                    } else {

                        creep.moveTo(controllerContainer)

                    }
                }
            }
        } else {

            var containers = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_CONTAINER
            })

            var links = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_LINK
            })

            if (links.length >= 3 && controllerLink && controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                creep.say("CL")

                if (creep.withdraw(controllerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(controllerLink, { reusePath: 50 });
                }
            } else if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                creep.say("CC")

                if (creep.withdraw(controllerContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(controllerContainer, { reusePath: 50 });
                }
            } else if (containers.length >= 2) {

                creep.say("🛄" + containers.length)
                for (let container of containers) {
                    if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                            creep.moveTo(container, { reusePath: 50 });
                        }
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
                }
            }
        }
    }
};