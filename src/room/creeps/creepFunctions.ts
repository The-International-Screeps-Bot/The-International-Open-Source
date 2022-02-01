import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { RoomPickupTask, RoomTask, RoomTransferTask, RoomWithdrawTask } from "room/roomTasks"

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

    // If there wasn't an amount provided, assign one based on the smaller of the creep's amount of resource and the target's free amount of resource

    if (!amount) amount = Math.min(creep.store.getUsedCapacity(resourceType), target.store.getFreeCapacity(resourceType))

    // Try to transfer

    const transferResult = creep.transfer(target, resourceType, amount)
    creep.say(`${transferResult}, ${amount}`)
    // Inform the result of the transfer

    return transferResult == OK
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

        if (global[creep.id] && global[creep.id].respondingTaskID) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw'
        ]), RESOURCE_ENERGY)

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

        if (global[creep.id] && global[creep.id].respondingTaskID && global[creep.id].respondingTaskID.length > 0) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID[0]]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw'
        ]), RESOURCE_ENERGY)

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

        Memory.energySpentOnBuilding += energySpentBuilding
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

        if (global[creep.id] && global[creep.id].respondingTaskID) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

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

Creep.prototype.findOptimalSourceName = function() {

    const creep = this
    const room = creep.room

    // If the creep already has a sourceName, inform true

    if (creep.memory.sourceName) return true

    // Get the rooms anchor, if it's undefined inform false

    const anchor = room.get('anchor')
    if (!anchor) return false

    // Otherwise, define source names

    const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

    // Sort them by their range from the anchor

    const sourceNamesByAnchorRange = sourceNames.sort((a, b) => anchor.getRangeTo(room.get(a).pos) - anchor.getRangeTo(room.get(b).pos))

    // Then loop through the source names and find the first one with open spots

    for (const sourceName of sourceNamesByAnchorRange) {

        // If there are still creeps needed to harvest a source

        if (Math.min(3, room.get(`${sourceName}HarvestPositions`).length) - room.creepsOfSourceAmount[sourceName] > 0) {

            // Assign the sourceName to the creep's memory and Inform true

            creep.memory.sourceName = sourceName
            return true
        }
    }

    // No source was found, inform false

    return false
}

Creep.prototype.findHarvestPosition = function() {

    const creep = this
    const room = creep.room

    // Stop if the creep already has a harvestPos

    if (creep.memory.harvestPos) return true

    // Otherwise define the creep's designated source

    const sourceName = creep.memory.sourceName

    // Get the closestHarvestPos for the creep's source

    const closestHarvestPos: Pos = room.get(`${sourceName}ClosestHarvestPosition`)

    // If the closestHarvestPos isn't used, set it as the harvestPos

    if (room.usedHarvestPositions.get(closestHarvestPos.x, closestHarvestPos.y) != 255) {

        // Set it as the harvestPos and inform true

        creep.memory.harvestPos = closestHarvestPos
        return true
    }

    // Otherwise get the harvest positions for the source

    const harvestPositions: Pos[] = room.get(`${sourceName}HarvestPositions`)

    // Loop through each harvest position

    for (const harvestPos of harvestPositions) {

        // If the harvestPos isn't used

        if (room.usedHarvestPositions.get(harvestPos.x, harvestPos.y) != 255) {

            // Set it as the harvestPos and inform true

            creep.memory.harvestPos = harvestPos
            return true
        }
    }

    // No harvestPos was found, inform false

    return false
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

        if (Memory.roomVisuals) room.visual.text('NP', path[0], { align: 'center' })
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

    // Make the creep's respondingTaskID the task's ID

    global[creep.id].respondingTaskID = task.ID

    // Set the responderID to the creepID

    task.responderID = creep.id

    // And record in the creator that the task now has a responder

    global[task.creatorID].createdTaskIDs[task.ID] = true

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

        // Perform actions based on the task's type

        switch(task.type) {

            // If pull

            case 'pull':

            // Iterate if the creep isn't empty

            if (creep.store.getUsedCapacity() > 0) continue
            break

            // If pickup

            case 'pickup':

            // Iterate if the creep is full

            if (creep.store.getFreeCapacity() == 0) continue

            // Otherwise set the task's pickupAmount to the creep's free capacity

            (task as RoomPickupTask).pickupAmount = creep.store.getFreeCapacity()

            break

            // If withdraw

            case 'withdraw':

            // Iterate if the creep is full

            if (creep.store.getFreeCapacity() == 0) continue

            break

            // If transfer

            case 'transfer':

            // If the creep isn't full of the requested resourceType and amount, iterate

            if (creep.store.getUsedCapacity(task.resourceType) < (task as RoomTransferTask).transferAmount) continue

            break
        }

        // Accept the task

        creep.acceptTask(task)
    }

    // Say and inform that the creep found no task

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

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

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

    // If the creep is empty of the task resource, inform true

    if (creep.store.getUsedCapacity(task.resourceType) == 0) return true

    // Get the transfer target using the task's transfer target IDs

    const transferTarget = generalFuncs.findObjectWithID(task.transferTargetID)

    // Inform the result of the adancedTransfer to the transferTarget

    return creep.advancedTransfer(transferTarget, task.resourceType)
}

Creep.prototype.fulfillWithdrawTask = function(task) {

    const creep = this

    creep.say('WT')

    // Get the withdraw target

    const withdrawTarget = generalFuncs.findObjectWithID(task.withdrawTargetID)

    // Try to withdraw from the target, informing the amount

    return creep.advancedWithdraw(withdrawTarget, task.resourceType, task.withdrawAmount)
}

Creep.prototype.fulfillPickupTask = function(task) {

    const creep = this

    creep.say('PUT')

    // If the creep is full

    if (creep.store.getFreeCapacity() == 0) return true

    // Otherwise get the pickup target

    const pickupTarget = generalFuncs.findObjectWithID(task.resourceID)

    // Try to pickup from the target, informing the result

    return creep.advancedPickup(pickupTarget)
}
