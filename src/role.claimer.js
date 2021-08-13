module.exports = {
    run: function(creep) {

        const newCommune = Memory.global.newCommune

        if (!newCommune) return

        if (creep.room.name == newCommune) {

            creep.say("C")

            let controller = creep.room.controller

            if (creep.pos.getRangeTo(controller) == 1) {

                creep.claimController(controller)

                creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")

            } else {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: controller.pos, range: 1 },
                    plainCost: 1,
                    swampCost: 1,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })
            }

            creep.avoidHostiles()

        } else {

            creep.say("NC " + newCommune)

            creep.advancedPathing({
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