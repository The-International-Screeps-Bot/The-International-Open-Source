module.exports = {
    run: function(creep) {

        let baseLink = Game.getObjectById(creep.room.memory.baseLink)

        if (creep.memory.task == "source1") {

            if (baseLink != null && creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.myParts("work") * 2) {

                let sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)

                if (sourceLink1 != null && sourceLink1.store[RESOURCE_ENERGY] < 800) {
                    console.log(creep.transfer(sourceLink1, RESOURCE_ENERGY))

                    creep.transfer(sourceLink1, RESOURCE_ENERGY)
                }
            }

            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let source1 = Game.getObjectById(creep.room.memory.source1)

            if (sourceContainer1 != null && source1 != null) {

                creep.say("⛏️ 1")

                if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                    if (creep.harvest(source1) == 0) {

                        creep.findEnergyHarvested(source1)
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
            } else if (source1 != null) {

                creep.say("⛏️ 3")

                if (creep.pos.inRangeTo(source1, 1)) {


                    if (creep.harvest(source1) == 0) {

                        creep.findEnergyHarvested(source1)
                    }

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
        } else if (creep.memory.task == "source2") {

            if (baseLink != null && creep.store.getUsedCapacity() >= creep.store.getCapacity() - creep.myParts("work") * 2) {

                let sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)

                if (sourceLink2 != null && sourceLink2.store[RESOURCE_ENERGY] < 800) {

                    creep.transfer(sourceLink2, RESOURCE_ENERGY)
                }
            }

            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
            let source2 = Game.getObjectById(creep.room.memory.source2)

            if (sourceContainer2 != null && source2 != null) {

                creep.say("⛏️ 2")

                if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                    if (creep.harvest(source2) == 0) {

                        creep.findEnergyHarvested(source2)
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
            } else if (source2 != null) {

                creep.say("⛏️ 4")

                if (creep.pos.inRangeTo(source2, 1)) {

                    if (creep.harvest(source2) == 0) {

                        creep.findEnergyHarvested(source2)
                    }

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