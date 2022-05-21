import { MineralHarvester } from '../../creepClasses'
import './mineralHarvesterFunctions'

export function mineralHarvesterManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: MineralHarvester = Game.creeps[creepName]

          // Get the mineral

          const mineral: Mineral = room.get('mineral')

          if (mineral.mineralAmount === 0) {
               creep.advancedRecycle()
               continue
          }

          // If the creep needs resources

          if (creep.needsResources()) {
               // Harvest the mineral and iterate

               creep.advancedHarvestMineral(mineral)
               continue
          }

          // If there is a terminal

          if (room.terminal) {
               // Transfer the creep's minerals to it

               creep.advancedTransfer(room.terminal, mineral.mineralType)
          }
     }
}
