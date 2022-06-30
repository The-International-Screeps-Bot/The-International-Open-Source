import { constants } from 'international/constants'
import { getRangeBetween, unpackAsPos, unpackAsRoomPos } from 'international/generalFunctions'
import { MineralHarvester } from '../../creepClasses'

MineralHarvester.prototype.advancedHarvestMineral = function (mineral) {
     const creep = this
     const { room } = creep

     // Try to find a harvestPosition, inform false if it failed

     if (!creep.findMineralHarvestPos()) return false

     creep.say('🚬')

     // Unpack the creep's packedHarvestPos

     const harvestPos = unpackAsRoomPos(creep.memory.packedPos, room.name)

     // If the creep is not standing on the harvestPos

     if (getRangeBetween(creep.pos.x, creep.pos.y, harvestPos.x, harvestPos.y) > 0) {
          creep.say('⏩M')

          // Make a move request to it

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: harvestPos, range: 0 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          // And inform false

          return false
     }

     // Harvest the mineral, informing the result if it didn't succeed

     if (creep.harvest(mineral) !== OK) return false

     // Find amount of minerals harvested and record it in data

     const mineralsHarvested = Math.min(this.parts.work * HARVEST_POWER, mineral.mineralAmount)
     global.roomStats[this.room.name].mineralsHarvested += mineralsHarvested

     creep.say(`⛏️${mineralsHarvested}`)

     // Inform true

     return true
}
