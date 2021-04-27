module.exports = {
    // a function to run the logic for this role
    run: function(creep) {

        creep.memory.origin = creep.pos
        creep.memory.goal = new RoomPosition(25, 25, creep.memory.target)

        var origin = creep.memory.origin
        var goal = _.map([creep.memory.goal], function(pos) {
            return { pos: pos, range: 1 }
        })

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

            creep.offRoadPathing(origin, goal)
        }
    }
};