let roomVariables = require("roomVariables")

module.exports = {
    run: function(creep) {

        // Define variables for harvesters

        let source1 = creep.room.get("source1")
        let source2 = creep.room.get("source2")

        let sourceContainer1 = creep.room.get("sourceContainer1")
        let sourceContainer2 = creep.room.get("sourceContainer2")

        let sourceLink1 = creep.room.get("sourceLink1")
        let sourceLink2 = creep.room.get("sourceLink2")

        const task = creep.memory.task

        // Harvest source depending on task

        if (task == "source1" && source1) {

            creep.say("S1")

            if (sourceLink1 && sourceContainer1) {

                if (creep.pos.getRangeTo(sourceContainer1) == 0) {

                    creep.advancedHarvest(source1)

                    if (creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.findParts("work") * 2) {

                        creep.transfer(sourceLink1, RESOURCE_ENERGY)
                    }
                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: sourceContainer1.pos, range: 0 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            } else if (sourceContainer1) {

                if (creep.pos.getRangeTo(sourceContainer1) == 0) {

                    creep.advancedHarvest(source1)

                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: sourceContainer1.pos, range: 0 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            } else {

                if (creep.pos.getRangeTo(source1) == 1) {

                    creep.advancedHarvest(source1)

                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: source1.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            }
        } else if (task == "source2" && source2) {

            creep.say("S2")

            if (sourceLink2 && sourceContainer2) {

                if (creep.pos.getRangeTo(sourceContainer2) == 0) {

                    creep.advancedHarvest(source2)

                    if (creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.findParts("work") * 2) {

                        creep.transfer(sourceLink2, RESOURCE_ENERGY)
                    }
                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: sourceContainer2.pos, range: 0 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            } else if (sourceContainer2) {

                if (creep.pos.getRangeTo(sourceContainer2) == 0) {

                    creep.advancedHarvest(source2)

                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: sourceContainer2.pos, range: 0 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            } else {

                if (creep.pos.getRangeTo(source2) == 1) {

                    creep.advancedHarvest(source2)

                } else {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: source2.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            }
        } else {

            creep.say("🚬")
        }

        creep.avoidHostiles()
    }
}