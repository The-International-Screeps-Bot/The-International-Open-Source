import { allyList, constants, myColors } from 'international/constants'
import { getRange } from 'international/generalFunctions'
import { MeleeDefender } from 'room/creeps/creepClasses'

MeleeDefender.prototype.advancedDefend = function () {
     const creep = this
     const { room } = creep

     // Get enemyAttackers in the room, informing false if there are none

     const enemyAttackers = room.enemyAttackers.filter(function(enemyAttacker) {

          return !enemyAttacker.isOnExit()
     })

     if (!enemyAttackers.length) return false

     // Get the closest enemyAttacker

     const enemyAttacker = creep.pos.findClosestByRange(enemyAttackers)

     // Get the room's ramparts, filtering for those and informing false if there are none

     const ramparts = room.structures.rampart.filter(function (rampart) {
          // Get structures at the rampart's pos

          const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, rampart.pos)

          // Loop through each structure

          for (const structure of structuresAtPos) {
               // If the structure is impassible, inform false

               if (constants.impassibleStructureTypes.includes(structure.structureType)) return false
          }

          // Get creeps at the rampart's pos

          const creepsAtPos = room.lookForAt(LOOK_CREEPS, rampart.pos)

          // Loop through each creep

          for (const creepAlt of creepsAtPos) {
               // If the creepAlt isn't the creep, inform false

               if (creepAlt.id !== creep.id) return false
          }

          // Otherwise inform true

          return true
     })

     if (!ramparts.length) {
          if (getRange(creep.pos.x - enemyAttacker.pos.x, creep.pos.y - enemyAttacker.pos.y) > 1) {
               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: enemyAttacker.pos, range: 1 },
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               return true
          }

          creep.attack(enemyAttacker)

          if (enemyAttacker.getActiveBodyparts(MOVE) > 0) creep.move(creep.pos.getDirectionTo(enemyAttacker))

          return true
     }

     // Attack the enemyAttacker

     creep.attack(enemyAttacker)

     // Find the closest rampart to the enemyAttacker

     const closestRampart = enemyAttacker.pos.findClosestByRange(ramparts)

     // Visualize the targeting, if roomVisuals are enabled

     if (Memory.roomVisuals)
          room.visual.line(creep.pos, closestRampart.pos, {
               color: myColors.lightBlue,
          })

     // If the creep is range 0 to the closestRampart, inform false

     if (creep.pos.getRangeTo(closestRampart.pos) === 0) return false

     // Otherwise move to the rampart preffering ramparts and inform true

     creep.createMoveRequest({
          origin: creep.pos,
          goal: { pos: closestRampart.pos, range: 0 },
          plainCost: 30,
          swampCost: 80,
          weightGamebjects: {
               2: room.structures.road,
               1: room.structures.rampart,
          },
     })

     return true
}
