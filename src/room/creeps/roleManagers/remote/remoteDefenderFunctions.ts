import { allyList, remoteNeedsIndex } from 'international/constants'
import { findClosestObject, getRange, pack } from 'international/generalFunctions'
import { RemoteDefender } from 'room/creeps/creepClasses'

RemoteDefender.prototype.findRemote = function () {
     const creep = this

     // If the creep already has a remote, inform true

     if (creep.memory.remoteName) return true

     // Otherwise, get the creep's role

     const role = creep.memory.role as 'remoteDefender'

     // Get remotes by their efficacy

     const remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

     let roomMemory

     // Loop through each remote name

     for (const roomName of remoteNamesByEfficacy) {
          // Get the remote's memory using its name

          roomMemory = Memory.rooms[roomName]

          // If the needs of this remote are met, iterate

          if (roomMemory.needs[remoteNeedsIndex[role]] <= 0) continue

          // Otherwise assign the remote to the creep and inform true

          creep.memory.remoteName = roomName
          roomMemory.needs[remoteNeedsIndex[role]] -= creep.strength

          return true
     }

     // Inform false

     return false
}

RemoteDefender.prototype.advancedAttackEnemies = function () {
     const { room } = this

     const enemyAttackers = room.enemyAttackers.filter(function (creep) {
          return !creep.isOnExit()
     })

     // If there are none

     if (!enemyAttackers.length) {
          const enemyCreeps = room.enemyCreeps.filter(function (creep) {
               return !creep.isOnExit()
          })

          if (!enemyCreeps.length) {
               return this.aggressiveHeal()
          }

          // Heal nearby creeps

          if (this.passiveHeal()) return true

          this.say('EC')

          const enemyCreep = findClosestObject(this.pos, enemyCreeps)
          // Get the range between the creeps

          const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y)

          // If the range is more than 1

          if (range > 1) {
               this.rangedAttack(enemyCreep)

               // Have the create a moveRequest to the enemyAttacker and inform true

               this.createMoveRequest({
                    origin: this.pos,
                    goal: { pos: enemyCreep.pos, range: 1 },
               })

               return true
          }

          this.rangedMassAttack()
          this.moveRequest = pack(enemyCreep.pos)

          return true
     }

     // Otherwise, get the closest enemyAttacker

     const enemyAttacker = findClosestObject(this.pos, enemyAttackers)

     // Get the range between the creeps

     const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y)

     // If it's more than range 3

     if (range > 3) {
          // Heal nearby creeps

          this.passiveHeal()

          // Make a moveRequest to it and inform true

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: enemyAttacker.pos, range: 1 },
          })

          return true
     }

     this.say('AEA')

     // Otherwise, have the creep pre-heal itself

     this.heal(this)

     // If the range is 1, rangedMassAttack

     if (range === 1) {
          this.rangedMassAttack()
          this.moveRequest = pack(enemyAttacker.pos)
     }

     // Otherwise, rangedAttack the enemyAttacker
     else this.rangedAttack(enemyAttacker)

     // If the creep is out matched, try to always stay in range 3

     if (this.strength < enemyAttacker.strength) {
          if (range === 3) return true

          if (range >= 3) {
               this.createMoveRequest({
                    origin: this.pos,
                    goal: { pos: enemyAttacker.pos, range: 3 },
               })

               return true
          }

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: enemyAttacker.pos, range: 25 },
               flee: true,
          })

          return true
     }

     // If the creep has less heal power than the enemyAttacker's attack power

     if (this.strength < enemyAttacker.strength) {
          // If the range is less or equal to 2

          if (range <= 2) {
               // Have the creep flee and inform true

               this.createMoveRequest({
                    origin: this.pos,
                    goal: { pos: enemyAttacker.pos, range: 1 },
                    flee: true,
               })

               return true
          }
     }

     // If the range is more than 1

     if (range > 1) {
          // Have the create a moveRequest to the enemyAttacker and inform true

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: enemyAttacker.pos, range: 1 },
          })

          return true
     }

     // Otherwise inform true

     return true
}
