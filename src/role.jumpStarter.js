let roleBuilder = require("role.builder")

module.exports = {
    run: function(creep) {

        creep.isFull()

        if (!creep.memory.isFull) {

            let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity()
            })

            if (droppedEnergy && creep.pos.getRangeTo(droppedEnergy) <= 2) {

                creep.pickupDroppedEnergy(droppedEnergy)

            } else {

                let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                if (closestSource) {

                    creep.say("⛏️")

                    if (creep.pos.getRangeTo(closestSource) <= 1) {

                        if (creep.harvest(closestSource) == 0) {

                            creep.findEnergyHarvested(closestSource)
                        }
                    } else {

                        creep.advancedPathing({
                            origin: creep.pos,
                            goal: { pos: closestSource.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                }
            }
        } else {

            let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
            })

            if (lowTower) {

                creep.advancedTransfer(lowTower)

            } else {

                let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                            s.structureType == STRUCTURE_SPAWN ||
                            s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                        s.energy < s.energyCapacity
                })

                if (essentialStructure) {

                    creep.advancedTransfer(essentialStructure)

                } else if (creep.room.storage) {

                    creep.advancedTransfer(creep.room.storage)

                } else {

                    roleBuilder.run(creep)
                }
            }
        }

        creep.avoidHostiles()
    }
}