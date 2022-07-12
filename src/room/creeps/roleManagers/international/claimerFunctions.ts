import { claimRequestNeedsIndex } from 'international/constants'
import { Claimer } from '../../creepClasses'

Claimer.prototype.claimRoom = function () {
     const creep = this
     const { room } = creep

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
               typeWeights: {
                    keeper: Infinity,
               },
          })

          return
     }

     // If the owner or reserver isn't me

     if (room.controller.owner || (room.controller.reservation && room.controller.reservation.username !== Memory.me)) {
          creep.attackController(room.controller)
          return
     }

     // Otherwise, claim the controller. If the successful, remove claimerNeed

     creep.claimController(room.controller)
}
