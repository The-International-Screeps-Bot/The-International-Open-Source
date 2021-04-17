module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom

        if (remoteRoom == creep.room.name) {

            let controller = creep.room.controller

            if (controller) {
                creep.say("Reserving")
                if (Game.time % 500 == 0) {

                    //output an integer from 1-4
                    let signType = Math.floor(Math.random(7) * 10)

                    //console.log(signType)

                    if (signType == 1) {

                        if (creep.signController(creep.room.controller, "The top 1% have more money than the poorest 4.5 billion") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
                    } else if (signType == 2) {

                        if (creep.signController(creep.room.controller, "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
                    } else if (signType == 3) {

                        if (creep.signController(creep.room.controller, "We have democracy in our policial system, why do we not have it in our companies?") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
                    } else if (signType == 4) {

                        if (creep.signController(creep.room.controller, "Workers of the world, unite!") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
                    } else if (signType == 5) {

                        if (creep.signController(creep.room.controller, "Real democracy requires democracy in the workplace - Richard Wolff") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
                    } else if (signType == 6) {

                        if (creep.signController(creep.room.controller, "Adults spend a combined 13 years of their life under a dictatorship: the workplace") == ERR_NOT_IN_RANGE) {

                            creep.moveTo(creep.room.controller)

                        }
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

            creep.memory.target = remoteRoom
            const route = Game.map.findRoute(creep.room, remoteRoom);

            if (route.length > 0) {

                creep.say(creep.memory.target)

                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        }
    }
};