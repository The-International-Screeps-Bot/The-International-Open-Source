module.exports = {
    run: function(creep) {

        const target = creep.memory.target = Memory.global.newCommune

        if (creep.room.name == target) {

            creep.say("C")

            let controller = creep.room.controller

            if (creep.pos.getRangeTo(controller) == 1) {

                creep.claimController(controller)

                creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")

            } else {

                let goal = _.map([controller], function(target) {
                    return { pos: target.pos, range: 1 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }

            creep.avoidHostiles()

        } else {

            creep.say("NC " + target)

            let goal = _.map([new RoomPosition(25, 25, target)], function(pos) {
                return { pos: pos, range: 24 }
            })

            creep.onlySafeRoomPathing(creep, goal, ["enemyRoom", "keeperRoom"])
        }
    }
};