import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { RoomPickupTask, RoomTask, RoomWithdrawTask } from "room/roomTasks"

Creep.prototype.isDying = function() {

    const creep: Creep = this

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // Stop if creep body parts * creep spawn time is more than ticks left alive

    if (creep.ticksToLive > creep.body.length * CREEP_SPAWN_TIME) return false

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

Creep.prototype.advancedHarvestSource = function(source) {

    const creep = this

    const harvestResult = creep.harvest(source)
    if (harvestResult != OK) return harvestResult

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(creep.partsOfType(WORK) * 2, source.energy)
    Memory.energyHarvested += energyHarvested

    creep.say('⛏️' + energyHarvested)

    return OK
}

Creep.prototype.advancedUpgradeController = function() {

    const creep = this
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

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw'
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

Creep.prototype.advancedBuildCSite = function(cSite) {

    const creep = this
    const room = creep.room

    creep.say('ABCS')

    // If the creep needs resources

    if (creep.needsResources()) {

        creep.say('DR')

        // If creep has a task

        if (global[creep.id] && global[creep.id].respondingTaskIDs && global[creep.id].respondingTaskIDs.length > 0) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw'
        ]))

        return false
    }

    // Otherwise if the creep doesn't need resources

    // If the cSite is out of build range

    if (creep.pos.getRangeTo(cSite.pos) > 3) {

        creep.say('MC')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: cSite.pos, range: 3 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })

        // Inform true

        return false
    }

    // Otherwise

    // Try to build the construction site

    const buildResult = creep.build(cSite)

    // If the build worked

    if (buildResult == OK) {

        // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

        const energySpentBuilding = Math.min(creep.partsOfType(WORK) * 5, (cSite.progressTotal - cSite.progress) * BUILD_POWER)

        // Add control points to total controlPoints counter and say the success

        Memory.controlPoints += energySpentBuilding
        creep.say('🚧' + energySpentBuilding * BUILD_POWER)

        // Inform true

        return true
    }

    // Inform failure

    return false
}

Creep.prototype.findRepairTarget = function(workPartCount) {

    const creep = this
    const room = creep.room

    // Get roads and containers in the room

    const repairStructures: (StructureRoad | StructureContainer)[] = room.get('road').concat(room.get('container'))

    // Iterate through repair structures and find inform one if it's worth repairing

    for (const structure of repairStructures) {

        // If the structure is somewhat low on hits, inform it

        if (structure.hitsMax - structure.hits <= workPartCount * REPAIR_POWER * 2) return structure
    }

    // If no ideal structure was found, inform false

    return false
}

Creep.prototype.advancedRepair = function() {

    const creep = this
    const room = creep.room

    creep.say('AR')

    // If the creep needs resources

    if (creep.needsResources()) {

        creep.say('DR')

        // If creep has a task

        if (global[creep.id] && global[creep.id].respondingTaskIDs && global[creep.id].respondingTaskIDs.length > 0) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw'
        ]))

        return false
    }

    // Otherwise if the creep doesn't need resources

    // Get the creep's work part count

    const workPartCount = creep.partsOfType(WORK)

    // Try to get the creep's repair target ID from memory. If it doesn't exist, find a new one

    const repairTargetID = creep.memory.repairTargetID

    // Set the repair target to defineRepairTarget's result

    const repairTarget = defineRepairTarget()

    function defineRepairTarget(): Structure | false {

        // If there is a repair target ID

        if (repairTargetID) {

            // Find the structure with the ID

            const structure = generalFuncs.findObjectWithID(repairTargetID)

            // If the structure exists, inform it

            if (structure) return structure
        }

        // Otherwise inform the results of finding a new target

        return creep.findRepairTarget(workPartCount)
    }

    // Inform false if repair target wasn't defined

    if (!repairTarget) return false

    // Otherwise

    // Add the repair target to memory

    creep.memory.repairTargetID = repairTarget.id

    // If the repairTarget is out of repair range

    if (creep.pos.getRangeTo(repairTarget.pos) > 3) {

        creep.say('MC')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: repairTarget.pos, range: 3 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })

        // Inform true

        return false
    }

    // Otherwise

    // Try to repair the target

    const repairResult = creep.repair(repairTarget)

    // If the build worked

    if (repairResult == OK) {

        // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(workPartCount, (repairTarget.hitsMax - repairTarget.hits) / REPAIR_POWER)

        // Add control points to total controlPoints counter and say the success

        Memory.controlPoints += energySpentOnRepairs
        creep.say('🔧' + energySpentOnRepairs * REPAIR_POWER)

        // Find the hits left on the repairTarget

        const newRepairTargetHits = repairTarget.hits + workPartCount * REPAIR_POWER

        // If the repair target won't be viable to repair next tick

        if (newRepairTargetHits > repairTarget.hitsMax - energySpentOnRepairs * REPAIR_POWER) {

            // Delete the target from memory

            delete creep.memory.repairTargetID

            // Find a new repair target

            const newRepairTarget = creep.findRepairTarget(workPartCount)

            // Inform true if no new target was found

            if (!newRepairTarget) return true

            // If the new repair target is out of repair range

            if (creep.pos.getRangeTo(newRepairTarget.pos) > 3) {

                creep.say('MC')

                // Make a move request to it

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: newRepairTarget.pos, range: 3 },
                    avoidImpassibleStructures: true,
                    avoidEnemyRanges: true,
                })

                // Inform true

                return false
            }
        }

        // Inform true

        return true
    }

    // Inform failure

    return false
}

Creep.prototype.findSourceName = function() {

    const creep = this
    const room = creep.room

    // Sort the room's sourceNames by their range from the anchor

    const sourcesNamesByRangeFromAnchor = (['source1', 'source2'] as ('source1' | 'source2')[]).sort((a, b) => creep.pos.getRangeTo(room.get(a).pos) - creep.pos.getRangeTo(room.get(b).pos))

    // Inform the name of the source with the least sourceHarvesters that can still have sourceHarvesters

    return sourcesNamesByRangeFromAnchor.sort((a, b) => Math.min(room.get(`${a}HarvestPositions`), room.creepsOfSourceAmount[a]) - Math.min(room.get(`${b}HarvestPositions`), room.creepsOfSourceAmount[b]))[0]
}

Creep.prototype.hasPartsOfTypes = function(partTypes) {

    const creep = this

    for (const partType of partTypes) {

        if (creep.body.some(part => part.type == partType)) return true
    }

    return false
}

Creep.prototype.partsOfType = function(type) {

    const creep = this

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

    if (!generalFuncs.arePositionsEqual(creep.memory.goalPos, goalPos)) return true

    // Otherwise inform false

    return false
}

Creep.prototype.createMoveRequest = function(opts) {

    const creep = this
    const room = creep.room

    // If creep can't move, inform false

    if (creep.fatigue > 0) return false

    // If creep is spawning, inform false

    if (creep.spawning) return false

    // If the creep already has a moveRequest, inform false

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

    // Set the creep's pathOpts to reflect this moveRequest's opts

    creep.pathOpts = opts

    // Assign the goal's pos to the creep's goalPos

    creep.memory.goalPos = opts.goal.pos

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

    // If the task is of type pickup

    if (task.type == 'pickup') {

        // Set the pickupAmount to the hauler's free capacity and stop

        (task as RoomPickupTask).pickupAmount = creep.store.getFreeCapacity()
        return
    }
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

        // If the creep is full

        if (creep.store.getFreeCapacity() == 0) {

            // Iterate if the task is of type pickup

            if (task.type == 'pickup') continue

            // Iterate if the task is of type withdraw

            if (task.type == 'withdraw') continue
        }

        // Iterate of there is a requested resourceType and the task doesn't have it

        if (resourceType && task.resourceType != resourceType) continue

        // Accept the task and inform true

        creep.acceptTask(task)
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

Creep.prototype.getPushed = function() {

    const creep = this
    const room = creep.room

    // Create a moveRequest to flee the current position

    const createMoveRequestResult = creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: creep.pos, range: 1 },
        flee: true,
        avoidImpassibleStructures: true,
        avoidEnemyRanges: true,
    })

    // Stop if the moveRequest wasn't created

    if (!createMoveRequestResult) return

    // Otherwise enforce the moveRequest

    creep.runMoveRequest(creep.memory.path[0])
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

    // Get the creep's task

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskIDs[0]]

    // Run the creep's function based on the task type and inform its result

    return creep[functionsForTasks[task.type]](task)
}


Creep.prototype.fulfillPullTask = function(task) {

    const creep = this

    creep.say('PT')

    // Get the task info

    const taskTarget: Creep = generalFuncs.findObjectWithID(task.targetID)

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Create a moveRequest to the target and inform false

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: taskTarget.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })

        return false
    }

    // Otherwise

    // Find the targetPos

    const targetPos = task.targetPos

    // If the creep is not in range of the targetPos

    if (creep.pos.getRangeTo(targetPos) > 0) {

        // Have the creep pull the target and have it move with the creep and inform false

        creep.pull(taskTarget)
        taskTarget.move(creep)

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: targetPos, range: 0 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
        })
        return false
    }

    // Otherwise

    // If the creep is fatigued, inform false

    if (creep.fatigue > 0) return false

    // Otherwise record that the creep is pulling and the taskTarget is getting pulled

    creep.pulling = true
    taskTarget.gettingPulled = true

    // Have the creep move to where the taskTarget pos is

    creep.move(creep.pos.getDirectionTo(taskTarget.pos))

    // Have the creep pull the taskTarget to trade places with the creep

    creep.pull(taskTarget)
    taskTarget.move(creep)

    // Inform true

    return true
}

Creep.prototype.fulfillTransferTask = function(task) {

    const creep = this

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

            // Try to fulfill the new task and inform false

            creep.fulfillTask()
            return false
        }

        // Otherwise try to create a withdraw task from storing structures

        const createTaskResult = creep.createStoringStructureWithdrawTask(task.resourceType, task.transferAmount)

        // If a task was created, try to fulfill it and inform false

        if (createTaskResult) creep.fulfillTask()
        return false
    }

    // Get the transfer target using the task's transfer target IDs

    let transferTarget = generalFuncs.findObjectWithID(task.transferTargetIDs[0])

    // Transfer to the target

    let advancedTransferResult = creep.advancedTransfer(transferTarget, task.resourceType)

    // If the transfer failed, inform false

    if (!advancedTransferResult) return false

    // Otherwise delete the task's ID from the creator that was transfered to

    delete global[task.creatorIDs[0]].createdTaskIDs[task.ID]

    // And remove the transfer target's ID from the task's transfer target IDs

    task.transferTargetIDs.splice(0, 1)

    // Inform true if there are no transfer target left

    if (task.transferTargetIDs.length == 0) return true

    // Otherwise if the creep has made a move request, inform false

    if (creep.moveRequest) return false

    // Otherwise get the next transfer target using the task's transfer target IDs

    transferTarget = generalFuncs.findObjectWithID(task.transferTargetIDs[0])

    // And try to transfer to it

    advancedTransferResult = creep.advancedTransfer(transferTarget, task.resourceType)

    // If the transfer failed, inform false

    if (!advancedTransferResult) return false

    // Otherwise remove the transfer target's ID from the task's transfer target IDs

    task.transferTargetIDs.splice(0, 1)

    // If there are no transfer target left, inform true

    if (task.transferTargetIDs.length == 0) return true

    // Otherwise inform false

    return false
}

Creep.prototype.fulfillWithdrawTask = function(task) {

    const creep = this

    creep.say('WT')

    // If the creep is full

    if (creep.store.getFreeCapacity() == 0) {

        // Try to find a transfer task

        const findTaskResult = creep.findTask(new Set([
            'transfer',
        ]))

        // If the creep found a task

        if (findTaskResult) {

            // Try to fulfill the new task and inform false

            creep.fulfillTask()
            return false
        }

        // Otherwise inform true

        return true
    }

    // Get the withdraw target

    const withdrawTarget = generalFuncs.findObjectWithID(task.withdrawTargetID)

    // Try to withdraw from the target

    const withdrawResult = creep.advancedWithdraw(withdrawTarget, task.resourceType, task.withdrawAmount)

    // If the withdraw failed, inform false

    if (!withdrawResult) return false

    // Otherwise inform true

    return true
}

Creep.prototype.fulfillPickupTask = function(task) {

    const creep = this

    creep.say('PUT')

    // If the creep is full

    if (creep.store.getFreeCapacity() == 0) return true

    // Otherwise get the pickup target

    const pickupTarget = generalFuncs.findObjectWithID(task.resourceID)

    // Try to pickup from the target

    const pickupResult = creep.advancedPickup(pickupTarget)

    // If the pickup failed, inform false

    if (!pickupResult) return false

    // Otherwise inform true

    return true
}
