import creepClasses from "../creepClasses"
const SourceHarvester = creepClasses.SourceHarvester

SourceHarvester.prototype.recordSource = function() {

    const creep: Creep = this
    const room: Room = creep.room

    const sourceName: string = creep.memory.sourceName

    room.creepsOfSourceAmount[sourceName]++
}

SourceHarvester.prototype.travelToSource = function() {

    const creep = this
    const room = creep.room

    const sourceName: string = creep.memory.sourceName

    const closestHarvestPos = room.get(sourceName + 'ClosestHarvestPosition')

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

        const harvestPositions = room.get(sourceName + 'HarvestPositions')

        for (const harvestPos of harvestPositions) {

            if (cm.get(harvestPos.x, harvestPos.y) == 255) continue

            return harvestPos
        }
    }

    //

    creep.say('⏩ ' + sourceName)

    creep.travel({
        origin: creep.pos,
        goal: { pos: targetPos, range: 0 },
        cacheAmount: 50,
    })

    return 0
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this
    const room = creep.room

    const sourceName: string = creep.memory.sourceName

    const sourceLink = room.get(sourceName + 'Link')
    if (!sourceLink) return 'noLink'

    creep.advancedTransfer(sourceLink)

    return 0
}
