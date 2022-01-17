import { SourceHarvester } from '../creepClasses'
import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: SourceHarvester = Game.creeps[creepName]

        // Get the source using the source name in the creep's memory

        const source: Source = room.get(creep.memory.sourceName)

        // Record that the creep has source target

        creep.recordSource()

        // Try to move to source. If creep moved then iterate

        const travelToSourceResult = creep.travelToSource()
        if (travelToSourceResult) continue

        // Try to normally harvest. Iterate if creep harvested

        const advancedHarvestResult = creep.advancedHarvestSource(source)
        if (advancedHarvestResult) continue

        // Try to transfer to the source link. Iterate if it transfered

        const transferToSourceLinkResult = creep.transferToSourceLink()
        if (transferToSourceLinkResult) continue

        // If the source is empty repair the source contianer if it exists. Iterate if it repaired

        const advancedRepairResult = creep.repairSourceContainer()
        if (advancedRepairResult) continue
    }
}
