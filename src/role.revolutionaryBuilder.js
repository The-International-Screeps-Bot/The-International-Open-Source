var roleBuilder = require('role.builder');

module.exports = {
    run: function(creep) {

        creep.memory.target = Memory.global.builderTarget
        var target = creep.memory.target

        let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

        if (creepIsEdge) {

            const direction = creep.pos.getDirectionTo(25, 25)
            creep.move(direction);

        } else if (creep.room.name != target) {

            let goal = _.map([new RoomPosition(25, 25, creep.memory.target)], function(pos) {
                return { pos: pos, range: 1 }
            })

            creep.say("BC " + creep.memory.target)

            creep.offRoadPathing(creep.pos, goal)
        } else {

            roleBuilder.run(creep)
        }
    }
};