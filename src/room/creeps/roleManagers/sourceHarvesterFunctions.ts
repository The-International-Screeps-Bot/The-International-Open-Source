import { RoomPullTask } from "room/roomTasks"
import { SourceHarvester } from "../creepClasses"

SourceHarvester.prototype.recordSource = function() {

    const creep: SourceHarvester = this
    const room = creep.room

    const sourceName: string = creep.memory.sourceName

    room.creepsOfSourceAmount[sourceName]++
}

SourceHarvester.prototype.travelToSource = function() {

    const creep: SourceHarvester = this
    const room = creep.room

    creep.say('TTS')

    // Define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Get the closetHarvestPos for the creep's designated source

    const closestHarvestPos = room.get(`${sourceName}ClosestHarvestPosition`)

    // Inform false if there is no closestHarvestPos

    if (!closestHarvestPos) return false

    // Inform message if the creep is at the closestHarvestPos

    if (global.arePositionsEqual(creep.pos, closestHarvestPos)) return 'atSource'

    function findTargetPos() {

        // Create costMatrix

        const cm = new PathFinder.CostMatrix()

        // Assign impassible to tiles with sourceHarvesters

        for (const sourceHarvesterName of room.myCreeps.sourceHarvester) {

            // Find the sourceHarvester using its name

            const sourceHarvester = Game.creeps[sourceHarvesterName]

            // Iterate if sourceHarvester is this creep

            if (sourceHarvester.id == creep.id) continue

            cm.set(sourceHarvester.x, sourceHarvester.y, 255)
        }

        // return closestHarvestPositions if there is a sourceHarvester on the closestHarvestPosition

        if (cm.get(closestHarvestPos.x, closestHarvestPos.y) != 255) return closestHarvestPos

        // If creepOnHarvestPos find a harvest pos that isn't occupied

        const harvestPositions = room.get(`${sourceName}HarvestPositions`)

        for (const harvestPos of harvestPositions) {

            if (cm.get(harvestPos.x, harvestPos.y) == 255) continue

            return harvestPos
        }
    }

    const targetPos = findTargetPos()

    // If the creep's movement type is pull

    if (creep.memory.getPulled) {

        creep.say('GP')

        // If the creep already has created a task

        if (room.hasTaskOfTypes(global.advancedGetValue(creep.id, { createdTasks: {} }).createdTasks, ['pull'])) return OK

        // Create a task to get pulled to the source and stop

        new RoomPullTask(room.name, creep.id, creep.name, targetPos)
        return OK
    }

    // Otherwise say the intention and create a moveRequest to targetPos, informing the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: targetPos, range: 1 },
        avoidImpassibleStructures: true,
        avoidEnemyRanges: true,
    })
    return true
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep: SourceHarvester = this
    const room = creep.room

    // Define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Find the sourceLink for the creep's source, stop if the link doesn't exist

    const sourceLink = room.get(`${sourceName}Link`)
    if (!sourceLink) return 'noLink'

    // Try to transfer to the sourceLink

    creep.advancedTransfer(sourceLink)

    return 0
}
