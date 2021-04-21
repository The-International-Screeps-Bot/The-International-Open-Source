module.exports = {
    run: function(creep) {
        
        //list of rooms with Game.map
        
        //determine rooms that are 10 or less away from home room (do so in module.constants)
        
        //scout find room that was checked longest ago
        
        //scout move to room
        
        //scout record information
        
        //scout record tick room was scouted
        
        //restart loop

        creep.memory.goal = creep.pos.findClosestByRange(FIND_MY_SPAWNS).id
            //creep.memory.goal = creep.room.controller.id
        creep.memory.origin = creep.pos

        let origin = creep.memory.origin

        let goal = _.map([Game.getObjectById(creep.memory.goal)], function(target) {
            return { pos: target.pos, range: 1 }
        })

        if (goal) {
            if (creep.pos.inRangeTo(goal, 1)) {

                creep.say("Success!")

                //creep.signController(creep.room.controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
            } else {

                creep.say("Hello world")

                let pathing = require("module.pathing")

                creep.pathing(origin, goal)
            }
        }
    }
};