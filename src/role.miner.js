module.exports = {
    run: function(creep) {

        let mineral = creep.room.find(FIND_MINERALS)[0]

        let mineralContainer = Game.getObjectById(creep.room.memory.mineralContainer)

        creep.say("⛏️");

        if (mineralContainer && mineral) {
            if (creep.pos.getRangeTo(mineralContainer) != 0) {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: mineralContainer.pos, range: 0 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })

            } else {

                if (creep.harvest(mineral) == 0) {

                    creep.findMineralsHarvested(mineral)
                }
            }
        }

        creep.avoidHostiles()
    }
};