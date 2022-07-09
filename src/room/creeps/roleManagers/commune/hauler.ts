import { customLog } from 'international/generalFunctions'
import { Hauler } from '../../creepClasses'

export function haulerManager(room: Room, creepsOfRole: string[]) {
     // Loop through creep names of this role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: Hauler = Game.creeps[creepName]

          creep.advancedRenew()

          if (!creep.memory.reservations || !creep.memory.reservations.length) creep.reserve()

          if (!creep.fulfillReservation()) {

               creep.say(creep.message)
               continue
          }

          creep.reserve()

          if (!creep.fulfillReservation()) {

               creep.say(creep.message)
               continue
          }

          if (creep.message.length) creep.say(creep.message)
     }
}

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

     let transferTargets

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

          transferTargets = room.MATT.filter(function (target) {
               return target.freeSpecificStore(RESOURCE_ENERGY) > 0
          })

          if (transferTargets.length) {
               withdrawTargets = room.OAWT.filter(target => {
                    if (target instanceof Resource)
                         return (
                              target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                              target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
                         )

                    return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
               })

               if (!withdrawTargets.length) return

               target = this.pos.findClosestByRange(withdrawTargets)

               if (target instanceof Resource)
                    amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.reserveAmount)
               else amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.store.energy)

               this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
               return
          }

          return
     }

     if (!transferTargets) transferTargets = room.MATT.filter(function (target) {
          return target.freeSpecificStore(RESOURCE_ENERGY) > 0
     })

     if (transferTargets.length) {

          target = this.pos.findClosestByRange(transferTargets)

          amount = Math.min(this.usedStore(), target.freeStore(RESOURCE_ENERGY))

          this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
          return
     }

     transferTargets = room.OATT.filter(target => {
          return target.freeStore(RESOURCE_ENERGY) >= this.usedStore()
     })

     if (!transferTargets.length) return

     target = this.pos.findClosestByRange(transferTargets)

     amount = this.usedStore()

     this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
     return
}
