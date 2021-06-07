module.exports = {
    // a function to run the logic for this role
    run: function(creep) {

        const target = creep.memory.target = Memory.global.newCommune

        if (creep.room.name == target) {

            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {

                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } }, { reusePath: 50 });

                creep.say("Claiming");
            }
            if (creep.signController(creep.room.controller, "A commune of The Internationale. Bourgeoisie not welcome here.") == ERR_NOT_IN_RANGE) {

                creep.moveTo(creep.room.controller)

            }
        } else {

            creep.say("NC " + target)

            let goal = _.map([new RoomPosition(25, 25, target)], function(pos) {
                return { pos: pos, range: 1 }
            })

            creep.onlySafeRoomPathing(creep.pos, goal)
        }
    }
};