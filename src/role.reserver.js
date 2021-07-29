module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (creep.room.name == remoteRoom) {

            const controller = creep.room.controller

            if (controller) {

                if (creep.pos.getRangeTo(controller) <= 1) {

                    if (creep.reserveController(controller) == 0) {

                        creep.say("R")
                    }

                    if (controller.reservation.username != "MarvinTMB") {

                        creep.say("A")

                        creep.attackController(controller)
                    }

                    if (Game.time % 500 == 0) {

                        let signType = Math.floor(Math.random(7) * 10)

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
                } else {

                    let goal = _.map([controller], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)
                }
            }
        } else {

            let goal = _.map([new RoomPosition(25, 25, remoteRoom)], function(target) {
                return { pos: target, range: 24 }
            })

            creep.onlySafeRoomPathing(creep, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
        }

        creep.avoidHostiles()
    }
}