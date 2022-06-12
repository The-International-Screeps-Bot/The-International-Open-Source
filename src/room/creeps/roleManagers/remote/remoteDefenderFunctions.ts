import { allyList, constants, remoteNeedsIndex } from 'international/constants'
import { getRange } from 'international/generalFunctions'
import { RemoteDefender } from 'room/creeps/creepClasses'

RemoteDefender.prototype.findRemote = function () {
     const creep = this

     // If the creep already has a remote, inform true

     if (creep.memory.remoteName) return true

     // Otherwise, get the creep's role

     const role = creep.memory.role as 'remoteDefender'

     // Get remotes by their efficacy

     const remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

     // Loop through each remote name

     for (const roomName of remoteNamesByEfficacy) {
          // Get the remote's memory using its name

          const roomMemory = Memory.rooms[roomName]

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
     const creep = this
     const { room } = creep

     // Get enemyAttackers in the room

     const enemyAttackers = room.enemyCreeps.filter(enemyCreep =>
          /* !enemyCreep.isOnExit() && */ enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK]),
     )

     // If there are none

     if (!enemyAttackers.length) {
          const { enemyCreeps } = room
          if (!enemyCreeps.length) {
               creep.aggressiveHeal()
               return true
          }

          // Heal nearby creeps

          if (creep.passiveHeal()) return true

          creep.say('EC')

          const enemyCreep = creep.pos.findClosestByRange(enemyCreeps)
          // Get the range between the creeps

          const range = getRange(creep.pos.x - enemyCreep.pos.x, creep.pos.y - enemyCreep.pos.y)

          // If the range is more than 1

          if (range > 1) {
               creep.rangedAttack(enemyCreep)

               // Have the create a moveRequest to the enemyAttacker and inform true

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: enemyCreep.pos, range: 1 },
               })

               return true
          }

          creep.rangedMassAttack()
          if (enemyCreep.owner.username !== 'Invader') creep.move(creep.pos.getDirectionTo(enemyCreep.pos))

          return true
     }

     // Otherwise, get the closest enemyAttacker

     const enemyAttacker = creep.pos.findClosestByRange(enemyAttackers)

     // Get the range between the creeps

     const range = getRange(creep.pos.x - enemyAttacker.pos.x, creep.pos.y - enemyAttacker.pos.y)

     // If it's more than range 3

     if (range > 3) {
          // Heal nearby creeps

          creep.passiveHeal()

          // Make a moveRequest to it and inform true

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: enemyAttacker.pos, range: 1 },
          })

          return true
     }

     creep.say('AEA')

     // Otherwise, have the creep pre-heal itself

     creep.heal(creep)

     // If the range is 1, rangedMassAttack

     if (range === 1) {
          creep.rangedMassAttack()
          creep.move(creep.pos.getDirectionTo(enemyAttacker.pos))
     }

     // Otherwise, rangedAttack the enemyAttacker
     else creep.rangedAttack(enemyAttacker)

     // If the creep is out matched, try to always stay in range 3

     if (creep.strength < enemyAttacker.strength) {
          if (range === 3) return true

          if (range >= 3) {
               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: enemyAttacker.pos, range: 3 },
               })

               return true
          }

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: enemyAttacker.pos, range: 25 },
               flee: true,
          })

          return true
     }

     // If the creep has less heal power than the enemyAttacker's attack power

     if (creep.strength < enemyAttacker.strength) {
          // If the range is less or equal to 2

          if (range <= 2) {
               // Have the creep flee and inform true

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: enemyAttacker.pos, range: 1 },
                    flee: true,
               })

               return true
          }
     }

     // If the range is more than 1

     if (range > 1) {
          // Have the create a moveRequest to the enemyAttacker and inform true

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: enemyAttacker.pos, range: 1 },
          })

          return true
     }

     // Otherwise inform true

     return true
}
