import { SourceHarvester } from '../../creepClasses'
import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: string[]) {
     // Loop through the names of the creeps of the role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: SourceHarvester = Game.creeps[creepName]

          // Try to move to source. If creep moved then iterate

          if (creep.travelToSource()) continue

          // Get the creeps sourceName

          const { sourceName } = creep.memory

          // Try to harvest the designated source

          creep.advancedHarvestSource(room.get(sourceName))

          // Try to transfer to source extensions, iterating if success

          if (creep.transferToSourceExtensions()) continue

          // Try to transfer to the source link, iterating if success

          if (creep.transferToSourceLink()) continue

          // Try to repair the sourceContainer

          creep.repairSourceContainer(room[`${sourceName}Container`])
     }
}
