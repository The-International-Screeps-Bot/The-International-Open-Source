import { creepClasses } from "../creepClasses"
const SourceHarvester = creepClasses.sourceHarvester

SourceHarvester.prototype.travelToSource = function(source: Source) {

    const creep = this
    const room = creep.room

    const closestHarvestPos = room.get('source1ClosestHarvestPosition')

    if (global.arePositionsAlike(creep.pos, closestHarvestPos)) return 'atSource'

    const targetPos = findTargetPos()

    function findTargetPos() {

        // Create costMatrix

        const cm = new PathFinder.CostMatrix()

        // Assign impassible to tiles with sourceHarvesters

        for (const sourceHarvester of room.myCreeps.sourceHarvester) {

            // Iterate if sourceHarvester is this creep

            if (sourceHarvester.id == creep.id) continue

            cm.set(sourceHarvester.x, sourceHarvester.y, 255)
        }

        // return closestHarvestPositions if there is a sourceHarvester on the closestHarvestPosition

        if (cm.get(closestHarvestPos.x, closestHarvestPos.y) != 255) return closestHarvestPos

        // If creepOnHarvestPos find a harvest pos that isn't occupied

        const harvestPositions = room.get('source1HarvestPositions')

        for (const harvestPos of harvestPositions) {

            if (cm.get(harvestPos.x, harvestPos.y) == 255) continue

            return harvestPos
        }
    }

    //

    creep.say('travelToSource')

    creep.travel({
        origin: creep.pos,
        goal: { pos: targetPos, range: 0 },
        plainCost: 1,
        swampCost: 1,
        avoidRooms: [],
        flee: false,
        cacheAmount: 50,
    })

    return 0
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this
    const room = creep.room

    const sourceLink = room.get('source1Link')
    if (!sourceLink) return 'noLink'

    creep.advancedTransfer(sourceLink)

    return 0
}
