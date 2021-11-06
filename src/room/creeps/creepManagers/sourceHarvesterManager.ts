import './sourceHarvesterFunctions'
import { RoleSourceHarvester } from "../creepClasses"

export function sourceHarvesterManager(room: Room, creepsOfRole: RoleSourceHarvester[]) {

    for (const creep of creepsOfRole) {

        const source: Source = room.get('source1')

        // Try to move to source. If creep moved then iterate

        const travelToSourceResult = creep.travelToSource(source)
        if (travelToSourceResult == 0) continue

        // Try to normally harvest. Iterate if creep harvested iterate

        const advancedHarvestResult = creep.advancedHarvestSource(source)
        if (advancedHarvestResult == 0) continue

        // Try to harvest using the sourceLink. If creep harvested iterate

        const transferToSourceLinkResult = creep.transferToSourceLink(source)
        if (transferToSourceLinkResult == 0 || transferToSourceLinkResult == 'noLink') continue

        // If the source is empty repair contianer if it exists. Iterate if success
        
        const advancedRepairResult = creep.repairSourceContainer(source)
        if (advancedHarvestResult == 0 || advancedHarvestResult == 'noContainer') continue
    }
}
