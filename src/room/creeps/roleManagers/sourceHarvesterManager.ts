import { SourceHarvester } from '../creepClasses'
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

        // Try to normally harvest. Iterate if creep harvested

        if (creep.advancedHarvestSource(room.get(creep.memory.sourceName))) continue

        // Try to transfer to the source link. Iterate if it transfered

        if (creep.transferToSourceLink()) continue

        // If the source is empty repair the source contianer if it exists. Iterate if it repaired

        if (creep.repairSourceContainer()) continue
    }
}
