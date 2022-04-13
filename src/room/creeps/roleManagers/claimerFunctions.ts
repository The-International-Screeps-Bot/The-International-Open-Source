import { Claimer } from "../creepClasses"

Claimer.prototype.claimRoom = function() {

    const creep = this,
    room = creep.room

    // If the creep has no claim target, stop

    if (!Memory.claimTarget) return

    // Otherwise

    if (room.name == Memory.claimTarget) {

        // If the creep is not in range to claim the controller

        if (creep.pos.getRangeTo(room.controller) > 1) {

            // Move to the controller and stop

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: room.controller.pos, range: 1 },
                avoidEnemyRanges: true,
                cacheAmount: 50,
            })

            return
        }

        // Otherwise, claim the controller. If the successful, remove the claimTarget

        if (creep.claimController(room.controller) == OK) delete Memory.claimTarget

        // And stop

        return
    }

    // Otherwise if the creep is not in the claimTarget

    // Move to it

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: new RoomPosition(25, 25, Memory.claimTarget), range: 25 },
        avoidEnemyRanges: true,
        plainCost: 0,
        swampCost: 0,
        cacheAmount: 50,
    })
}
