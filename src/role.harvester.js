module.exports = {
    run: function(creep) {

        creep.say("🚬")

        const task = creep.memory.task
        if (!task) return

        // If creep can have move parts and isn't suicide

        if (creep.room.memory.stage >= 2 && creep.findParts("move") == 0) creep.suicide()

        // Harvest source depending on task

        if (task == "source1") {

            creep.say("S1")

            let source1 = creep.room.get("source1")

            let sourceLink1 = creep.room.get("sourceLink1")
            let sourceContainer1 = creep.room.get("sourceContainer1")

            if (sourceLink1 && creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.findParts("work") * 2) {

                creep.transfer(sourceLink1, RESOURCE_ENERGY)
            }

            if (sourceContainer1) {

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
                        cacheAmount: 20,
                    })
                }
            } else {

                if (creep.advancedHarvest(source1) == ERR_NOT_IN_RANGE) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: source1.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 20,
                    })
                }
            }
        } else if (task == "source2") {

            creep.say("S2")

            let source2 = creep.room.get("source2")

            let sourceLink2 = creep.room.get("sourceLink2")
            let sourceContainer2 = creep.room.get("sourceContainer2")

            if (sourceLink2 && creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.findParts("work") * 2) {

                creep.transfer(sourceLink2, RESOURCE_ENERGY)
            }

            if (sourceContainer2) {

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
                        cacheAmount: 20,
                    })
                }
            } else {

                if (creep.advancedHarvest(source2) == ERR_NOT_IN_RANGE) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: source2.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 20,
                    })
                }
            }
        }

        creep.avoidHostiles()
    }
}