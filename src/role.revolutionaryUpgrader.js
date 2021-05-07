module.exports = {
    run: function(creep) {

        var target = creep.memory.target

        let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

        if (creepIsEdge) {

            const direction = creep.pos.getDirectionTo(25, 25)
            creep.move(direction);

        } else if (creep.room.name != target) {

            creep.say("BS")

            const route = Game.map.findRoute(creep.room.name, target);

            if (route.length > 0) {

                creep.say(target)

                const exit = creep.pos.findClosestByRange(route[0].exit)
                creep.moveTo(exit);
            }
        } else {


        }
    }
};