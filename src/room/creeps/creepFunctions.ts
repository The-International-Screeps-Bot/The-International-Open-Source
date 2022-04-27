import { spawn } from "child_process"
import { constants, CPUBucketRenewThreshold } from "international/constants"
import { arePositionsEqual, customLog, findCreepInQueueMatchingRequest, findObjectWithID, getRange, getRangeBetween, pack, unPackAsRoomPos } from "international/generalFunctions"
import { repeat } from "lodash"
import { RoomOfferTask, RoomPickupTask, RoomTask, RoomTransferTask, RoomWithdrawTask } from "room/roomTasks"

Creep.prototype.isDying = function() {

    const creep = this

    // Inform as dying if creep is already recorded as dying

    if (creep.memory.dying) return true

    // Stop if creep is spawning

    if (!creep.ticksToLive) return false

    // If the creep's remaining ticks are more than the estimated spawn time, inform false

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
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
        return false
    }

    // Try to transfer, recording the result

    const transferResult = creep.transfer(target, resourceType, amount)

    // If the action can be considered a success

    if (transferResult == OK || transferResult == ERR_FULL || transferResult == ERR_NOT_ENOUGH_RESOURCES) {

        // Record that the creep has done the action and inform true

        creep.hasMovedResources = true
        return true
    }

    // Otherwise inform false

    return false
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
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })

        return false
    }

    // Try to withdraw, recording the result

    const withdrawResult = creep.withdraw(target, resourceType, amount)

    // If the action can be considered a success

    if (withdrawResult == OK || withdrawResult == ERR_FULL) {

        // Record that the creep has done the action and inform true

        creep.hasMovedResources = true
        return true
    }

    // Otherwise inform false

    return false
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
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })

        return false
    }

    // Try to pickup. if the action can be considered a success

    if (creep.pickup(target) == OK) {

        // Record that the creep has done the action and inform true

        creep.hasMovedResources = true
        return true
    }

    // Otherwise inform false

    return false
}

Creep.prototype.advancedHarvestSource = function(source) {

    const creep = this

    // Harvest the source, informing the result if it didn't succeed

    if (creep.harvest(source) != OK) return false

    // Record that the creep has worked

    creep.hasWorked = true

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(creep.partsOfType(WORK) * HARVEST_POWER, source.energy)
    Memory.energyHarvested += energyHarvested

    creep.say('⛏️' + energyHarvested)

    // Inform true

    return true
}

Creep.prototype.advancedUpgradeController = function() {

    const creep = this,
    room = creep.room,

    // The the controller

    controller = room.controller,

    // Assign either the controllerLink or controllerContainer as the controllerStructure

    controllerStructure: (StructureLink | StructureContainer | undefined) = room.get('controllerLink') || room.get('controllerContainer')

    creep.say('AUC')

    // If there is a controllerContainer

    if (controllerStructure) {

        // if the creep doesn't have an upgrade pos

        if (!creep.memory.packedUpgradePos) {

            // Get upgrade positions

            const upgradePositions: RoomPosition[] = room.get('upgradePositions'),

            // Get usedUpgradePositions, informing false if they're undefined

            usedUpgradePositions: Set<number> = room.get('usedUpgradePositions')
            if (!usedUpgradePositions) return false

            // Loop through each upgradePositions

            for (const pos of upgradePositions) {

                // Construct the packedPos using pos

                const packedPos = pos.x * 50 + pos.y

                // Iterate if the pos is used

                if (usedUpgradePositions.has(packedPos)) continue

                // Otherwise record packedPos in the creep's memory and in usedUpgradePositions

                creep.memory.packedUpgradePos = packedPos
                usedUpgradePositions.add(packedPos)
                break
            }
        }

        const upgradeControllerResult = creep.upgradeController(controller)

        // Try to upgrade the controller, and if the result is a success

        if (upgradeControllerResult == OK) {

            creep.say('UC')

            // Calculate the control points added

            const controlPoints = creep.partsOfType(WORK)

            // Add control points to total controlPoints counter and say the success

            Memory.controlPoints += controlPoints
            creep.say('🔋' + controlPoints)
        }

        // If packedUpgradePos is out of range

        if (getRangeBetween(creep.pos.x, creep.pos.y, Math.floor(creep.memory.packedUpgradePos / constants.roomDimensions), Math.floor(creep.memory.packedUpgradePos % constants.roomDimensions)) > 0) {

            creep.say('➡️🔋')

            // Make a move request to it

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: new RoomPosition(Math.floor(creep.memory.packedUpgradePos / constants.roomDimensions), Math.floor(creep.memory.packedUpgradePos % constants.roomDimensions), room.name), range: 0 },
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            // Inform false

            return true
        }

        // Otherwise

        // Get the number of work parts for the creep

        const workPartCount = creep.partsOfType(WORK)

        // If the creep has less energy than its workPartCount

        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) <= workPartCount) {

            // Withdraw from the controllerContainer, informing false if the withdraw failed

            if (creep.withdraw(controllerStructure, RESOURCE_ENERGY) != OK) return false
        }

        if (upgradeControllerResult == OK) return true

        // If the controller is a container and is in need of repair

        if (controllerStructure.structureType == STRUCTURE_CONTAINER && controllerStructure.hitsMax - controllerStructure.hits >= workPartCount * REPAIR_POWER * room.creepsFromRoom.controllerUpgrader.length) {

            // Try to repair the controllerContainer

            const repairResult = creep.repair(controllerStructure)

            // If the repair worked

            if (repairResult == OK) {

                // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

                const energySpentOnRepairs = Math.min(workPartCount, (controllerStructure.hitsMax - controllerStructure.hits) / REPAIR_POWER)

                // Add control points to total controlPoints counter and say the success

                Memory.energySpentOnRepairing += energySpentOnRepairs
                creep.say('🔧' + energySpentOnRepairs * REPAIR_POWER)

                // And inform true

                return true
            }
        }

        // Inform true

        return true
    }

    // If the creep needs resources

    if (creep.needsResources()) {

        creep.say('DR')

        // If creep has a task

        if (global[creep.id]?.respondingTaskID) {

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // If the task wasn't fulfilled, inform false

            if (!fulfillTaskResult) return false

            // Otherwise find the task

            const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

            // Delete it and inform false

            task.delete()
            return false
        }

        // Otherwise try to find a new task

        creep.findTask(new Set([
            'pickup',
            'withdraw',
            'offer'
        ]), RESOURCE_ENERGY)

        return false
    }

    // Otherwise if the creep doesn't need resources

    // If the controller is out of upgrade range

    if (creep.pos.getRangeTo(controller.pos) > 3) {

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: controller.pos, range: 3 },
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

    // Stop if the cSite is undefined

    if (!cSite) return false

    creep.say('ABCS')

    const range = getRange(creep.pos.x - cSite.pos.x, creep.pos.y - cSite.pos.y)

    // If the cSite is out of range

    if (range > 1) {

        creep.say('➡️CS')

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: cSite.pos, range: 1 },
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })

        // Inform true if out of range

        if (range > 3) return true
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

    // Inform true

    return true
}

Creep.prototype.findRampartRepairTarget = function(workPartCount) {

    const creep = this,
    room = creep.room,

    // Get the repairTarget using the ID in the creep's memory

    repairTarget: Structure | false = findObjectWithID(creep.memory.repairTarget),

    rampartRepairExpectation = workPartCount * REPAIR_POWER * creep.store.getCapacity() / CARRY_CAPACITY

    // If the repairTarget exists and it's under the quota, it

    if (repairTarget && repairTarget.hits < creep.memory.quota + rampartRepairExpectation) return repairTarget

    // Get ramparts in the room, informing false is there are none

    const ramparts: StructureRampart[] = room.get('rampart')
    if (!ramparts.length) return false

    // Assign the quota to the value of the creep's quota, or its workPartCount times 1000, increasing it each iteration based on the creep's workPartCount

    for (let quota = creep.memory.quota || rampartRepairExpectation; quota < ramparts[0].hitsMax; quota += rampartRepairExpectation) {

        // Filter ramparts thats hits are below the quota, iterating if there are none

        const rampartsUnderQuota = ramparts.filter(r => r.hits < quota)
        if (!rampartsUnderQuota.length) continue

        // Assign the quota to the creep's memory

        creep.memory.quota = quota

        // Find the closest rampart under the quota and inform it

        return creep.pos.findClosestByRange(rampartsUnderQuota)
    }

    // If no rampart was found, inform false

    return false
}

Creep.prototype.findRepairTarget = function(excludedIDs = new Set()) {

    const creep = this,
    room = creep.room,

    // Get roads and containers in the room

    possibleRepairTargets: (StructureRoad | StructureContainer)[] = room.get('road').concat(room.get('container')),

    // Filter viableRepairTargets that are low enough on hits

    viableRepairTargets = possibleRepairTargets.filter(function(structure) {

        // If the structure's ID is to be excluded, inform false

        if (excludedIDs.has(structure.id)) return false

        // Otherwise if the structure is somewhat low on hits, inform true

        return structure.hitsMax * 0.2 >= structure.hits
    })

    creep.say('FRT')

    // If there are no viableRepairTargets, inform false

    if (!viableRepairTargets) return false

    // Inform the closest viableRepairTarget to the creep's memory

    return creep.pos.findClosestByRange(viableRepairTargets)
}

Creep.prototype.findSourceHarvestPos = function(sourceName) {

    const creep = this,
    room = creep.room

    creep.say('FSHP')

    // Stop if the creep already has a packedHarvestPos

    if (creep.memory.packedHarvestPos) return true

    // Define an anchor

    const anchor: RoomPosition = room.anchor || creep.pos,

    // Get usedSourceHarvestPositions

    usedSourceHarvestPositions: Set<number> = room.get('usedSourceHarvestPositions')

    let closestHarvestPos: RoomPosition = room.get(`${sourceName}ClosestHarvestPos`),
    packedPos

    // If the closestHarvestPos exists and isn't being used

    if (closestHarvestPos) {

        packedPos = pack(closestHarvestPos)

        // If the position is unused

        if (!usedSourceHarvestPositions.has(packedPos)) {

            // Assign it as the creep's harvest pos and inform true

            creep.memory.packedHarvestPos = packedPos
            usedSourceHarvestPositions.add(packedPos)

            return true
        }
    }

    // Otherwise get the harvest positions for the source

    const harvestPositions: Pos[] = room.get(`${sourceName}HarvestPositions`),

    openHarvestPositions = harvestPositions.filter(pos => !usedSourceHarvestPositions.has(pack(pos)))
    if (!openHarvestPositions.length) return false

    const creepsClosestHarvestPos = openHarvestPositions.sort((a, b) => getRangeBetween(anchor.x, anchor.y, a.x, a.y) - getRangeBetween(anchor.x, anchor.y, b.x, b.y))[0]

    packedPos = pack(creepsClosestHarvestPos)

    creep.memory.packedHarvestPos = packedPos
    usedSourceHarvestPositions.add(packedPos)

    return true
}

Creep.prototype.findMineralHarvestPos = function() {

    const creep = this,
    room = creep.room

    creep.say('FMHP')

    // Stop if the creep already has a packedHarvestPos

    if (creep.memory.packedHarvestPos) return true

    // Define an anchor

    const anchor: RoomPosition = room.anchor || creep.pos,

    // Get usedMineralHarvestPositions

    usedHarvestPositions: Set<number> = room.get('usedMineralHarvestPositions')

    let closestHarvestPos: RoomPosition = room.get('closestMineralHarvestPos'),
    packedPos = pack(closestHarvestPos)

    // If the closestHarvestPos exists and isn't being used

    if (closestHarvestPos) {

        packedPos = pack(closestHarvestPos)

        // If the position is unused

        if (!usedHarvestPositions.has(packedPos)) {

            // Assign it as the creep's harvest pos and inform true

            creep.memory.packedHarvestPos = packedPos
            usedHarvestPositions.add(packedPos)

            return true
        }
    }

    // Otherwise get the harvest positions for the source

    const harvestPositions: Pos[] = room.get('mineralHarvestPositions'),

    openHarvestPositions = harvestPositions.filter(pos => !usedHarvestPositions.has(pack(pos)))
    if (!openHarvestPositions.length) return false

    const creepsClosestHarvestPos = openHarvestPositions.sort((a, b) => getRangeBetween(anchor.x, anchor.y, a.x, a.y) - getRangeBetween(anchor.x, anchor.y, b.x, b.y))[0]

    packedPos = pack(creepsClosestHarvestPos)

    creep.memory.packedHarvestPos = packedPos
    usedHarvestPositions.add(packedPos)

    return true
}

Creep.prototype.findFastFillerPos = function() {

    const creep = this,
    room = creep.room

    creep.say('FFP')

    // Stop if the creep already has a packedFastFillerPos

    if (creep.memory.packedFastFillerPos) return true

    // Get usedFastFillerPositions

    const usedFastFillerPositions: Set<number> = room.get('usedFastFillerPositions'),

    // Otherwise get the harvest positions for the source

    fastFillerPositions: Pos[] = room.get('fastFillerPositions'),

    openFastFillerPositions = fastFillerPositions.filter(pos => !usedFastFillerPositions.has(pack(pos)))
    if (!openFastFillerPositions.length) return false

    const creepsClosestFastFillerPos = openFastFillerPositions.sort((a, b) => getRangeBetween(creep.pos.x, creep.pos.y, a.x, a.y) - getRangeBetween(creep.pos.x, creep.pos.y, b.x, b.y))[0],

    packedPos = pack(creepsClosestFastFillerPos)

    creep.memory.packedFastFillerPos = packedPos
    usedFastFillerPositions.add(packedPos)

    return true
}

Creep.prototype.hasPartsOfTypes = function(partTypes) {

    const creep = this

    // If the doesn't have any parts of the specified types, inform false

    if (!creep.body.some(part => partTypes.includes(part.type))) return false

    // If the creep has all the parts, inform true

    return true
}

Creep.prototype.partsOfType = function(type) {

    const creep = this

    // Filter body parts that are of a specified type, informing their count

    return creep.body.filter(part => part.type == type).length
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

    if (!arePositionsEqual(creep.memory.goalPos, goalPos)) return true

    // If next pos in the path is not in range, inform true

    if (creep.pos.getRangeTo(creep.memory.path[0]) > 1) return true

    // Otherwise inform false

    return false
}

Creep.prototype.createMoveRequest = function(opts) {

    const creep = this,
    room = creep.room

    // If creep can't move, inform false

    if (creep.fatigue > 0) return false

    // If creep is spawning, inform false

    if (creep.spawning) return false

    // If the creep already has a moveRequest, inform false

    if (creep.moveRequest) return false

    // Assign default opts

    if (!opts.cacheAmount) opts.cacheAmount = 50

    // If there is a path in the creep's memory

    if (creep.memory.path) {

        // So long as the creep isn't standing on the first position in the path

        while (creep.memory.path[0] && arePositionsEqual(creep.pos, creep.memory.path[0])) {

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

        // Assign the creep to the opts

        opts.creep = creep

        // Inform opts to avoid impassible structures

        opts.avoidImpassibleStructures = true

        // Inform opts to avoid stationary positions

        opts.avoidStationaryPositions = true

        // Generate a new path

        path = room.advancedFindPath(opts)

        // Limit the path's length to the cacheAmount

        path.splice(opts.cacheAmount)

        // Set the lastCache to the current tick

        creep.memory.lastCache = Game.time

        // Show that a new path has been created

        if (Memory.roomVisuals) room.visual.text('NP', path[0], { align: 'center', color: constants.colors.lightBlue })

        // So long as the creep isn't standing on the first position in the path

        while (path[0] && arePositionsEqual(creep.pos, path[0])) {

            // Remove the first pos of the path

            path.shift()
        }
    }

    // Stop if there are no positions left in the path

    if (!path.length) return false

    // If visuals are enabled, visualize the path

    if (Memory.roomVisuals) room.pathVisual(path, 'lightBlue')

    // Pack the first pos in the path

    const packedPos = pack(path[0])

    // Add the creep's name to its moveRequest position

    room.moveRequests[packedPos].push(creep.name)

    // Set the creep's pathOpts to reflect this moveRequest's opts

    creep.pathOpts = opts

    // Assign the goal's pos to the creep's goalPos

    creep.memory.goalPos = opts.goal.pos

    // Make moveRequest true to inform a moveRequest has been made

    creep.moveRequest = packedPos

    // Set the path in the creep's memory

    creep.memory.path = path

    // Inform success

    return true
}

Creep.prototype.acceptTask = function(task) {

    const creep = this,
    room = creep.room

    // if there is no global for the creep, make one

    if (!global[creep.id]) global[creep.id] = {}

    // Make the creep's respondingTaskID the task's ID

    global[creep.id].respondingTaskID = task.ID

    // Set the responderID to the creepID

    task.responderID = creep.id

    // And record in the creator that the task now has a responder

    global[task.creatorID].createdTaskIDs[task.ID] = true

    // Add the task to tasksWithResponders

    room.global.tasksWithResponders[task.ID] = task

    // Delete the task from tasksWithoutResponders

    delete room.global.tasksWithoutResponders[task.ID]
}

Creep.prototype.findTask = function(allowedTaskTypes, resourceType = RESOURCE_ENERGY) {

    const creep = this,
    room = creep.room

    // Show the creep is searching for a task

    creep.say('🔍')

    // Get the room's tasks without responders

    const tasks: Record<number, RoomTask> = room.global.tasksWithoutResponders,

    // Convert tasks to an array, then Sort it based on priority and range from the creep

    tasksByPreference = Object.values(tasks).sort(function(a, b) {

        // Inform a's range from the creep - priority - b's range from the creep - priority

        return (getRangeBetween(a.pos / 50, Math.floor(a.pos % 50), creep.pos.x,  creep.pos.y) - a.priority * 5) - (getRangeBetween(b.pos / 50, Math.floor(b.pos % 50), creep.pos.x,  creep.pos.y) - b.priority * 5)
    })

    // Iterate through tasks of tasksByPreference

    for (const task of tasksByPreference) {

        // Iterate if the task's type isn't an allowedTaskType

        if (!allowedTaskTypes.has(task.type)) continue

        // Perform actions based on the task's type

        switch(task.type) {

            // If pull

            case 'pull':

                // Iterate if the creep isn't empty

                if (creep.store.getUsedCapacity(task.resourceType) > 0) continue
                break

            // If pickup

            case 'pickup':

                // Iterate if the creep isn't looking for resources

                if (!creep.needsResources()) continue

                // Iterate if the resourceType doesn't match the requested one

                if (task.resourceType != resourceType) continue

                // Otherwise set the task's taskAmount to the creep's free capacity

                (task as RoomPickupTask).taskAmount = creep.store.getFreeCapacity()

                break

            // If offer

            case 'offer':

                // Iterate if the resourceType doesn't match the requested one

                if (task.resourceType != resourceType) continue

                // Iterate if the creep isn't looking for resources

                if (!creep.needsResources()) continue

                // Otherwise adjust the task's resource minimized to the creep's free capacity

                (task as RoomOfferTask).taskAmount = Math.min(creep.store.getFreeCapacity(), (task as RoomOfferTask).taskAmount)

                break

            // If withdraw

            case 'withdraw':

                // Iterate if the resourceType doesn't match the requested one

                if (task.resourceType != resourceType) continue

                // Iterate if the creep isn't looking for resources

                if (!creep.needsResources()) continue

                // Otherwise adjust the task's resource minimized to the creep's free capacity

                (task as RoomWithdrawTask).taskAmount = Math.min(creep.store.getFreeCapacity(), (task as RoomWithdrawTask).taskAmount)

                break

            // If transfer

            case 'transfer':

                // If the creep isn't full of the requested resourceType and amount, iterate

                if (creep.store.getUsedCapacity(task.resourceType) == 0) continue

                // Iterate if the resourceType doesn't match the requested one

                if (task.resourceType != resourceType) continue

                // Otherwise adjust the task's resource minimized to the creep's used capacity of the requested resource

                (task as RoomTransferTask).taskAmount = Math.min(creep.store.getUsedCapacity(task.resourceType), (task as RoomTransferTask).taskAmount)

                break
        }

        // Accept the task and stop the loop

        creep.acceptTask(task)
        return true
    }

    // Say and inform that the creep found no task

    creep.say('NT')

    return false
}

Creep.prototype.runMoveRequest = function(packedPos) {

    const creep = this,
    room = creep.room

    // If requests are not allowed for this pos, inform false

    if (!room.moveRequests[packedPos]) return false

    // Remove all moveRequests to the position

    room.moveRequests[packedPos] = []
    delete creep.moveRequest

    // Remove record of the creep being on its current position

    room.creepPositions[pack(creep.pos)] = undefined

    // Record the creep at its new position

    room.creepPositions[packedPos] = creep.name

    // Record that the creep has moved this tick

    creep.hasMoved = true

    // Move the creep to the position and inform the result

    return creep.move(creep.pos.getDirectionTo(unPackAsRoomPos(packedPos, room.name))) == OK
}

Creep.prototype.recurseMoveRequest = function(packedPos, queue = []) {

    const creep = this,
    room = creep.room,

    // Try to find the name of the creep at pos

    creepNameAtPos = room.creepPositions[packedPos]

    // If there is no creep at the pos

    if (!creepNameAtPos) {

        // If there are no creeps at the pos, operate the moveRequest

        creep.runMoveRequest(packedPos)

        // Otherwise, loop through each index of the queue

        for (let index = queue.length - 1; index > 0; index--) {

            // Get the creep using the creepName

            const queuedCreep = Game.creeps[queue[index]]

            // Have the creep run its moveRequest

            queuedCreep.runMoveRequest(queuedCreep.moveRequest)
        }

        // And stop

        return
    }

    // Otherwise

    // Get the creepAtPos with the name

    const creepAtPos = Game.creeps[creepNameAtPos]

    //

    if (creepAtPos.hasMoved) return

    // If the creepAtPos has a moveRequest and it's valid

    if (creepAtPos.moveRequest && room.moveRequests[pack(creepAtPos.pos)]) {

        // If the creep's pos and the creepAtPos's moveRequests are aligned

        if (pack(creep.pos) == creepAtPos.moveRequest) {

            // Have the creep move to its moveRequest

            creep.runMoveRequest(packedPos)

            // Have the creepAtPos move to the creepAtPos and stop

            creepAtPos.runMoveRequest(creepAtPos.moveRequest)
            return
        }

        // If the creep's moveRequests aren't aligned

        if (queue.includes(creepAtPos.name)) {

            // Operate the moveRequest

            creep.runMoveRequest(packedPos)

            //

            creepAtPos.recurseMoveRequest(creepAtPos.moveRequest)

            // Loop through each index of the queue

            for (let index = queue.length - 1; index > 0; index--) {

                // Get the creep using the creepName

                const queuedCreep = Game.creeps[queue[index]]

                // Have the creep run its moveRequest

                queuedCreep.runMoveRequest(queuedCreep.moveRequest)
            }

            // And stop

            return
        }

        // Otherwise add the creep to the traffic queue and stop

        queue.push(creep.name)
        creepAtPos.recurseMoveRequest(creepAtPos.moveRequest, queue)
        return
    }

    // Otherwise if creepAtPos is fatigued, stop

    if (creepAtPos.fatigue > 0) return

    // Otherwise the creepAtPos has no moveRequest and isn't fatigued

    // Have the creep move to its moveRequest

    creep.runMoveRequest(packedPos)

    // Have the creepAtPos move to the creep and inform true

    creepAtPos.runMoveRequest(pack(creep.pos))
    return
}

Creep.prototype.getPushed = function() {

    const creep = this
    const room = creep.room

    // Create a moveRequest to flee the current position

    const createMoveRequestResult = creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: creep.pos, range: 1 },
        flee: true,
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })

    // Stop if the moveRequest wasn't created

    if (!createMoveRequestResult) return

    // Otherwise enforce the moveRequest

    creep.runMoveRequest(pack(creep.memory.path[0]))
}

Creep.prototype.needsResources = function() {

    const creep = this

    // If the creep is empty

    if (creep.store.getUsedCapacity() == 0) {

        // Record and inform that the creep needs resources

        creep.memory.needsResources = true
        return true
    }

    // Otherwise if the creep is full

    if (creep.store.getFreeCapacity() == 0) {

        // Record and inform that the creep does not resources

        delete creep.memory.needsResources
        return false
    }

    // Otherwise inform the state of needsResources

    return creep.memory.needsResources
}

Creep.prototype.fulfillTask = function() {

    const creep = this,
    room = creep.room

    creep.say('FT')

    // Get the creep's task

    const task: RoomTask = room.global.tasksWithResponders[global[creep.id].respondingTaskID]

    // If the task is undefined

    if (!task) {

        // Remove it as the creep's task and inform false

        delete global[creep.id].respondingTaskID
        return false
    }

    // If visuals are enabled, show the task targeting

    if (Memory.roomVisuals) room.visual.line(creep.pos, unPackAsRoomPos(task.pos, room.name), { color: constants.colors.lightBlue, width: 0.15 })

    // Run the creep's function based on the task type and inform its result

    return creep[`fulfill${task.type.charAt(0).toUpperCase()}${task.type.slice(1)}Task`](task)
}

Creep.prototype.fulfillPullTask = function(task) {

    const creep = this,
    room = creep.room

    creep.say('PT')

    // Get the task info

    const taskTarget: Creep = findObjectWithID(task.creatorID)

    // If the creep is not close enough to pull the target

    if (creep.pos.getRangeTo(taskTarget.pos) > 1) {

        // Create a moveRequest to the target and inform false

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: taskTarget.pos, range: 1 },
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

    const transferTarget = findObjectWithID(task.creatorID)

    // Inform the result of the adancedTransfer to the transferTarget

    return creep.advancedTransfer(transferTarget, task.resourceType, Math.min(task.taskAmount, Math.min(transferTarget.store.getFreeCapacity(task.resourceType), creep.store.getUsedCapacity(task.resourceType))))
}

Creep.prototype.fulfillOfferTask = function(task) {

    const creep = this,

    // Get the withdraw target

    offerTarget = findObjectWithID(task.creatorID)

    creep.say('OT')

    // Try to withdraw from the target, informing the amount

    return creep.advancedWithdraw(offerTarget, task.resourceType, Math.min(task.taskAmount, Math.min(creep.store.getFreeCapacity(task.resourceType), offerTarget.store.getUsedCapacity(task.resourceType))))
}

Creep.prototype.fulfillWithdrawTask = function(task) {

    const creep = this,
    room = creep.room,

    // Get the withdraw target

    withdrawTarget: AnyStoreStructure | Creep | Tombstone = findObjectWithID(task.creatorID)

    creep.say('WT')

    // If the withdrawTarget is a creep

    if (withdrawTarget instanceof Creep) {

        // Inform the result of the adancedTransfer from the transferTarget

        const transferResult = withdrawTarget.transfer(creep, task.resourceType, Math.min(task.taskAmount, Math.min(creep.store.getFreeCapacity(task.resourceType), withdrawTarget.store.getUsedCapacity(task.resourceType))))

        // creep isn't in range, move to the withdrawTarget

        if (transferResult == ERR_NOT_IN_RANGE) {

            // Create a moveRequest to the target and inform failure

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: withdrawTarget.pos, range: 1 },
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            return false
        }

        // Inform transferResult if the result is acceptable

        return transferResult == OK || transferResult == ERR_FULL || transferResult == ERR_NOT_ENOUGH_RESOURCES
    }

    // Try to withdraw from the target, informing the result

    return creep.advancedWithdraw(withdrawTarget, task.resourceType, Math.min(task.taskAmount, Math.min(creep.store.getFreeCapacity(task.resourceType), withdrawTarget.store.getUsedCapacity(task.resourceType))))
}

Creep.prototype.fulfillPickupTask = function(task) {

    const creep = this

    creep.say('PUT')

    // If the creep is full, inform true

    if (creep.store.getFreeCapacity() == 0) return true

    // Otherwise get the pickup target

    const pickupTarget = findObjectWithID(task.creatorID)

    // Try to pickup from the target, informing the result

    return creep.advancedPickup(pickupTarget)
}

Creep.prototype.advancedSignController = function() {

    const creep = this
    const room = creep.room

    // Construct the signMessage

    let signMessage: string

    // If the room is owned by an enemy or an ally, inform false

    if (room.memory.type == 'ally' || room.memory.type == 'enemy') return false

    // If the room is a commune

    if (room.memory.type == 'commune') {

        // If the room already has a correct sign, inform false

        if (room.controller.sign && constants.communeSigns.includes(room.controller.sign.text)) return false

        // Otherwise assign the signMessage the commune sign

        signMessage = constants.communeSigns[0]
    }

    // Otherwise if the room is not a commune

    else {

        // If the room already has a correct sign, inform false

        if (room.controller.sign && constants.nonCommuneSigns.includes(room.controller.sign.text)) return false

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
            avoidEnemyRanges: true,
            plainCost: 0,
            swampCost: 0,
        })

        return true
    }

    // Otherwise Try to sign the controller, informing the result

    const signResult = creep.signController(room.controller, signMessage)
    return signResult == OK
}

Creep.prototype.isOnExit = function() {

    const creep = this,

    // Define an x and y aligned with the creep's pos

    x = creep.pos.x,
    y = creep.pos.y

    // If the creep is on an exit, inform true. Otherwise inform false

    if (x <= 0 || x >= 49 || y <= 0 || y >= 49) return true
    return false
}

Creep.prototype.findHealPower = function() {

    const creep = this

    // Initialize the healValue

    let healValue = 0

    // Loop through the creep's body

    for (const part of creep.body) {

        // If the part isn't heal, iterate

        if (part.type != HEAL) continue

        // Otherwise increase healValue by heal power * the part's boost

        healValue += HEAL_POWER * BOOSTS[part.type][part.boost][part.type]
    }

    // Inform healValue

    return healValue
}

Creep.prototype.advancedRecycle = function() {

    const creep = this,
    room = creep.room

    // Get the room's spawns, stopping if there are none

    const spawns: StructureSpawn[] = room.get('spawn')
    if (!spawns.length) return

    // Otherwise, find the closest spawn to the creep

    const closestSpawn = creep.pos.findClosestByRange(spawns)

    // If the creep is in range of 1

    if (creep.pos.getRangeTo(closestSpawn.pos) == 1) {

        // Recycle the creep and stop

        creep.say('♻️')

        closestSpawn.recycleCreep(creep)
        return
    }

    // Otherwise, make a move request to it

    creep.say('⏩♻️')

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: closestSpawn.pos, range: 1 },
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })
}

Creep.prototype.advancedRenew = function() {

    const creep = this,
    room = creep.room

    // If there is insufficient CPU to renew, inform false

    if (Game.cpu.bucket < CPUBucketRenewThreshold) return false

    // If the creep's age is less than the benefit from renewing, inform false

    if (CREEP_LIFE_TIME - creep.ticksToLive < Math.ceil(creep.memory.cost / 2.5 / creep.body.length)) return false

    // Get the room's spawns, stopping if there are none

    const spawns: StructureSpawn[] = room.get('spawn')
    if (!spawns.length) return false

    // Get a spawn in range of 1, informing false if there are none

    const spawn = spawns.find(spawn => creep.pos.getRangeTo(spawn.pos) == 1)
    if (!spawn) return false

    // If the spawn has already renewed this tick, inform false

    if (spawn.hasRenewed) return false

    // If the spawn is spawning, inform false

    if (spawn.spawning) return false

    // Otherwise

    // Record the spawn has renewed

    spawn.hasRenewed = true

    // And try to renew the creep, informing the result

    return spawn.renewCreep(creep) == OK
}

Creep.prototype.advancedReserveController = function() {

    const creep = this,
    room = creep.room,

    // Get the controller

    controller = room.controller

    // If the creep is in range of 1 of the controller

    if (creep.pos.getRangeTo(controller.pos) == 1) {

        // If the controller is reserved and it isn't reserved by me

        if (controller.reservation && controller.reservation.username != constants.me) {

            // Try to attack it, informing the result

            creep.say('🗡️')

            return creep.attackController(controller) == OK
        }

        // Try to reserve it, informing the result

        creep.say('🤳')

        return creep.reserveController(controller) == OK
    }

    // Otherwise, make a move request to it and inform true

    creep.say('⏩🤳')

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: controller.pos, range: 1 },
        avoidEnemyRanges: true
    })

    return true
}

Creep.prototype.findStrength = function() {

    const creep = this

    // If the creep already has a recorded strength, inform it

    if (creep.strength) return creep.strength

    creep.strength = 1

    for (const part of creep.body) {

        switch (part.type) {
            case RANGED_ATTACK:
            console.log(JSON.stringify(BOOSTS[part.type]))
                creep.strength += RANGED_ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].rangedAttack : 1)
                break
            case ATTACK:

                creep.strength += ATTACK_POWER * (part.boost ? BOOSTS[part.type][part.boost].attack : 1)
                break
            case HEAL:

                creep.strength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
                break
            case TOUGH:

                creep.strength += 1 + 5 / (part.boost ? BOOSTS[part.type][part.boost].damage : 1)
                break
            default:

                creep.strength++
        }
    }

    // Calculate the strength

    creep.strength += creep.getActiveBodyparts(RANGED_ATTACK) * RANGED_ATTACK_POWER +
        creep.getActiveBodyparts(HEAL) * HEAL_POWER

    // Inform the creep's strength

    return creep.strength
}
