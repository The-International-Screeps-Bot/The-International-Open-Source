import { generalFuncs } from "international/generalFunctions"
import { RoomPullTask } from "room/roomTasks"
import { SourceHarvester } from "../creepClasses"

SourceHarvester.prototype.travelToSource = function() {

    const creep = this
    const room = creep.room

    // Define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findHarvestPosition()) return false

    creep.say('🚬')

    // Inform true if the creep is at the creep's harvestPos

    if (generalFuncs.arePositionsEqual(creep.pos, creep.memory.harvestPos)) return false

    // If the creep's movement type is pull

    if (creep.memory.getPulled) {

        creep.say('GP')

        // if there is no global for the creep, make one

        if (!global[creep.id]) global[creep.id] = {}

        // If there is no created task IDs object for the creator, make it

        if (!global[creep.id].createdTaskIDs) global[creep.id].createdTaskIDs = {}

        // Find the creep's task of type pull

        const creepsPullTasks = room.findTasksOfTypes(global[creep.id].createdTaskIDs, new Set(['pull']))

        // If there are no pull tasks for the creep, make one for the creep's harvestPos

        if (creepsPullTasks.length == 0) new RoomPullTask(room.name, creep.id, room.newPos(creep.memory.harvestPos))

        // Inform false

        return true
    }

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: room.newPos(creep.memory.harvestPos), range: 0 },
        avoidImpassibleStructures: true,
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })
    return true
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this
    const room = creep.room

    // Find the sourceLink for the creep's source, Inform false if the link doesn't exist

    const sourceLink = room.get(`${creep.memory.sourceName}Link`)
    if (!sourceLink) return false

    // Try to transfer to the sourceLink

    creep.advancedTransfer(sourceLink)

    return true
}

SourceHarvester.prototype.repairSourceContainer = function() {

    const creep = this
    const room = creep.room

    // Get the creep's number of work parts

    const workPartCount = creep.partsOfType(WORK)

    // If the creep doesn't have enough energy, inform false

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < workPartCount) return false

    // Get the creeps sourceName

    const sourceName = creep.memory.sourceName,

    // Get the sourceContainer for the creep's source, informing false if it's undefined

    sourceContainer: StructureContainer = room.get(`${sourceName}Container`)
    if (!sourceContainer) return false

    // If the sourceContainer doesn't need repairing, inform false

    if (sourceContainer.hitsMax - sourceContainer.hits > workPartCount * REPAIR_POWER) return false

    // Try to repair the target

    const repairResult = creep.repair(sourceContainer)

    // If the repair worked

    if (repairResult == OK) {

        // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(workPartCount, (sourceContainer.hitsMax - sourceContainer.hits) / REPAIR_POWER)

        // Add control points to total controlPoints counter and say the success

        Memory.energySpentOnRepairing += energySpentOnRepairs
        creep.say('🔧' + energySpentOnRepairs * REPAIR_POWER)

        // Inform success

        return true
    }

    // Inform failure

    return false
}
