module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        if (creep.room.name == remoteRoom) {

            const controller = creep.room.get("controller")

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

                        creep.signWithMessage()
                    }
                } else {

                    creep.travel({
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

            creep.travel({
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

        creep.avoidEnemys()
    }
}