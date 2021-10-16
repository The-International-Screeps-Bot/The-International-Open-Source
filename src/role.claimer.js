module.exports = {
    run: function(creep) {

        const newCommune = Memory.global.newCommune

        if (!newCommune) return

        if (creep.room.name == newCommune) {

            const controller = creep.room.get("controller")

            if (controller) {

                if (creep.pos.getRangeTo(controller) <= 1) {

                    if (controller.reservation && controller.reservation.username != me) {

                        creep.say("A")

                        creep.attackController(controller)
                    }

                    creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")

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

            creep.avoidEnemys()

        } else {

            creep.say("NC " + newCommune)

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, newCommune), range: 1 },
                plainCost: 1,
                swampCost: 1,
                defaultCostMatrix: false,
                avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                flee: false,
                cacheAmount: 10,
            })
        }
    }
};