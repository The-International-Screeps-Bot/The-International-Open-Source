import { constants } from "international/constants"
import { getRangeBetween, unPackAsPos } from "international/generalFunctions"
import { RoomPullTask } from "room/roomTasks"
import { SourceHarvester } from "../../creepClasses"

SourceHarvester.prototype.isDying = function() {

    const creep = this,
    room = creep.room

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // Get the creep's path length

    const sourcePathLength = creep.memory.sourceName ? room.get(`${creep.memory.sourceName}PathLength`) : 0

    // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

    if (creep.ticksToLive > creep.body.length * CREEP_SPAWN_TIME + sourcePathLength) return false

    // Record creep as dying

    creep.memory.dying = true
    return true
}

SourceHarvester.prototype.travelToSource = function() {

    const creep = this,
    room = creep.room,

    // Define the creep's designated source

    sourceName = creep.memory.sourceName

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findSourceHarvestPos(sourceName)) return false

    creep.say('🚬')

    // Unpack the harvestPos

    const harvestPos = unPackAsPos(creep.memory.packedHarvestPos)

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRangeBetween(creep.pos.x, creep.pos.y, harvestPos.x, harvestPos.y) == 0) return false

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

        if (creepsPullTasks.length == 0) new RoomPullTask(room.name, creep.id, new RoomPosition(harvestPos.x, harvestPos.y, room.name), 1)

        // Inform false

        return true
    }

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say('⏩' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name), range: 0 },
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })

    return true
}

SourceHarvester.prototype.transferToSourceExtensions = function() {

    const creep = this,
    room = creep.room

    // If all spawningStructures are filled, inform false

    if (room.energyAvailable == room.energyCapacityAvailable) return false

    // If the creep is not nearly full, inform false

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > creep.partsOfType(WORK) * HARVEST_POWER) return false

    // Get adjacent structures to the creep

    const adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)

    // For each structure of adjacentStructures

    for (const adjacentPosData of adjacentStructures) {

        // Get the structure at the adjacentPos

        const structure = adjacentPosData.structure as AnyStoreStructure

        // If the structure has no store property, iterate

        if (!structure.store) continue

        // If the structureType is an extension, iterate

        if (structure.structureType != STRUCTURE_EXTENSION) continue

        // Otherwise, if the structure is full, iterate

        if (structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) continue

        // Otherwise, transfer to the structure and inform true

        creep.transfer(structure, RESOURCE_ENERGY)
        return true
    }

    // Inform false

    return false
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this,
    room = creep.room

    // If the creep is not nearly full, stop

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > creep.partsOfType(WORK) * HARVEST_POWER) return false

    // Find the sourceLink for the creep's source, Inform false if the link doesn't exist

    const sourceLink = room.get(`${creep.memory.sourceName}Link`)
    if (!sourceLink) return false

    // Try to transfer to the sourceLink and inform true

    return creep.advancedTransfer(sourceLink)
}

SourceHarvester.prototype.repairSourceContainer = function(sourceContainer) {

    const creep = this

    // If there is no container, inform false

    if (!sourceContainer) return false

    // Get the creep's number of work parts

    const workPartCount = creep.partsOfType(WORK)

    // If the sourceContainer doesn't need repairing, inform false

    if (sourceContainer.hitsMax - sourceContainer.hits < workPartCount * REPAIR_POWER) return false

    // If the creep doesn't have enough energy and it hasn't yet moved resources, withdraw from the sourceContainer

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < workPartCount && !creep.hasMovedResources) creep.withdraw(sourceContainer, RESOURCE_ENERGY)

    // If the creep has already worked, inform false

    if (creep.hasWorked) return false

    // Try to repair the target

    const repairResult = creep.repair(sourceContainer)

    // If the repair worked

    if (repairResult == OK) {

        // Record that the creep has worked

        creep.hasWorked = true

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
