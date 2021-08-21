let roleBuilder = require("role.builder")

module.exports = {
    run: function(creep) {

        let immovableHarvesters = creep.room.find(FIND_MY_CREEPS, {
            filter: creep => creep.memory.role == "harvester" && creep.findParts("move") == 0 && creep.memory.task && creep.pos.getRangeTo(creep.room.get(creep.memory.task)) > 1
        })

        if (immovableHarvesters.length > 0) {

            creep.say("P")

            let harvester = creep.pos.findClosestByRange(immovableHarvesters)
            let source = creep.room.get(harvester.memory.task)

            if (creep.pos.getRangeTo(source) == 1) {

                creep.move(creep.pos.getDirectionTo(harvester))

                creep.pull(harvester)

                harvester.move(creep)

            } else {

                if (creep.pull(harvester) == ERR_NOT_IN_RANGE) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: harvester.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                } else {

                    harvester.move(creep)

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: source.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                }
            }
        } else {

            creep.isFull()

            if (creep.memory.isFull) {

                creep.say("🚬")

                let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
                })

                if (lowTower) {

                    creep.say("LT")

                    creep.advancedTransfer(lowTower)

                } else {

                    let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                                s.structureType == STRUCTURE_SPAWN ||
                                s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                            s.energy < s.energyCapacity
                    })

                    if (essentialStructure) {

                        creep.say("ES")

                        creep.advancedTransfer(essentialStructure)

                    } else if (creep.room.storage) {

                        creep.say("S")

                        creep.advancedTransfer(creep.room.storage)

                    } else {

                        roleBuilder.run(creep)
                    }
                }

            } else {

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
            }
        }

        creep.avoidHostiles()
    }
}