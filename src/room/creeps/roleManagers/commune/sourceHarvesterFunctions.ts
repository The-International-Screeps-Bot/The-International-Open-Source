import { constants } from "international/constants"
import { getRangeBetween } from "international/generalFunctions"
import { RoomPullTask, RoomWithdrawTask } from "room/roomTasks"
import { SourceHarvester } from "../../creepClasses"

SourceHarvester.prototype.travelToSource = function() {

    const creep = this,
    room = creep.room,

    // Define the creep's designated source

    sourceName = creep.memory.sourceName

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findSourceHarvestPosition()) return false

    creep.say('🚬')

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRangeBetween(creep.pos.x, creep.pos.y, Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50)) == 0) return false

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

        if (creepsPullTasks.length == 0) new RoomPullTask(room.name, creep.id, room.newPos(creep.memory.harvestPos), 1)

        // Inform false

        return true
    }

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: new RoomPosition(Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50), room.name), range: 0 },
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })

    return true
}

SourceHarvester.prototype.transferToSourceLink = function() {

    const creep = this,
    room = creep.room

    // If the creep is not nearly full, stop

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > creep.partsOfType(WORK) * HARVEST_POWER) return

    // Find the sourceLink for the creep's source, Inform false if the link doesn't exist

    const sourceLink = room.get(`${creep.memory.sourceName}Link`)
    if (!sourceLink) return

    // Try to transfer to the sourceLink and inform true

    creep.advancedTransfer(sourceLink)
    return
}

SourceHarvester.prototype.createWithdrawTask = function(sourceContainer) {

    const creep = this,
    room = creep.room

    // If there is a sourceContainer, stop

    if (sourceContainer) return

    // Construct an undefined taskWithoutResponder

    let taskWithoutResponder: RoomWithdrawTask,

    // Construct totalResourcesOffered at 0

    totalResourcesOffered = 0

    // if there is no global for the creep, make one

    if (!global[creep.id]) global[creep.id] = {}

    // If there is no created task ID obj for the creep's global, create one

    if (!global[creep.id].createdTaskIDs) global[creep.id].createdTaskIDs = {}

    // Otherwise

    else {

        // Find the creep's tasks of type tansfer

        const creepsWithdrawTasks = room.findTasksOfTypes(global[creep.id].createdTaskIDs, new Set(['withdraw']))

        // Track the amount of energy the resource has offered in tasks

        let totalResourcesOffered = 0

        // Loop through each pickup task

        for (const task of creepsWithdrawTasks) {

            // Otherwise find how many resources the task has requested to pick up

            totalResourcesOffered += task.taskAmount

            // If the task doesn't have a responder, set it as taskWithoutResponder

            if (!task.responderID) taskWithoutResponder = task
        }

        // If there are more or equal resources offered than the used capacity of the creep, stop

        if (totalResourcesOffered >= creep.store.getUsedCapacity(RESOURCE_ENERGY)) return
    }

    // Assign amountToOffer as the energy left not assigned to tasks

    const amountToOffer = creep.store.getUsedCapacity(RESOURCE_ENERGY) - totalResourcesOffered

    // If there is a taskWithoutResponder

    if (taskWithoutResponder) {

        // Set the taskAmount to match amountToOffer

        taskWithoutResponder.taskAmount = amountToOffer

        // Update the task's priority to match new amountToOffer

        taskWithoutResponder.priority = 1

        // And stop

        return
    }

    // If the amountToOffer is more than x

    if (amountToOffer > 0) {

        // Create a new transfer task for the creep

        new RoomWithdrawTask(room.name, RESOURCE_ENERGY, amountToOffer, creep.id, 1)
    }
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
