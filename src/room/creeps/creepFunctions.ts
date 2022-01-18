import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { RoomTask, RoomWithdrawTask } from "room/roomTasks"

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

Creep.prototype.advancedTransfer = function(target, resourceType = RESOURCE_ENERGY, amount) {

    const creep = this
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

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getUsedCapacity(resourceType), target.store.getFreeCapacity(resourceType))

    // Try to transfer

    const transferResult = creep.transfer(target, resourceType, amount)

    // If the transfer is not a success inform the failure

    if (transferResult != OK) return false

    // Otherwise inform the success

    return true
}

Creep.prototype.advancedWithdraw = function(target, resourceType = RESOURCE_ENERGY, amount) {

    const creep = this
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

    // If there wasn't an amount provided

    if (!amount) amount = Math.min(creep.store.getFreeCapacity(resourceType), target.store.getUsedCapacity(resourceType))

    // Try to withdraw

    const withdrawResult = creep.withdraw(target, resourceType, amount)

    // If the withdraw is not a success inform the failure

    if (withdrawResult != OK) return false

    // Otherwise inform the success

    return true
}

Creep.prototype.advancedPickup = function(target) {

    const creep = this
    const room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Make a moveRequest to the target and inform failure

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

    if (pickupResult != OK) return false

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

        // If creep has a task

        if (global[creep.id] && global[creep.id].respondingTaskIDs && global[creep.id].respondingTaskIDs.length > 0) {

            // Try to filfill task and stop

            creep.fulfillTask()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
        ]))

        return false
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

        return false
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

Creep.prototype.needsNewPath = function(goalPos, cacheAmount) {

    const creep = this

    // Inform true if there is no path

    if (!creep.memory.path) return true

    // Inform true if the path is at its end

    if (creep.memory.path.length == 0) return true

    // Inform true if there is no lastCache value in the creep's memory

    if (!creep.memory.lastCache) return true

    // Inform true if the path is out of caching time

    if (creep.memory.lastCache + cacheAmount < Game.time) return true

    // Inform true if the creep's previous target isn't its current

    if (!generalFuncs.arePositionsEqual(creep.memory.targetPos, goalPos)) return true

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

    // If there is a path in the creep's memory

    if (creep.memory.path) {

        // So long as the creep is standing on the first position in the path

        while (generalFuncs.arePositionsEqual(creep.pos, creep.memory.path[0])) {

            // Remove the first pos of the path

            creep.memory.path.shift()
        }
    }

    // See if the creep needs a new path

    const needsNewPathResult = creep.needsNewPath(opts.goal.pos, opts.cacheAmount)

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

    // So long as the creep is standing on the first position in the path

    while (generalFuncs.arePositionsEqual(creep.pos, path[0])) {

        // Remove the first pos of the path

        path.shift()

        // Stop if there is no first pos in path

        if (!path[0]) return false
    }

    // Assign movePos to the first pos in path

    let movePos = path[0]

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

Creep.prototype.createStoringStructureWithdrawTask = function(resourceType = RESOURCE_ENERGY, amount) {

    const creep = this
    const room = creep.room

    // Construct the room's storing structures

    const storingStrutures = [room.storage, room.terminal]

    // Loop through them

    for (const structure of storingStrutures) {

        // Iterate if the structure isn't defined

        if (!structure) continue

        // Iterate if the structure doesn't have enough resources

        if (structure.store.getUsedCapacity(resourceType) < amount) continue

        // Otherwise create a withdraw task for the structure

        const task = new RoomWithdrawTask(room.name, resourceType, amount, structure.id)

        // And have the creep accept the task and inform true

        creep.acceptTask(task)
        return true
    }

    // If no task was created and accepted, inform false

    return false
}

Creep.prototype.acceptTask = function(task) {

    const creep = this
    const room = creep.room

    // if there is no global for the creep, make one

    if (!global[creep.id]) global[creep.id] = {}

    // Otherwise if there is no responding task ID array for the creep's global, create one

    if (!global[creep.id].respondingTaskIDs) global[creep.id].respondingTaskIDs = []

    // Add the task's ID to the start of the creep's responding task IDs

    global[creep.id].respondingTaskIDs.splice(0, 0, task.ID)

    // Set the responderID to the creepID

    task.responderID = creep.id

    // Loop through the task's creators

    for (const creatorID of task.creatorIDs) {

        // And record that the task now has a responder

        global[creatorID].createdTaskIDs[task.ID] = true
    }

    // Add the task to tasksWithResponders

    global[room.name].tasksWithResponders[task.ID] = task

    // Delete the task from tasksWithoutResponders

    delete global[room.name].tasksWithoutResponders[task.ID]
}

Creep.prototype.findTask = function(allowedTaskTypes, resourceType) {

    const creep = this
    const room = creep.room

    creep.say('🔍')

    // Iterate through taskIDs in room

    for (const taskID in global[room.name].tasksWithoutResponders) {

        const task: RoomTask = global[room.name].tasksWithoutResponders[taskID]

        // Iterate if the task's type isn't an allowedTaskType

        if (!allowedTaskTypes.has(task.type)) continue

        // Iterate of there is a requested resourceType and the task doesn't have it

        if (resourceType && task.resourceType != resourceType) continue

        creep.acceptTask(task)

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

Creep.prototype.fulfillTask = function() {

    const creep = this
    const room = creep.room

    creep.say('FT')

    // Construct names for different functions based on tasks

    const functionsForTasks: {[key: string]: any} = {
        pull: 'fulfillPullTask',
        transfer: 'fulfillTransferTask',
        withdraw: 'fulfillWithdrawTask',
        pickup: 'fulfillPickupTask',
    }

    // Get the creep's function

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

    // Run the creep's function

    creep[functionsForTasks[task.type]](task)
}


Creep.prototype.fulfillPullTask = function(task) {

    const creep = this
    const room = creep.room

    creep.say('PT')

    // Get the task info

    const taskTarget: Creep = generalFuncs.findObjectWithId(task.targetID)

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Create a moveRequest to the target and stop

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: taskTarget.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return
    }

    // Otherwise

    // Find the targetPos

    const targetPos = task.targetPos

    // If the creep is not in range of the targetPos

    if (creep.pos.getRangeTo(targetPos) > 0) {

        // Have the creep pull the target and have it move with the creep and stop

        creep.pull(taskTarget)
        taskTarget.move(creep)

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: targetPos, range: 0 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return
    }

    // Otherwise

    // Have the creep move to where the taskTarget is

    creep.move(creep.pos.getDirectionTo(taskTarget.pos))

    // Have the creep pull the taskTarget to trade places with the creep

    creep.pull(taskTarget)
    taskTarget.move(creep)

    // Delete the task

    task.delete()

    // Try to find a new task

    const findTaskResult = creep.findTask(new Set([
        'transfer',
        'withdraw',
        'pull'
    ]))

    // If creep found a task, try to fulfill it

    if (findTaskResult) creep.fulfillTask()
}

Creep.prototype.fulfillTransferTask = function(task) {

    const creep = this
    const room = creep.room

    creep.say('TT')

    // If the creep is empty

    if (creep.store.getUsedCapacity() == 0) {

        // Try to find a withdraw task with energy

        const findTaskResult = creep.findTask(new Set([
            'withdraw',
            'pickup'
        ]))

        // If the creep found a task

        if (findTaskResult) {

            // Try to fulfill the new task and stop

            creep.fulfillTask()
            return
        }

        // Otherwise try to create a withdraw task from storing structures

        const createTaskResult = creep.createStoringStructureWithdrawTask(task.resourceType, task.transferAmount)

        // If a task was created, try to fulfill it

        if (createTaskResult) creep.fulfillTask()

        // Stop

        return
    }

    // Get the transfer target using the task's transfer target IDs

    let transferTarget = generalFuncs.findObjectWithId(task.transferTargetIDs[0])

    // Transfer to the target

    let advancedTransferResult = creep.advancedTransfer(transferTarget, task.resourceType)

    // Stop if the transfer failed

    if (!advancedTransferResult) return

    // Otherwise delete the task's ID from the creator that was transfered to

    delete global[task.creatorIDs[0]].createdTaskIDs[task.ID]

    // And remove the transfer target's ID from the task's transfer target IDs

    task.transferTargetIDs.splice(0, 1)

    // If there are no transfer target left

    if (task.transferTargetIDs.length == 0) {

        // Delete the task

        task.delete()

        // Try to find a new task

        const findTaskResult = creep.findTask(new Set([
            'transfer',
            'withdraw',
            'pull',
            'pickup'
        ]))

        // If a task was created, try to fulfill it

        if (findTaskResult) creep.fulfillTask()

        // Stop

        return
    }

    // Otherwise stop if the creep has made a move request

    if (creep.moveRequest) return

    // Otherwise get the next transfer target using the task's transfer target IDs

    transferTarget = generalFuncs.findObjectWithId(task.transferTargetIDs[0])

    // And try to transfer to it

    advancedTransferResult = creep.advancedTransfer(transferTarget, task.resourceType)

    // Stop if the transfer failed

    if (!advancedTransferResult) return

    // Otherwise remove the transfer target's ID from the task's transfer target IDs

    task.transferTargetIDs.splice(0, 1)

    // If there are no transfer target left

    if (task.transferTargetIDs.length == 0) {

        // Delete the task

        task.delete()

        // Try to find a new task

        const findTaskResult = creep.findTask(new Set([
            'transfer',
            'withdraw',
            'pull',
            'pickup'
        ]))

        // If a task was created, try to fulfill it

        if (findTaskResult) creep.fulfillTask()

        // Stop

        return
    }
}

Creep.prototype.fulfillWithdrawTask = function(task) {

    const creep = this
    const room = creep.room

    creep.say('WT')

    // If the creep is full

    if (creep.store.getFreeCapacity() == 0) {

        //
    }

    // Get the withdraw target

    const withdrawTarget = generalFuncs.findObjectWithId(task.withdrawTargetID)

    // Try to withdraw from the target

    const withdrawResult = creep.advancedWithdraw(withdrawTarget, task.resourceType, task.withdrawAmount)

    // Stop if the withdraw failed

    if (!withdrawResult) return

    // Otherwise

    // Delete the task

    task.delete()

    // Try to find a new task

    const findTaskResult = creep.findTask(new Set([
        'transfer',
        'withdraw',
        'pull'
    ]))

    // If a task was created, try to fulfill it

    if (findTaskResult) creep.fulfillTask()
}

Creep.prototype.fulfillPickupTask = function(task) {

    const creep = this
    const room = creep.room

    creep.say('PUT')

    // If the creep is full

    if (creep.store.getFreeCapacity() == 0) {

        //
    }

    // Get the pickup target

    const pickupTarget = generalFuncs.findObjectWithId(task.resourceID)

    // Try to pickup from the target

    const pickupResult = creep.advancedPickup(pickupTarget)

    // Stop if the pickup failed

    if (!pickupResult) return

    // Otherwise

    // Delete the task

    task.delete()

    // Try to find a new task

    const findTaskResult = creep.findTask(new Set([
        'transfer',
        'withdraw',
        'pull',
        'pickup'
    ]))

    // If a task was created, try to fulfill it

    if (findTaskResult) creep.fulfillTask()
}
