var roleUpgrader = require('role.upgrader');

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

        var constructionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

        if (constructionSite == undefined) {

            roleUpgrader.run(creep);

        } else if (creep.memory.building == true && creep.carry.energy == 0) {

            creep.memory.building = false;

        } else if (creep.memory.building == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.building = true;

        }
        if (creep.memory.building == true && constructionSite) {

            creep.say("🚧")

            if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {

                creep.moveTo(constructionSite, { reusePath: 50 });

            }
        } else if (constructionSite) {

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
                }
            }
        }
    }
};