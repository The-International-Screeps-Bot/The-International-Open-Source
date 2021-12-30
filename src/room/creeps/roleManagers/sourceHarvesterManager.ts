import { SourceHarvester } from '../creepClasses'
import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: SourceHarvester = Game.creeps[creepName]

        //

        const source: Source = room.get(creep.memory.sourceName)

        // Record that the creep has source target
        creep.recordSource()

        // Try to move to source. If creep moved then iterate

        const travelToSourceResult = creep.travelToSource()
        if (travelToSourceResult == 0) continue

        // Try to normally harvest. Iterate if creep harvested iterate

        const advancedHarvestResult = creep.advancedHarvestSource(source)
        if (advancedHarvestResult == 0) continue

        // Try to harvest using the sourceLink. If creep harvested iterate

        const transferToSourceLinkResult = creep.transferToSourceLink()
        if (transferToSourceLinkResult == 0 || transferToSourceLinkResult == 'noLink') continue

        // If the source is empty repair contianer if it exists. Iterate if success

        const advancedRepairResult = creep.repairSourceContainer()
        if (advancedHarvestResult == 0 || advancedHarvestResult == 'noContainer') continue
    }
}
