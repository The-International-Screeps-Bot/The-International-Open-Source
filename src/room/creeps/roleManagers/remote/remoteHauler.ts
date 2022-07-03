import { remoteNeedsIndex } from 'international/constants'
import { RoomTask } from 'room/roomTasks'
import { RemoteHauler } from '../../creepClasses'

export function remoteHaulerManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: RemoteHauler = Game.creeps[creepName]

          // If the creep needs resources

          if (creep.needsResources()) {
               if (!creep.findRemote()) continue

               // If the creep is in the remote

               if (room.name === creep.memory.remoteName) {
                    if (!creep.memory.reservations || !creep.memory.reservations.length) creep.reserveWithdraw()

                    if (!creep.fulfillReservation()) {
                         creep.say(creep.message)
                         continue
                    }

                    creep.reserveWithdraw()

                    if (!creep.fulfillReservation()) {
                         creep.say(creep.message)
                         continue
                    }

                    if (creep.needsResources()) continue

                    creep.message += creep.memory.communeName
                    creep.say(creep.message)

                    creep.createMoveRequest({
                         origin: creep.pos,
                         goal: {
                              pos: new RoomPosition(25, 25, creep.memory.communeName),
                              range: 20,
                         },
                         avoidEnemyRanges: true,
                         weightGamebjects: {
                              1: room.get('road'),
                         },
                    })

                    continue
               }

               creep.message += creep.memory.remoteName
               creep.say(creep.message)

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                         pos: new RoomPosition(25, 25, creep.memory.remoteName),
                         range: 20,
                    },
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               continue
          }

          // Otherwise if creep doesn't need resources

          if (room.name === creep.memory.communeName) {
               // Try to renew the creep

               creep.advancedRenew()

               // If the creep has a remoteName, delete it

               if (creep.memory.remoteName) delete creep.memory.remoteName

               if (!creep.memory.reservations || !creep.memory.reservations.length) creep.reserveTransfer()

               if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
               }

               creep.reserveTransfer()

               if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
               }

               if (!creep.needsResources()) continue

               if (!creep.findRemote()) continue

               creep.message += creep.memory.remoteName
               creep.say(creep.message)

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                         pos: new RoomPosition(25, 25, creep.memory.remoteName),
                         range: 20,
                    },
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               continue
          }

          creep.message += creep.memory.communeName
          creep.say(creep.message)

          creep.createMoveRequest({
               origin: creep.pos,
               goal: {
                    pos: new RoomPosition(25, 25, creep.memory.communeName),
                    range: 20,
               },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })
     }
}

RemoteHauler.prototype.findRemote = function () {
     if (this.memory.remoteName) return true

     const remoteNamesByEfficacy: string[] = Game.rooms[this.memory.communeName]?.get('remoteNamesByEfficacy')

     let roomMemory

     for (const roomName of remoteNamesByEfficacy) {
          roomMemory = Memory.rooms[roomName]

          if (roomMemory.needs[remoteNeedsIndex.remoteHauler] <= 0) continue

          this.memory.remoteName = roomName
          roomMemory.needs[remoteNeedsIndex.remoteHauler] -= this.parts.work

          return true
     }

     return false
}

RemoteHauler.prototype.reserveWithdraw = function () {
     const { room } = this

     if (!this.needsResources()) return

     const withdrawTargets = room.MAWT.filter(target => {
          if (target instanceof Resource)
               return (
                    target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                    target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
               )

          return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
     })

     if (!withdrawTargets.length) return

     let target
     let amount

     target = this.pos.findClosestByRange(withdrawTargets)

     if (target instanceof Resource)
          amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.reserveAmount)
     else amount = Math.min(this.store.getCapacity(RESOURCE_ENERGY) - this.usedStore(), target.store.energy)

     this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
}

RemoteHauler.prototype.reserveTransfer = function () {
     const { room } = this

     if (this.usedStore() === 0) return

     let transferTargets = room.MATT.filter(function (target) {
          return target.freeSpecificStore(RESOURCE_ENERGY) > 0
     })

     let target
     let amount

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
}
