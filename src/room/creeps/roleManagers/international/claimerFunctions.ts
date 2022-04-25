import { claimRequestNeedsIndex } from "international/constants"
import { Claimer } from "../../creepClasses"

Claimer.prototype.claimRoom = function() {

    const creep = this,
    room = creep.room

    if (room.controller.my) return

    // If the creep is not in range to claim the controller

    if (creep.pos.getRangeTo(room.controller) > 1) {

        // Move to the controller and stop

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: room.controller.pos, range: 1 },
            avoidEnemyRanges: true,
            plainCost: 1,
            swampCost: 1,
        })

        return
    }

    // Otherwise, claim the controller. If the successful, remove claimerNeed

    if (creep.claimController(room.controller) == OK) Memory.claimRequests[Memory.rooms[creep.memory.communeName].claimRequest].needs[claimRequestNeedsIndex.claimer] = 0
}
