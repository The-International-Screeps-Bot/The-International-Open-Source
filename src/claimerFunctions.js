Creep.prototype.advancedClaim = function() {

    let creep = this
    let room = creep.room

    const controller = room.get("controller")

    if (!controller) return

    if (creep.pos.getRangeTo(controller) <= 1) {

        if (controller.reservation && controller.reservation.username != me) {

            creep.say("A")

            creep.attackController(controller)
            return
        }

        creep.say("C")

        creep.claimController(controller)

        creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")

        return
    }

    creep.say("M")

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