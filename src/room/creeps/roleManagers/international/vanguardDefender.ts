import { allyList, claimRequestNeedsIndex, constants } from "international/constants"
import { getRange } from "international/generalFunctions"
import { VanguardDefender } from "room/creeps/creepClasses"

export function vanguardDefenderManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
         // Get the creep using its name

         const creep: VanguardDefender = Game.creeps[creepName]

         const claimTarget = Memory.rooms[creep.memory.communeName].claimRequest

         // If the creep has no claim target, stop

         if (!claimTarget) return

         Memory.claimRequests[Memory.rooms[creep.memory.communeName].claimRequest].needs[
              claimRequestNeedsIndex.vanguardDefender
         ] -= creep.partsOfType(WORK)

         creep.say(claimTarget)

         if (room.name === claimTarget) {

              creep.buildRoom()
              continue
         }

         // Otherwise if the creep is not in the claimTarget

         // Move to it

         creep.createMoveRequest({
              origin: creep.pos,
              goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
              avoidEnemyRanges: true,
              cacheAmount: 200,
              typeWeights: {
                   enemy: Infinity,
                   ally: Infinity,
                   keeper: Infinity,
                   commune: 1,
                   neutral: 1,
                   highway: 1,
              },
         })
    }
}

VanguardDefender.prototype.advancedHeal = function () {

    const { room } = this

    this.say('AH')

    // If the creep is below max hits

    if (this.hitsMax > this.hits) {
         // Have it heal itself and stop

         this.heal(this)
         return false
    }

    let top = Math.max(Math.min(this.pos.y - 1, constants.roomDimensions - 2), 2)
    let left = Math.max(Math.min(this.pos.x - 1, constants.roomDimensions - 2), 2)
    let bottom = Math.max(Math.min(this.pos.y + 1, constants.roomDimensions - 2), 2)
    let right = Math.max(Math.min(this.pos.x + 1, constants.roomDimensions - 2), 2)

    // Find adjacent creeps

    const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

    // Loop through each adjacentCreep

    for (const posData of adjacentCreeps) {
         // If the creep is the posData creep, iterate

         if (this.id === posData.creep.id) continue

         // If the creep is not owned and isn't an ally

         if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

         // If the creep is at full health, iterate

         if (posData.creep.hitsMax === posData.creep.hits) continue

         // have the creep heal the adjacentCreep and stop

         this.heal(posData.creep)
         return false
    }

    (top = Math.max(Math.min(this.pos.y - 3, constants.roomDimensions - 2), 2)),
         (left = Math.max(Math.min(this.pos.x - 3, constants.roomDimensions - 2), 2)),
         (bottom = Math.max(Math.min(this.pos.y + 3, constants.roomDimensions - 2), 2)),
         (right = Math.max(Math.min(this.pos.x + 3, constants.roomDimensions - 2), 2))

    // Find my creeps in range of creep

    const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

    // Loop through each nearbyCreep

    for (const posData of nearbyCreeps) {
         // If the creep is the posData creep, iterate

         if (this.id === posData.creep.id) continue

         // If the creep is not owned and isn't an ally

         if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

         // If the creep is at full health, iterate

         if (posData.creep.hitsMax === posData.creep.hits) continue

         // have the creep rangedHeal the nearbyCreep and stop

         this.rangedHeal(posData.creep)
         return true
    }

    return false
}

VanguardDefender.prototype.advancedAttackAttackers = function () {

    const { room } = this

    // Get enemyAttackers in the room

    const enemyAttackers = room.enemyCreeps.filter(enemyCreep =>
         /* !enemyCreep.isOnExit() && */ enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK]),
    )

    // If there are none

    if (!enemyAttackers.length) {
         // Heal nearby creeps

         if (this.advancedHeal()) return true

         const { enemyCreeps } = room
         if (!enemyCreeps.length) return false

         this.say('EC')

         const enemyCreep = this.pos.findClosestByRange(enemyCreeps)
         // Get the range between the creeps

         const range = getRange(this.pos.x - enemyCreep.pos.x, this.pos.y - enemyCreep.pos.y)

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
         if (enemyCreep.owner.username !== 'Invader') this.move(this.pos.getDirectionTo(enemyCreep.pos))

         return true
    }

    // Otherwise, get the closest enemyAttacker

    const enemyAttacker = this.pos.findClosestByRange(enemyAttackers)

    // Get the range between the creeps

    const range = getRange(this.pos.x - enemyAttacker.pos.x, this.pos.y - enemyAttacker.pos.y)

    // If it's more than range 3

    if (range > 3) {
         // Heal nearby creeps

         this.advancedHeal()

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
         this.move(this.pos.getDirectionTo(enemyAttacker.pos))
    }

    // Otherwise, rangedAttack the enemyAttacker
    else this.rangedAttack(enemyAttacker)

    // If the creep is out matched, try to always stay in range 3

    if (this.findStrength() < enemyAttacker.findStrength()) {
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

    if (this.findStrength() < enemyAttacker.findStrength()) {
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
