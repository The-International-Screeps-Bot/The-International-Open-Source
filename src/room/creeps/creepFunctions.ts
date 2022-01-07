import { constants } from "international/constants"
import { RoomTask } from "room/roomTasks"

Creep.prototype.isDying = function() {

    const creep: Creep = this

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // Stop if creep body parts * 3 is more or less than ticks left alive

    if (creep.ticksToLive > creep.body.length * 3) return false

    // Record creep as dying

    creep.memory.dying = true
    return true
}

Creep.prototype.advancedTransfer = function(target: any, resource?: ResourceConstant, amount?: number) {

    const creep: Creep = this
    const room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Make a moveRequest to target and inform failure

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return false
    }

    // If there wasn't a defined resource, define it as energy

    if (!resource) resource = RESOURCE_ENERGY

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getUsedCapacity(resource), target.store.getFreeCapacity(resource))

    // Try to transfer

    const transferResult = creep.transfer(target, resource, amount)

    // If the transfer is not a success inform the failure

    if (transferResult != 0) return false

    // Otherwise inform the success

    return true
}

Creep.prototype.advancedWithdraw = function(target: any, resource?: ResourceConstant, amount?: number) {

    const creep: Creep = this
    const room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Create a moveRequest to the target and inform failure

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return false
    }

    // If there wasn't a defined resource, define it as energy

    if (!resource) resource = RESOURCE_ENERGY

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getFreeCapacity(resource), target.store.getUsedCapacity(resource))

    // Try to withdraw

    const withdrawResult = creep.withdraw(target, resource, amount)

    // If the withdraw is not a success inform the failure

    if (withdrawResult != 0) return false

    // Otherwise inform the success

    return true
}

Creep.prototype.advancedPickup = function(target) {

    const creep = this
    const room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Make a moveReqyest to the target and inform failure

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return false
    }

    // Try to pickup

    const pickupResult = creep.pickup(target)

    // If the pickup is not a success inform the failure

    if (pickupResult != 0) return false

    // Otherwise inform the success

    return true
}

Creep.prototype.advancedHarvestSource = function(source: Source) {

    const creep: Creep = this

    const harvestResult: number = creep.harvest(source)
    if (harvestResult != 0) return harvestResult

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(creep.partsOfType(WORK) * 2, source.energy)
    Memory.energyHarvested += energyHarvested

    creep.say('⛏️' + energyHarvested)

    return 0
}

Creep.prototype.advancedUpgradeController = function() {

    const creep: Creep = this
    const room = creep.room

    creep.say('AUC')

    const controller = room.controller

    // Inform false if there is no controller

    if (!controller) return false

    // If the creep needs resources

    if (creep.needsResources()) {

        creep.say('DR')

        const droppedResources = room.find(FIND_DROPPED_RESOURCES, {
            filter: resource => resource.resourceType == RESOURCE_ENERGY
        })

        if (droppedResources.length == 0) return false

        // If the pickup wasn't a success inform failure

        if (!creep.advancedPickup(creep.pos.findClosestByRange(droppedResources))) return false
    }

    // Otherwise if the creep doesn't need resources

    // If the controller is out of upgrade range

    if (creep.pos.getRangeTo(controller.pos) > 3) {

        creep.say('MC')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: controller.pos, range: 3 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })

        // Inform true

        return true
    }

    // Try to upgrade the controller

    const upgradeControllerResult = creep.upgradeController(controller)

    // If the upgrade worked

    if (upgradeControllerResult == OK) {

        creep.say('UC')

        // Calculate the control points added

        const controlPoints = creep.partsOfType(WORK)

        // Add control points to total controlPoints counter and say the success

        Memory.controlPoints += controlPoints
        creep.say('🔋' + controlPoints)

        // Inform true

        return true
    }

    // Inform false

    return false
}

Creep.prototype.hasPartsOfTypes = function(partTypes: BodyPartConstant[]): boolean {

    const creep: Creep = this

    for (const partType of partTypes) {

        if (creep.body.some(part => part.type == partType)) return true
    }

    return false
}

Creep.prototype.partsOfType = function(type: BodyPartConstant) {

    const creep: Creep = this

    // Filter body parts that are of type, return number of them

    const partsOfType = creep.body.filter(part => part.type == type)
    return partsOfType.length
}

Creep.prototype.needsNewPath = function(cacheAmount) {

    const creep = this

    // Inform true if there is no path

    if (!creep.memory.path) return true

    // Inform true if the path is at its end

    if (creep.memory.path.length == 0) return true

    // Inform true if there is no lastCache value in the creep's memory

    if (!creep.memory.lastCache) return true

    // Inform true if the path is out of caching time

    if (creep.memory.lastCache + cacheAmount < Game.time) return true

    // Otherwise inform false

    return false
}

Creep.prototype.createMoveRequest = function(opts) {

    const creep = this
    const room = creep.room

    // Stop if creep can't move

    if (creep.fatigue > 0) return false

    // Stop if creep is spawning

    if (creep.spawning) return false

    // Stop if the creep already has a moveRequest

    if (creep.moveRequest) return false

    // Assign default opts

    if (!opts.cacheAmount) opts.cacheAmount = 20

    // See if the creep needs a new path

    const needsNewPathResult = creep.needsNewPath(opts.cacheAmount)

    // Set path to the path in the creep's memory

    let path: RoomPosition[] = creep.memory.path

    // If the creep need a new path, make one

    if (needsNewPathResult) {

        opts.creep = creep

        // Generate a new path

        path = room.advancedFindPath(opts)

        // Set the creep's memory targetPos to the goal's pos

        creep.memory.targetPos = opts.goal.pos

        // Limit the path's length to the cacheAmount

        path.splice(opts.cacheAmount, path.length)

        // Show that a new path has been created

        if (Memory.roomVisuals) room.visual.text('New path', path[0], { align: 'center' })
    }

    // Stop if there are no positions left in the path

    if (path.length == 0) return false

    // Assign movePos to the first pos in path

    let movePos = path[0]

    let i = -1

    // So long as the creep is standing on the first position in the path

    while (global.arePositionsEqual(creep.pos, movePos)) {

        // Remove the first pos of the path

        path.shift()

        // Increment i and set movePos as the pos in path with an index of i

        i++
        movePos = path[i]

        // Stop if there is no movePos

        if (!movePos) return false
    }

    // Visualize path

    room.pathVisual(path, 'lightBlue')

    // Turn the creep's pos into a string

    const movePosString = JSON.stringify(movePos)

    // If there isn't a moveRequest value for this position create one

    if (!room.moveRequests[movePosString]) room.moveRequests[movePosString] = []

    // Add the creep's name to its moveRequest position

    room.moveRequests[movePosString].push(creep.name)

    // Make moveRequest true to inform a moveRequest has been made

    creep.moveRequest = true

    // Set the lastCahce to the current tick

    creep.memory.lastCache = Game.time

    // Set the path in the creep's memory

    creep.memory.path = path

    // Inform success

    return true
}

Creep.prototype.findTask = function(allowedTaskTypes) {

    const creep: Creep = this
    const room = creep.room

    creep.say('FT')

    // Iterate through taskIDs in room

    for (const taskID in global[room.name].tasksWithoutResponders) {

        const task: RoomTask = global[room.name].tasksWithoutResponders[taskID]

        // Iterate if the task's type isn't an allowedTaskType

        if (!allowedTaskTypes[task.type]) continue

        // Otherwise set the creep's task as the task's ID

        global[creep.id].taskID = taskID

        // Set the responderID to the creepID

        task.responderID = creep.id

        // Add the task to tasksWithResponders

        global[room.name].tasksWithResponders[taskID] = task

        // Delete the task from tasksWithoutResponders

        delete global[room.name].tasksWithoutResponders[taskID]

        // Inform the task creator that the task now has a responder

        global.advancedGetValue(task.creatorID, { createdTasks: {} }).createdTasks[taskID] = true

        // Inform true

        return true
    }

    creep.say('NT')

    return false
}

Creep.prototype.runMoveRequest = function(pos) {

    const creep = this
    const room = creep.room

    // Delete all moveRequests to the position

    delete room.moveRequests[JSON.stringify(pos)]

    // Remove record of the creep being on its current position

    delete room.creepPositions[JSON.stringify(creep.pos)]

    // Move the creep to the position and inform the result

    return creep.move(creep.pos.getDirectionTo(room.newPos(pos)))
}

Creep.prototype.needsResources = function() {

    const creep = this

    // If the creep is empty

    if (creep.store.getUsedCapacity() == 0) {

        // Record and inform that the creep needs resources

        creep.memory.needsResources = true
        return true
    }

    // Otherwise Record and inform that the creep does not need resources

    creep.memory.needsResouces = undefined
    return false
}
