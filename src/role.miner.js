module.exports = {
    run: function(creep) {

        let mineral = creep.room.find(FIND_MINERALS)[0]

        let mineralContainer = Game.getObjectById(creep.room.memory.mineralContainer)

        creep.say("⛏️");

        if (mineralContainer != null && creep.pos.getRangeTo(mineralContainer) != 0) {

            let goal = _.map([mineralContainer], function(target) {
                return { pos: target.pos, range: 0 }
            })

            creep.intraRoomPathing(creep.pos, goal)

        } else {

            if (creep.harvest(mineral) == ERR_NOT_IN_RANGE) {

                let goal = _.map([mineral], function(target) {
                    return { pos: target.pos, range: 0 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }
        }

        creep.avoidHostiles()
    }
};