module.exports = {
    run: function(creep) {

        if (creep.isEdge()) {

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