var roleBuilder = require('role.builder');

var roleUpgrader = require('role.upgrader');

module.exports = {
    run: function(creep) {

        var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax
        })

        if (structure == undefined) {

            roleBuilder.run(creep)

        } else if (creep.memory.repairing == true && creep.carry.energy == 0) {

            creep.memory.repairing = false;

        } else if (creep.memory.repairing == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.repairing = true;

        }
        if (creep.memory.repairing == true && structure) {

            creep.say("🔧")

            if (creep.repair(structure) == ERR_NOT_IN_RANGE) {

                creep.moveTo(structure, { reusePath: 50 })

            }
        } else if (structure) {

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