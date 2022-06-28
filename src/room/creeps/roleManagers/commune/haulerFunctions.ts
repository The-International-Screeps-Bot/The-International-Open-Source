import { Console } from 'console'
import { RoomTask, RoomPullTask } from 'room/roomTasks'

import { Hauler } from '../../creepClasses'

Hauler.prototype.reserve = function () {
     const { room } = this

     let withdrawTargets = room.MAWT.filter(target => {
          if (target instanceof Resource)
               return (
                    target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                    target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
               )

          return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
     })

     let transferTargets = room.MATT.filter(function (target) {
          return target.freeSpecificStore(RESOURCE_ENERGY) > 0
     })

     let target
     let amount

     if (this.needsResources()) {
          if (withdrawTargets.length) {
               target = this.pos.findClosestByRange(withdrawTargets)

               if (target instanceof Resource)
                    amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.reserveAmount)
               else amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.store.energy)

               this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
               return
          }

          if (transferTargets.length) {
               withdrawTargets = room.OAWT.filter(target => {
                    if (target instanceof Resource)
                         return (
                              target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                              target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
                         )

                    return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
               })

               target = this.pos.findClosestByRange(withdrawTargets)

               if (target instanceof Resource)
                    amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.reserveAmount)
               else amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.store.energy)

               this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
               return
          }
     }

     if (this.usedStore() === 0) return

     if (transferTargets.length) {
        target = this.pos.findClosestByRange(transferTargets)

        amount = Math.min(this.usedStore(), target.freeStore(RESOURCE_ENERGY))

        this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
        return
   }

     transferTargets = room.OATT.filter(target => {
          return target.freeStore(RESOURCE_ENERGY) >= this.usedStore()
     })

     if (transferTargets.length) {
          target = this.pos.findClosestByRange(transferTargets)

          amount = this.usedStore()

          this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
          return
     }
}
