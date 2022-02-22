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

    // Get the creeps source

    const sourceName = creep.memory.sourceName

    // Get the sourceContainer for the creep's source

    const sourceContainer = room.get(`${sourceName}Container`)

    // Stop if there is no source container

    if (!sourceContainer) return true

    // Otherwise check if the creep can upgrade the sourceContainer

    return true
}
