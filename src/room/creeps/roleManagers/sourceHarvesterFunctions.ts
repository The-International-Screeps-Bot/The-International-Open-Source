import { generalFuncs } from "international/generalFunctions"
import { RoomPullTask } from "room/roomTasks"
import { SourceHarvester } from "../creepClasses"

SourceHarvester.prototype.recordSource = function() {

    const creep = this
    const room = creep.room

    const sourceName: string = creep.memory.sourceName

    room.creepsOfSourceAmount[sourceName]++
}

SourceHarvester.prototype.travelToSource = function() {

    const creep = this
    const room = creep.room

    creep.say('TTS')

    // Define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Get the closetHarvestPos for the creep's designated source

    const closestHarvestPos = room.get(`${sourceName}ClosestHarvestPosition`)

    // Inform false if there is no closestHarvestPos

    if (!closestHarvestPos) return true

    // Inform true if the creep is at the closestHarvestPos

    if (generalFuncs.arePositionsEqual(creep.pos, closestHarvestPos)) return false

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

        // if there is no global for the creep, make one

        if (!global[creep.id]) global[creep.id] = {}

        // If there is no created task IDs object for the creator, make it

        if (!global[creep.id].createdTaskIDs) global[creep.id].createdTaskIDs = {}

        // Find the creep's task of type pull

        const creepsPullTasks = room.findTasksOfTypes(global[creep.id].createdTaskIDs, new Set(['pull']))

        // If there are no pull tasks for the creep, inform false

        if (creepsPullTasks.length == 0) return true

        // Otherwise create a task to get pulled to the source and stop

        new RoomPullTask(room.name, creep.id, targetPos)
        return true
    }

    // Otherwise say the intention and create a moveRequest to targetPos, informing the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: targetPos, range: 0 },
        avoidImpassibleStructures: true,
        avoidEnemyRanges: true,
    })
    return true
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this
    const room = creep.room

    // Define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Find the sourceLink for the creep's source, Inform false if the link doesn't exist

    const sourceLink = room.get(`${sourceName}Link`)
    if (!sourceLink) return false

    // Try to transfer to the sourceLink

    creep.advancedTransfer(sourceLink)

    return true
}

SourceHarvester.prototype.repairSourceContainer = function() {

    const creep = this
    const room = creep.room

    // Get the creeps source

    const sourceName = creep.memory.sourceName

    // Get the sourceContainer for the creep's source

    const sourceContainer = room.get(`${sourceName}Container`)

    // Stop if there is no source container

    if (!sourceContainer) return true

    // Otherwise check if the creep can upgrade the sourceContainer

    return true
}
