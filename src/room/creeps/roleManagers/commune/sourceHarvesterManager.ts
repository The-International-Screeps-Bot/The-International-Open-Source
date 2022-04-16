import { SourceHarvester } from '../../creepClasses'
import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: string[]) {

    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: SourceHarvester = Game.creeps[creepName]

        // If the creep cannot find a sourceName, iterate

        if (!creep.findOptimalSourceName()) continue

        // Try to move to source. If creep moved then iterate

        if (creep.travelToSource()) continue

        // Get the creeps sourceName

        const sourceName = creep.memory.sourceName,

        // Get the sourceContainer for the creep's source

        sourceContainer: StructureContainer = room.get(`${sourceName}Container`)

        // Try to harvest the designated source

        creep.advancedHarvestSource(room.get(sourceName))

        // Try to transfer to the source link. Iterate if it transfered

        creep.transferToSourceLink()

        // Try to repair the sourceContainer. Iterate if it repaired

        creep.repairSourceContainer(sourceContainer)
    }
}
