module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        if (creep.room.name == remoteRoom) {

            const controller = creep.room.controller

            if (controller) {

                if (creep.pos.getRangeTo(controller) <= 1) {

                    if (creep.reserveController(controller) == 0) {

                        creep.say("R")
                    }

                    if (controller.reservation && controller.reservation.username != me) {

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

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: controller.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }
            }
        } else {

            creep.say(remoteRoom)

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                flee: false,
                cacheAmount: 10,
            })
        }

        creep.avoidHostiles()
    }
}