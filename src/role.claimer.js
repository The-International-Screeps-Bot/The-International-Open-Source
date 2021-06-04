module.exports = {
    // a function to run the logic for this role
    run: function(creep) {

        creep.memory.target = Memory.global.claimerTarget

        if (creep.room.name == creep.memory.target) {

            if (creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {

                creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } }, { reusePath: 50 });
                creep.say("Claiming!");

            }
            if (creep.signController(creep.room.controller, "A commune of The Internationale. Bourgeoisie not welcome here.") == ERR_NOT_IN_RANGE) {

                creep.moveTo(creep.room.controller)

            }
        } else {

            creep.say("Hello world")

            let goal = _.map([new RoomPosition(25, 25, creep.memory.target)], function(pos) {
                return { pos: pos, range: 1 }
            })

            creep.offRoadPathing(creep.pos, goal)
        }
    }
};