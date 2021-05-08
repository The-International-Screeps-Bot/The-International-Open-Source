module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom

        if (remoteRoom == creep.room.name) {

            let controller = creep.room.controller

            if (controller) {

                creep.say("Reserving")

                if (!creep.pos.inRangeTo(controller, 1)) {

                    let origin = creep.pos

                    let goal = _.map([controller], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(origin, goal)
                }

                if (Game.time % 500 == 0) {

                    //output an integer from 1-6
                    let signType = Math.floor(Math.random(7) * 10)

                    //console.log(signType)

                    if (signType == 1) {

                        creep.signController(creep.room.controller, "The top 1% have more money than the poorest 4.5 billion")
                    } else if (signType == 2) {

                        creep.signController(creep.room.controller, "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour")
                    } else if (signType == 3) {

                        creep.signController(creep.room.controller, "We have democracy in our policial system, why do we not have it in our companies?")
                    } else if (signType == 4) {

                        creep.signController(creep.room.controller, "Workers of the world, unite!")
                    } else if (signType == 5) {

                        creep.signController(creep.room.controller, "Real democracy requires democracy in the workplace - Richard Wolff")
                    } else if (signType == 6) {

                        creep.signController(creep.room.controller, "Adults spend a combined 13 years of their life under a dictatorship: the workplace")
                    }
                }
                if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(controller)

                }
            } else {

                creep.say("No C")

                const direction = creep.pos.getDirectionTo(25, 25);
                creep.move(direction, { reusePath: 50 });

            }
        } else {

            creep.memory.goal = new RoomPosition(25, 25, remoteRoom)

            let origin = creep.pos

            let goal = _.map([creep.memory.goal], function(target) {
                return { pos: creep.memory.goal, range: 1 }
            })

            creep.roadPathing(origin, goal)
        }
    }
};