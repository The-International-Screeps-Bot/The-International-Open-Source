import { constants, myColors } from 'international/constants'
import { getRange, pack } from 'international/generalFunctions'
import { MeleeDefender } from '../../creepClasses'

export function meleeDefenderManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: MeleeDefender = Game.creeps[creepName]

          creep.advancedDefend()
     }
}

MeleeDefender.prototype.advancedDefend = function () {
     const { room } = this

     // Get enemyAttackers in the room, informing false if there are none

     const enemyAttackers = room.enemyAttackers.filter(function (enemyAttacker) {
          return !enemyAttacker.isOnExit()
     })

     if (!enemyAttackers.length) return false

     // Get the closest enemyAttacker

     const enemyAttacker = this.pos.findClosestByRange(enemyAttackers)

     // Get the room's ramparts, filtering for those and informing false if there are none

     const ramparts = room.structures.rampart.filter(rampart => {
          // Get structures at the rampart's pos

          const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, rampart.pos)

          // Loop through each structure

          for (const structure of structuresAtPos) {
               // If the structure is impassible, inform false

               if (constants.impassibleStructureTypes.includes(structure.structureType)) return false
          }

          // Allow the rampart the creep is currently standing on

          if (rampart.pos === this.pos) return true

          // Inform wether there is a creep at the pos

          return room.creepPositions[pack(rampart.pos)]
     })

     if (!ramparts.length) {
          if (getRange(this.pos.x - enemyAttacker.pos.x, this.pos.y - enemyAttacker.pos.y) > 1) {
               this.createMoveRequest({
                    origin: this.pos,
                    goal: { pos: enemyAttacker.pos, range: 1 },
               })

               return true
          }

          this.attack(enemyAttacker)

          if (enemyAttacker.getActiveBodyparts(MOVE) > 0) this.move(this.pos.getDirectionTo(enemyAttacker))

          return true
     }

     // Attack the enemyAttacker

     this.attack(enemyAttacker)

     // Find the closest rampart to the enemyAttacker

     const closestRampart = enemyAttacker.pos.findClosestByRange(ramparts)

     // Visualize the targeting, if roomVisuals are enabled

     if (Memory.roomVisuals)
          room.visual.line(this.pos, closestRampart.pos, {
               color: myColors.lightBlue,
          })

     // If the creep is range 0 to the closestRampart, inform false

     if (this.pos.getRangeTo(closestRampart.pos) === 0) return false

     // Otherwise move to the rampart preffering ramparts and inform true

     this.createMoveRequest({
          origin: this.pos,
          goal: { pos: closestRampart.pos, range: 0 },
          plainCost: 20,
          swampCost: 80,
     })

     return true
}
