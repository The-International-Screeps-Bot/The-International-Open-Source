module.exports = {
    run: function(creep) {

        const newCommune = Memory.global.newCommune

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
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
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
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom"],
                flee: false,
                cacheAmount: 10,
            })
        }
    }
};