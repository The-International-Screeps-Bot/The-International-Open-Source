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

    const creep = this,
    room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Make a moveRequest to target and inform false

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
        return false
    }

    // Try to transfer, recording the result

    const transferResult = creep.transfer(target, resourceType, amount)

    // Inform true if the result is acceptable

    return transferResult == OK || transferResult == ERR_FULL || transferResult == ERR_NOT_ENOUGH_RESOURCES
}

Creep.prototype.advancedWithdraw = function(target, resourceType = RESOURCE_ENERGY, amount) {

    const creep = this,
    room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Create a moveRequest to the target and inform failure

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
        return false
    }

    // Try to withdraw, recording the result

    const withdrawResult = creep.withdraw(target, resourceType, amount)

    // Inform true if the result is acceptable

    return withdrawResult == OK || withdrawResult == ERR_FULL
}

Creep.prototype.advancedPickup = function(target) {

    const creep = this,
    room = creep.room

    // If creep isn't in transfer range

    if (creep.pos.getRangeTo(target.pos) > 1) {

        // Make a moveRequest to the target and inform failure

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })

        return false
    }

    // Try to pickup, informing the result

    return creep.pickup(target) == OK
}

Creep.prototype.advancedHarvestSource = function(source) {

    const creep = this

    // Harvest the source, informing the result if it didn't succeed

    const harvestResult = creep.harvest(source)
    if (harvestResult != OK) return false

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(creep.partsOfType(WORK) * 2, source.energy)
    Memory.energyHarvested += energyHarvested

    creep.say('⛏️' + energyHarvested)

    // Inform true

    return true
}

Creep.prototype.advancedUpgradeController = function() {

    const creep = this
    const room = creep.room

    creep.say('AUC')

    // The the controller

    const controller = room.controller,

    // Get the controllerContainer

    controllerContainer: StructureContainer = room.get('controllerContainer')

    // If there is a controllerContainer

    if (controllerContainer) {

        // If the controllerContainer is out of upgrade range

        if (creep.pos.getRangeTo(controllerContainer.pos) > 1) {

            creep.say('MC')

            // Make a move request to it

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: controllerContainer.pos, range: 1 },
                avoidImpassibleStructures: true,
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            // Inform false

            return false
        }

        // Otherwise

        // Get the number of work parts for the creep

        const workPartCount = creep.partsOfType(WORK)

        // If the creep has less energy than its workPartCount

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < workPartCount) {

            // Withdraw from the controllerContainer

            creep.withdraw(controllerContainer, RESOURCE_ENERGY)
        }

        // Try to upgrade the controller, and if the result is a success

        if (creep.upgradeController(controller) == OK) {

            creep.say('UC')

            // Calculate the control points added

            const controlPoints = creep.partsOfType(WORK)

            // Add control points to total controlPoints counter and say the success

            Memory.controlPoints += controlPoints
            creep.say('🔋' + controlPoints)

            // Inform true

            return true
        }

        // Inform true

        return true
    }

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
            weightGamebjects: {
                1: room.get('road')
            }
        })

        // Inform false

        return false
    }

    // Try to upgrade the controller, and if it worked

    if (creep.upgradeController(controller) == OK) {

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

    const creep = this,
    room = creep.room

    creep.say('ABCS')

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

    // If the cSite is out of build range

    if (creep.pos.getRangeTo(cSite.pos) > 3) {

        creep.say('MC')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: cSite.pos, range: 3 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
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

        const energySpentBuilding = Math.min(creep.partsOfType(WORK) * BUILD_POWER, (cSite.progressTotal - cSite.progress) * BUILD_POWER)

        // Add control points to total controlPoints counter and say the success

        Memory.energySpentOnBuilding += energySpentBuilding
        creep.say('🚧' + energySpentBuilding)

        // Inform true

        return true
    }

    // Inform failure

    return false
}

Creep.prototype.advancedRepair = function() {

    const creep = this,
    room = creep.room

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
        ]), RESOURCE_ENERGY)

        return false
    }

    // Otherwise if the creep doesn't need resources

    // Get the creep's work part count

    const workPartCount = creep.partsOfType(WORK)

    // Try to get the creep's repair target ID from memory. If it doesn't exist, find a new one

    const creatorID = creep.memory.creatorID

    // Set the repair target to defineRepairTarget's result

    const repairTarget = defineRepairTarget()

    function defineRepairTarget(): Structure | false {

        // If there is a repair target ID

        if (creatorID) {

            // Find the structure with the ID

            const structure = generalFuncs.findObjectWithID(creatorID)

            // If the structure exists, inform it

            if (structure) return structure
        }

        // Otherwise find repair targets that don't include the current target

        const newRepairTargets = room.findRepairTargets(workPartCount)

        // Inform false if no targets exist

        if (!newRepairTargets.length) return false

        // Otherwise search and inform the closest newRepairTarget

        return creep.pos.findClosestByRange(newRepairTargets)
    }

    // Inform false if repair target wasn't defined

    if (!repairTarget) return false

    // Otherwise

    // Add the repair target to memory

    creep.memory.creatorID = repairTarget.id

    // If roomVisuals are enabled

    if (Memory.roomVisuals) room.visual.text('🔧', repairTarget.pos)

    // If the repairTarget is out of repair range

    if (creep.pos.getRangeTo(repairTarget.pos) > 3) {

        creep.say('MC')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: repairTarget.pos, range: 3 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })

        // Inform true

        return false
    }

    // Otherwise

    // Try to repair the target

    const repairResult = creep.repair(repairTarget)

    // If the repair worked

    if (repairResult == OK) {

        // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(workPartCount, (repairTarget.hitsMax - repairTarget.hits) / REPAIR_POWER)

        // Add control points to total controlPoints counter and say the success

        Memory.energySpentOnRepairing += energySpentOnRepairs
        creep.say('🔧' + energySpentOnRepairs * REPAIR_POWER)

        // Find the hits left on the repairTarget

        const newRepairTargetHits = repairTarget.hits + workPartCount * REPAIR_POWER

        // If the repair target won't be viable to repair next tick, inform true

        if (repairTarget.hitsMax - newRepairTargetHits >= workPartCount * REPAIR_POWER) return true

        // Otherwise

        // Delete the target from memory

        delete creep.memory.creatorID

        // Find repair targets that don't include the current target

        const newRepairTargets = room.findRepairTargets(workPartCount, new Set([creatorID]))

        // Inform true if no targets exist

        if (!newRepairTargets.length) return true

        // Otherwise search for the closest newRepairTarget

        const newRepairTarget = creep.pos.findClosestByRange(newRepairTargets)

        // Otherwise, if the new repair target is out of repair range

        if (creep.pos.getRangeTo(newRepairTarget.pos) > 3) {

            creep.say('MC')

            // Make a move request to it

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: newRepairTarget.pos, range: 3 },
                avoidImpassibleStructures: true,
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            // Inform true

            return false
        }
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

    // Construct a creep threshold

    let creepThreshold = 1

    // Then loop through the source names and find the first one with open spots

    for (const sourceName of sourceNamesByAnchorRange) {

        // If there are still creeps needed to harvest a source under the creepThreshold

        if (Math.min(creepThreshold, room.get(`${sourceName}HarvestPositions`).length) - room.creepsOfSourceAmount[sourceName] > 0) {

            // Assign the sourceName to the creep's memory and Inform true

            creep.memory.sourceName = sourceName
            return true
        }

        // Otherwise increase the creepThreshold

        creepThreshold++
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

    const closestHarvestPos: Pos = room.get(`${sourceName}ClosestHarvestPos`)

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

    if (creep.memory.lastCache + cacheAmount <= Game.time) return true

    // Inform true if the path isn't in the same room as the creep

    if (creep.memory.path[0].roomName != creep.room.name) return true

    // Inform true if the creep's previous target isn't its current

    if (!generalFuncs.arePositionsEqual(creep.memory.goalPos, goalPos)) return true

    // If next pos in the path is not in range, inform true

    if (creep.pos.getRangeTo(creep.memory.path[0]) > 1) return true

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

        // So long as the creep isn't standing on the first position in the path

        while (creep.memory.path[0] && generalFuncs.arePositionsEqual(creep.pos, creep.memory.path[0])) {

            // Remove the first pos of the path

            creep.memory.path.shift()
        }
    }

    // See if the creep needs a new path

    const needsNewPathResult = creep.needsNewPath(opts.goal.pos, opts.cacheAmount)

    // Set path to the path in the creep's memory

    let path = creep.memory.path

    // If the creep need a new path, make one

    if (needsNewPathResult) {

        opts.creep = creep

        // Generate a new path

        path = room.advancedFindPath(opts)

        // Limit the path's length to the cacheAmount

        path.splice(opts.cacheAmount, path.length)

        // Show that a new path has been created

        if (Memory.roomVisuals) room.visual.text('NP', path[0], { align: 'center' })

        // So long as the creep isn't standing on the first position in the path

        while (path[0] && generalFuncs.arePositionsEqual(creep.pos, path[0])) {

            // Remove the first pos of the path

            path.shift()
        }
    }

    // Stop if there are no positions left in the path

    if (path.length == 0) return false

    // Assign movePos to the first pos in path

    const movePos = path[0]

    // If visuals are enabled, visualize the path

    if (Memory.roomVisuals) room.pathVisual(path, 'lightBlue')

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

Creep.prototype.findTask = function(allowedTaskTypes, resourceType = RESOURCE_ENERGY) {

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

            // Iterate if the resourceType doesn't match the requested one

            if (task.resourceType != resourceType) continue

            // Otherwise set the task's pickupAmount to the creep's free capacity

            (task as RoomPickupTask).pickupAmount = creep.store.getFreeCapacity()

            break

            // If withdraw

            case 'withdraw':

            // Iterate if the resourceType doesn't match the requested one

            if (task.resourceType != resourceType) continue

            // Iterate if the creep is full

            if (creep.store.getFreeCapacity() == 0) continue

            // Otherwise adjust the task's resource minimized to the creep's free capacity

            (task as RoomWithdrawTask).withdrawAmount = Math.min(creep.store.getFreeCapacity(), (task as RoomWithdrawTask).withdrawAmount)

            break

            // If transfer

            case 'transfer':

            // If the creep isn't full of the requested resourceType and amount, iterate

            if (creep.store.getUsedCapacity(task.resourceType) == 0) continue

            // Iterate if the resourceType doesn't match the requested one

            if (task.resourceType != resourceType) continue

            // Otherwise adjust the task's resource minimized to the creep's used capacity of the requested resource

            (task as RoomTransferTask).transferAmount = Math.min(creep.store.getUsedCapacity(task.resourceType), (task as RoomTransferTask).transferAmount)

            break
        }

        // Accept the task and stop the loop

        creep.acceptTask(task)
        break
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

    return creep.move(creep.pos.getDirectionTo(room.newPos(pos))) == OK
}

Creep.prototype.recurseMoveRequest = function(stringPos) {

    const creep = this
    const room = creep.room

    // Find the pos stringPos represents

    const pos: Pos = JSON.parse(stringPos)

    // Try to find the name of the creep at pos

    const creepNameAtPos = room.creepPositions[stringPos]

    // If there is no creep at the pos

    if (!creepNameAtPos) {

        // If there are no creeps at the pos, operate the moveRequest and stop

        creep.runMoveRequest(pos)
        return true
    }

    // Otherwise

    // Get the creep with the name

    const creepAtPos = Game.creeps[creepNameAtPos]

    // If the creepAtPos has a moveRequest

    if (creepAtPos.moveRequest) {

        //
        // Have the creepAtPos move to the creep

        creepAtPos.runMoveRequest(creep.pos)

        // Have the creep move to the creepAtPos and inform true

        creep.runMoveRequest(creepAtPos.pos)
        return true
        /* creepAtPos.recurseMoveRequest(JSON.stringify(creepAtPos.memory.path[0]))
        return true */

        /* // Enforce the creepAtPos's moveRequest

        creepAtPos.runMoveRequest(creepAtPos.memory.path[0])

        // Enforce the creep's moveRequest

        creep.runMoveRequest(creepAtPos.pos) */
    }

    // Otherwise if creepAtPos is fatigued

    if (creepAtPos.fatigue > 0) return false

    // Otherwise have the creeps trade positions

    // Have the creepAtPos move to the creep

    creepAtPos.runMoveRequest(creep.pos)

    // Have the creep move to the creepAtPos and inform true

    creep.runMoveRequest(creepAtPos.pos)
    return true
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
        weightGamebjects: {
            1: room.get('road')
        }
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

    const creep = this,
    room = creep.room

    creep.say('FT')

    // Get the creep's task

    const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

    // Run the creep's function based on the task type and inform its result

    return creep[`fulfill${task.type.charAt(0).toUpperCase()}${task.type.slice(1)}Task`](task)
}

Creep.prototype.fulfillPullTask = function(task) {

    const creep = this,
    room = creep.room

    creep.say('PT')

    // Get the task info

    const taskTarget: Creep = generalFuncs.findObjectWithID(task.creatorID)

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Create a moveRequest to the target and inform false

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: taskTarget.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
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
            weightGamebjects: {
                1: room.get('road')
            }
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

    const transferTarget = generalFuncs.findObjectWithID(task.creatorID)

    // Inform the result of the adancedTransfer to the transferTarget

    return creep.advancedTransfer(transferTarget, task.resourceType, Math.min(task.transferAmount, Math.min(transferTarget.store.getFreeCapacity(task.resourceType), creep.store.getUsedCapacity(task.resourceType))))
}

Creep.prototype.fulfillWithdrawTask = function(task) {

    const creep = this

    creep.say('WT')

    // Get the withdraw target

    const withdrawTarget = generalFuncs.findObjectWithID(task.creatorID)

    // Try to withdraw from the target, informing the amount

    return creep.advancedWithdraw(withdrawTarget, task.resourceType, Math.min(task.withdrawAmount, Math.min(withdrawTarget.store.getFreeCapacity(task.resourceType), creep.store.getUsedCapacity(task.resourceType))))
}

Creep.prototype.fulfillPickupTask = function(task) {

    const creep = this

    creep.say('PUT')

    // If the creep is full, inform true

    if (creep.store.getFreeCapacity() == 0) return true

    // Otherwise get the pickup target

    const pickupTarget = generalFuncs.findObjectWithID(task.creatorID)

    // Try to pickup from the target, informing the result

    return creep.advancedPickup(pickupTarget)
}

Creep.prototype.advancedSignController = function() {

    const creep = this
    const room = creep.room

    // Construct the signMessage

    let signMessage: string

    // If the room is a commune

    if (room.memory.type == 'commune') {

        // If the room already has a correct sign, inform true

        if (room.controller.sign && constants.communeSigns.includes(room.controller.sign.text)) return true

        // Otherwise assign the signMessage the commune sign

        signMessage = constants.communeSigns[0]
    }

    // Otherwise if the room is not a commune

    else {

        // If the room already has a correct sign, inform true

        if (room.controller.sign && constants.nonCommuneSigns.includes(room.controller.sign.text)) return true

        // Otherwise get a rounded random value based on the length of nonCommuneSign

        const randomSign = Math.floor(Math.random() * constants.nonCommuneSigns.length)

        // And assign the message according to the index of randomSign

        signMessage = constants.nonCommuneSigns[randomSign]
    }

    // If the controller is not in range

    if (creep.pos.getRangeTo(room.controller.pos) > 1) {

        // Request to move to the controller and inform false

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: room.controller.pos, range: 1 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            plainCost: 0,
            swampCost: 0,
        })

        return false
    }

    // Otherwise Try to sign the controller, informing the result

    const signResult = creep.signController(room.controller, signMessage)
    return signResult == OK
}
