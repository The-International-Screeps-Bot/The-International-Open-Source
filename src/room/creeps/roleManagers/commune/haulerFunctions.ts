import { Console } from 'console'
import { RoomTask, RoomPullTask } from 'room/roomTasks'

import { Hauler } from '../../creepClasses'

Hauler.prototype.reserve = function () {
     const { room } = this

     let targets
     let target
     let amount

     if (this.needsResources()) {
          targets = room.MAWT.filter(target => {
               if (target instanceof Resource)
                    return target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2

               return target.store.energy >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2
          })
          this.say(targets.length.toString())
          if (targets.length) {
               target = this.pos.findClosestByRange(targets)

               if (target instanceof Resource)
                    amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.reserveAmount)
               else amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.store.energy)

               this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
          }
     } else {
          targets = room.MATT.filter(function (target) {
               return target.freeSpecificStore(RESOURCE_ENERGY) > 0
          })

          if (targets.length) {
               target = this.pos.findClosestByRange(targets)

               amount = Math.min(this.usedStore(), target.store.getFreeCapacity(RESOURCE_ENERGY))

               this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
          }
     }
}
