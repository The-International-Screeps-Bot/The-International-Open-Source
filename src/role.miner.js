module.exports = {
    run: function(creep) {

        let mineral = creep.room.find(FIND_MINERALS)[0]

        let mineralContainer = Game.getObjectById(creep.room.memory.mineralContainer)

        creep.say("⛏️");

        if (mineralContainer && mineral) {
            if (creep.pos.getRangeTo(mineralContainer) != 0) {

                let goal = _.map([mineralContainer], function(target) {
                    return { pos: target.pos, range: 0 }
                })

                creep.intraRoomPathing(creep.pos, goal)

            } else {

                if (creep.harvest(mineral) == 0) {

                    creep.findMineralsHarvested(mineral)
                }
            }
        }

        creep.avoidHostiles()
    }
};