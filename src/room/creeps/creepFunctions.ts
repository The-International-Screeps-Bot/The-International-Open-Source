import { spawn } from 'child_process'
import { allyList, constants, CPUBucketRenewThreshold } from 'international/constants'
import {
     arePositionsEqual,
     customLog,
     findCreepInQueueMatchingRequest,
     findObjectWithID,
     getRange,
     getRangeBetween,
     pack,
     unpackAsPos,
     unpackAsRoomPos,
} from 'international/generalFunctions'
import { repeat } from 'lodash'
import { packCoord, packPos, packPosList, unpackPos, unpackPosList } from 'other/packrat'
import { RoomOfferTask, RoomPickupTask, RoomTask, RoomTransferTask, RoomWithdrawTask } from 'room/roomTasks'
import { creepClasses } from './creepClasses'

Creep.prototype.preTickManager = function () {}

Creep.prototype.isDying = function () {
     // Inform as dying if creep is already recorded as dying

     if (this.memory.dying) return true

     // Stop if creep is spawning

     if (!this.ticksToLive) return false

     // If the creep's remaining ticks are more than the estimated spawn time, inform false

     if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

     // Record creep as dying

     return (this.memory.dying = true)
}

Creep.prototype.advancedTransfer = function (target, resourceType = RESOURCE_ENERGY, amount) {
     const { room } = this

     // If creep isn't in transfer range

     if (this.pos.getRangeTo(target.pos) > 1) {
          // Make a moveRequest to target and inform false

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: target.pos, range: 1 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })
          return false
     }

     // Try to transfer, recording the result

     const transferResult = this.transfer(target, resourceType, amount)

     // If the action can be considered a success

     if (transferResult === OK || transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
          // Record that the creep has done the action and inform true

          this.hasMovedResources = true
          return true
     }

     // Otherwise inform false

     return false
}

Creep.prototype.advancedWithdraw = function (target, resourceType = RESOURCE_ENERGY, amount) {
     const { room } = this

     // If creep isn't in transfer range

     if (this.pos.getRangeTo(target.pos) > 1) {
          // Create a moveRequest to the target and inform failure

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: target.pos, range: 1 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          return false
     }

     // Try to withdraw, recording the result

     const withdrawResult = this.withdraw(target, resourceType, amount)

     // If the action can be considered a success

     if (withdrawResult === OK || withdrawResult === ERR_FULL) {
          // Record that the creep has done the action and inform true

          this.hasMovedResources = true
          return true
     }

     // Otherwise inform false

     return false
}

Creep.prototype.advancedPickup = function (target) {
     const { room } = this

     // If creep isn't in transfer range

     if (this.pos.getRangeTo(target.pos) > 1) {
          // Make a moveRequest to the target and inform failure

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: target.pos, range: 1 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          return false
     }

     // Try to pickup. if the action can be considered a success

     if (this.pickup(target) === OK) {
          // Record that the creep has done the action and inform true

          this.hasMovedResources = true
          return true
     }

     // Otherwise inform false

     return false
}

Creep.prototype.advancedHarvestSource = function (source) {
     // Harvest the source, informing the result if it didn't succeed

     if (this.harvest(source) !== OK) return false

     // Record that the creep has worked

     this.hasWorked = true

     // Find amount of energy harvested and record it in data

     const energyHarvested = Math.min(this.partsOfType(WORK) * HARVEST_POWER, source.energy)
     Memory.stats.energyHarvested += energyHarvested

     this.say(`⛏️${energyHarvested}`)

     // Inform true

     return true
}

Creep.prototype.advancedUpgradeController = function () {
     const { room } = this

     // Assign either the controllerLink or controllerContainer as the controllerStructure

     let controllerStructure: StructureLink | StructureContainer | undefined = room.get('controllerContainer')

     if (!controllerStructure && room.get('hubLink')) controllerStructure = room.get('controllerLink')

     // If there is a controllerContainer

     if (controllerStructure) {
          // if the creep doesn't have an upgrade pos

          if (!this.memory.packedPos) {
               // Get upgrade positions

               const upgradePositions: RoomPosition[] = room.get('upgradePositions')

               // Get usedUpgradePositions, informing false if they're undefined

               const usedUpgradePositions: Set<number> = room.get('usedUpgradePositions')
               if (!usedUpgradePositions) return false

               let packedPos

               // Loop through each upgradePositions

               for (const pos of upgradePositions) {
                    // Construct the packedPos using pos

                    packedPos = pack(pos)

                    // Iterate if the pos is used

                    if (usedUpgradePositions.has(packedPos)) continue

                    // Otherwise record packedPos in the creep's memory and in usedUpgradePositions

                    this.memory.packedPos = packedPos
                    usedUpgradePositions.add(packedPos)
                    break
               }
          }

          if (!this.memory.packedPos) return false

          let say = ``

          const upgradePos = unpackAsRoomPos(this.memory.packedPos, room.name)
          const upgradePosRange = getRange(this.pos.x - upgradePos.x, this.pos.y - upgradePos.y)

          if (upgradePosRange > 0) {
               this.createMoveRequest({
                    origin: this.pos,
                    goal: {
                         pos: upgradePos,
                         range: 0,
                    },
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               say += '➡️'
          }

          const workPartCount = this.partsOfType(WORK)
          const controllerRange = getRange(this.pos.x - room.controller.pos.x, this.pos.y - room.controller.pos.y)

          if (controllerRange <= 3 && this.store.energy > 0) {
               if (this.upgradeController(room.controller) === OK) {
                    this.store.energy -= workPartCount

                    const controlPoints = workPartCount * UPGRADE_CONTROLLER_POWER

                    Memory.stats.controlPoints += controlPoints
                    say += `🔋${controlPoints}`
               }
          }

          const controllerStructureRange = getRange(
               this.pos.x - controllerStructure.pos.x,
               this.pos.y - controllerStructure.pos.y,
          )

          if (controllerStructureRange <= 3) {
               // If the controllerStructure is a container and is in need of repair

               if (
                    this.store.energy > 0 &&
                    controllerStructure.structureType === STRUCTURE_CONTAINER &&
                    controllerStructure.hitsMax - controllerStructure.hits >= workPartCount * REPAIR_POWER
               ) {
                    // If the repair worked

                    if (this.repair(controllerStructure) === OK) {
                         // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

                         const energySpentOnRepairs = Math.min(
                              workPartCount,
                              (controllerStructure.hitsMax - controllerStructure.hits) / REPAIR_POWER,
                         )

                         this.store.energy -= workPartCount

                         // Add control points to total controlPoints counter and say the success

                         Memory.stats.energySpentOnRepairing += energySpentOnRepairs
                         say += `🔧${energySpentOnRepairs * REPAIR_POWER}`
                    }
               }

               if (controllerStructureRange <= 1 && this.store.energy <= 0) {
                    // Withdraw from the controllerContainer, informing false if the withdraw failed

                    if (this.withdraw(controllerStructure, RESOURCE_ENERGY) !== OK) return false

                    this.store.energy += Math.min(this.store.getCapacity(), controllerStructure.store.energy)
                    controllerStructure.store.energy -= this.store.energy

                    say += `⚡`
               }
          }

          this.say(say)
          return true
     }

     // If the creep needs resources

     if (this.needsResources()) {
          this.say('DR')

          // If creep has a task

          if (global[this.id]?.respondingTaskID) {
               // Try to filfill task

               const fulfillTaskResult = this.fulfillTask()

               // If the task wasn't fulfilled, inform false

               if (!fulfillTaskResult) return false

               // Otherwise find the task

               const task: RoomTask = room.global.tasksWithResponders[global[this.id].respondingTaskID]

               // Delete it and inform false

               task.delete()
               return false
          }

          // Otherwise try to find a new task

          this.findTask(new Set(['pickup', 'withdraw', 'offer']), RESOURCE_ENERGY)

          return false
     }

     // Otherwise if the creep doesn't need resources

     // If the controller is out of upgrade range

     if (this.pos.getRangeTo(room.controller.pos) > 3) {
          // Make a move request to it

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: room.controller.pos, range: 3 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          // Inform false

          return false
     }

     // Try to upgrade the controller, and if it worked

     if (this.upgradeController(room.controller) === OK) {
          // Calculate the control points added

          const controlPoints = this.partsOfType(WORK)

          // Add control points to total controlPoints counter and say the success

          Memory.stats.controlPoints += controlPoints
          this.say(`🔋${controlPoints}`)

          // Inform true

          return true
     }

     // Inform false

     return false
}

Creep.prototype.advancedBuildCSite = function (cSite) {
     const { room } = this

     // Stop if the cSite is undefined

     if (!cSite) return false

     this.say('ABCS')

     const range = getRange(this.pos.x - cSite.pos.x, this.pos.y - cSite.pos.y)

     // If the cSite is out of range

     if (range > 3) {
          this.say('➡️CS')

          // Make a move request to it

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: cSite.pos, range: 3 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          return true
     }

     // Otherwise

     // Try to build the construction site

     const buildResult = this.build(cSite)

     // If the build worked

     if (buildResult === OK) {
          // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

          const energySpentOnConstruction = Math.min(
               this.partsOfType(WORK) * BUILD_POWER,
               (cSite.progressTotal - cSite.progress) * BUILD_POWER,
          )

          // Add control points to total controlPoints counter and say the success

          Memory.stats.energySpentOnConstruction += Math.min(
               this.partsOfType(WORK) * BUILD_POWER,
               (cSite.progressTotal - cSite.progress) * BUILD_POWER,
          )
          this.say(`🚧${energySpentOnConstruction}`)

          // Inform true

          return true
     }

     // Inform true

     return true
}

Creep.prototype.findRampartRepairTarget = function (workPartCount) {
     const { room } = this

     // Get the repairTarget using the ID in the creep's memory

     const repairTarget: Structure | false = findObjectWithID(this.memory.repairTarget)

     const rampartRepairExpectation = (workPartCount * REPAIR_POWER * this.store.getCapacity()) / CARRY_CAPACITY

     // If the repairTarget exists and it's under the quota, it

     if (repairTarget && repairTarget.hits < this.memory.quota + rampartRepairExpectation) return repairTarget

     // Get ramparts in the room, informing false is there are none

     const ramparts = room.structures.rampart
     if (!ramparts.length) return false

     // Assign the quota to the value of the creep's quota, or its workPartCount times 1000, increasing it each iteration based on the creep's workPartCount

     for (
          let quota = this.memory.quota || rampartRepairExpectation;
          quota < ramparts[0].hitsMax;
          quota += rampartRepairExpectation
     ) {
          // Filter ramparts thats hits are below the quota, iterating if there are none

          const rampartsUnderQuota = ramparts.filter(r => r.hits < quota)
          if (!rampartsUnderQuota.length) continue

          // Assign the quota to the creep's memory

          this.memory.quota = quota

          // Find the closest rampart under the quota and inform it

          return this.pos.findClosestByRange(rampartsUnderQuota)
     }

     // If no rampart was found, inform false

     return false
}

Creep.prototype.findRepairTarget = function (excludedIDs = new Set()) {
     const { room } = this

     // Get roads and containers in the room

     const possibleRepairTargets: (StructureRoad | StructureContainer)[] = room
          .get('road')
          .concat(room.get('container'))

     // Filter viableRepairTargets that are low enough on hits

     const viableRepairTargets = possibleRepairTargets.filter(function (structure) {
          // If the structure's ID is to be excluded, inform false

          if (excludedIDs.has(structure.id)) return false

          // Otherwise if the structure is somewhat low on hits, inform true

          return structure.hitsMax * 0.2 >= structure.hits
     })

     this.say('FRT')

     // If there are no viableRepairTargets, inform false

     if (!viableRepairTargets.length) return false

     // Inform the closest viableRepairTarget to the creep's memory

     return this.pos.findClosestByRange(viableRepairTargets)
}

Creep.prototype.findOptimalSourceName = function () {
     const { room } = this

     this.say('FOSN')

     // If the creep already has a sourceName, inform true

     if (this.memory.sourceName) return true

     // Get the rooms anchor, if it's undefined inform false

     if (!room.anchor) return false

     // Query usedSourceHarvestPositions to get creepsOfSourceAmount

     room.get('usedSourceHarvestPositions')

     // Otherwise, define source names

     const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

     // Sort them by their range from the anchor

     sourceNames.sort((a, b) => room.anchor.getRangeTo(room.get(a).pos) - room.anchor.getRangeTo(room.get(b).pos))

     // Construct a creep threshold

     let creepThreshold = 1

     // So long as the creepThreshold is less than 4

     while (creepThreshold < 4) {
          // Then loop through the source names and find the first one with open spots

          for (const sourceName of sourceNames) {
               // If there are still creeps needed to harvest a source under the creepThreshold

               if (
                    Math.min(creepThreshold, room.get(`${sourceName}HarvestPositions`).length) -
                         room.creepsOfSourceAmount[sourceName] >
                    0
               ) {
                    // Assign the sourceName to the creep's memory and Inform true

                    this.memory.sourceName = sourceName
                    return true
               }
          }

          // Otherwise increase the creepThreshold

          creepThreshold += 1
     }

     // No source was found, inform false

     return false
}

Creep.prototype.findSourceHarvestPos = function (sourceName) {
     const { room } = this

     this.say('FSHP')

     // Stop if the creep already has a packedHarvestPos

     if (this.memory.packedPos) return true

     // Define an anchor

     const anchor: RoomPosition = room.anchor || this.pos

     // Get usedSourceHarvestPositions

     const usedSourceHarvestPositions: Set<number> = room.get('usedSourceHarvestPositions')

     const closestHarvestPos: RoomPosition = room.get(`${sourceName}ClosestHarvestPos`)
     let packedPos

     // If the closestHarvestPos exists and isn't being used

     if (closestHarvestPos) {
          packedPos = pack(closestHarvestPos)

          // If the position is unused

          if (!usedSourceHarvestPositions.has(packedPos)) {
               // Assign it as the creep's harvest pos and inform true

               this.memory.packedPos = packedPos
               usedSourceHarvestPositions.add(packedPos)

               return true
          }
     }

     // Otherwise get the harvest positions for the source

     const harvestPositions: Pos[] = room.get(`${sourceName}HarvestPositions`)

     const openHarvestPositions = harvestPositions.filter(pos => !usedSourceHarvestPositions.has(pack(pos)))
     if (!openHarvestPositions.length) return false

     openHarvestPositions.sort(
          (a, b) => getRangeBetween(anchor.x, anchor.y, a.x, a.y) - getRangeBetween(anchor.x, anchor.y, b.x, b.y),
     )

     packedPos = pack(openHarvestPositions[0])

     this.memory.packedPos = packedPos
     usedSourceHarvestPositions.add(packedPos)

     return true
}

Creep.prototype.findMineralHarvestPos = function () {
     const { room } = this

     this.say('FMHP')

     // Stop if the creep already has a packedHarvestPos

     if (this.memory.packedPos) return true

     // Define an anchor

     const anchor: RoomPosition = room.anchor || this.pos

     // Get usedMineralHarvestPositions

     const usedHarvestPositions: Set<number> = room.get('usedMineralHarvestPositions')

     const closestHarvestPos: RoomPosition = room.get('closestMineralHarvestPos')
     let packedPos = pack(closestHarvestPos)

     // If the closestHarvestPos exists and isn't being used

     if (closestHarvestPos) {
          packedPos = pack(closestHarvestPos)

          // If the position is unused

          if (!usedHarvestPositions.has(packedPos)) {
               // Assign it as the creep's harvest pos and inform true

               this.memory.packedPos = packedPos
               usedHarvestPositions.add(packedPos)

               return true
          }
     }

     // Otherwise get the harvest positions for the source

     const harvestPositions: Pos[] = room.get('mineralHarvestPositions')

     const openHarvestPositions = harvestPositions.filter(pos => !usedHarvestPositions.has(pack(pos)))
     if (!openHarvestPositions.length) return false

     openHarvestPositions.sort(
          (a, b) => getRangeBetween(anchor.x, anchor.y, a.x, a.y) - getRangeBetween(anchor.x, anchor.y, b.x, b.y),
     )

     packedPos = pack(openHarvestPositions[0])

     this.memory.packedPos = packedPos
     usedHarvestPositions.add(packedPos)

     return true
}

Creep.prototype.findFastFillerPos = function () {
     const { room } = this

     this.say('FFP')

     // Stop if the creep already has a packedFastFillerPos

     if (this.memory.packedPos) return true

     // Get usedFastFillerPositions

     const usedFastFillerPositions: Set<number> = room.get('usedFastFillerPositions')

     // Otherwise get the harvest positions for the source

     const fastFillerPositions: Pos[] = room.get('fastFillerPositions')

     const openFastFillerPositions = fastFillerPositions.filter(pos => !usedFastFillerPositions.has(pack(pos)))
     if (!openFastFillerPositions.length) return false

     openFastFillerPositions.sort(
          (a, b) =>
               getRangeBetween(this.pos.x, this.pos.y, a.x, a.y) - getRangeBetween(this.pos.x, this.pos.y, b.x, b.y),
     )

     const packedPos = pack(openFastFillerPositions[0])

     this.memory.packedPos = packedPos
     usedFastFillerPositions.add(packedPos)

     return true
}

Creep.prototype.hasPartsOfTypes = function (partTypes) {
     // If the doesn't have any parts of the specified types, inform false

     if (!this.body.some(part => partTypes.includes(part.type))) return false

     // If the creep has all the parts, inform true

     return true
}

Creep.prototype.partsOfType = function (type) {
     // Filter body parts that are of a specified type, informing their count

     return this.body.filter(part => part.type === type).length
}

Creep.prototype.needsNewPath = function (goalPos, cacheAmount, path) {
     // Inform true if there is no path

     if (!path) return true

     // Inform true if the path is at its end

     if (path.length === 0) return true

     // Inform true if there is no lastCache value in the creep's memory

     if (!this.memory.lastCache) return true

     // Inform true if the path is out of caching time

     if (this.memory.lastCache + cacheAmount <= Game.time) return true

     // Inform true if the path isn't in the same room as the creep

     if (path[0].roomName !== this.room.name) return true

     if (!this.memory.goalPos) return true

     // Inform true if the creep's previous target isn't its current

     if (!arePositionsEqual(unpackPos(this.memory.goalPos), goalPos)) return true

     // If next pos in the path is not in range, inform true

     if (this.pos.getRangeTo(path[0]) > 1) return true

     // Otherwise inform false

     return false
}

Creep.prototype.createMoveRequest = function (opts) {
     const { room } = this

     // If creep can't move, inform false

     if (this.fatigue > 0) return false

     // If creep is spawning, inform false

     if (this.spawning) return false

     // If the creep already has a moveRequest, inform false

     if (this.moveRequest) return false

     // Assign default opts

     if (!opts.cacheAmount) opts.cacheAmount = 50

     let path: RoomPosition[]

     // If there is a path in the creep's memory

     if (this.memory.path) {
          path = unpackPosList(this.memory.path)

          // So long as the creep isn't standing on the first position in the path

          while (path[0] && arePositionsEqual(this.pos, path[0])) {
               // Remove the first pos of the path

               path.shift()
          }
     }

     // See if the creep needs a new path

     const needsNewPathResult = this.needsNewPath(opts.goal.pos, opts.cacheAmount, path)

     // If the creep need a new path, make one

     if (needsNewPathResult) {
          // Assign the creep to the opts

          opts.creep = this

          // Inform opts to avoid impassible structures

          opts.avoidImpassibleStructures = true

          // Inform opts to avoid stationary positions

          opts.avoidStationaryPositions = true

          opts.avoidNotMyCreeps = true

          // Generate a new path

          path = room.advancedFindPath(opts)

          // Limit the path's length to the cacheAmount

          path.splice(opts.cacheAmount)

          // Set the lastCache to the current tick

          this.memory.lastCache = Game.time

          // Show that a new path has been created

          if (Memory.roomVisuals)
               room.visual.text('NP', path[0], {
                    align: 'center',
                    color: constants.colors.lightBlue,
               })

          // So long as the creep isn't standing on the first position in the path

          while (path[0] && arePositionsEqual(this.pos, path[0])) {
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

     room.moveRequests[packedPos].push(this.name)

     // Set the creep's pathOpts to reflect this moveRequest's opts

     this.pathOpts = opts

     // Assign the goal's pos to the creep's goalPos

     this.memory.goalPos = packPos(opts.goal.pos)

     // Make moveRequest true to inform a moveRequest has been made

     this.moveRequest = packedPos

     // Set the path in the creep's memory

     this.memory.path = packPosList(path)

     // Inform success

     return true
}

Creep.prototype.acceptTask = function (task) {
     const creep = this
     const { room } = creep

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

Creep.prototype.findTask = function (allowedTaskTypes, resourceType = RESOURCE_ENERGY) {
     const creep = this
     const { room } = creep

     // Show the creep is searching for a task

     creep.say('🔍')

     // Get the room's tasks without responders

     const tasks: Record<number, RoomTask> = room.global.tasksWithoutResponders

     // Convert tasks to an array, then Sort it based on priority and range from the creep

     const tasksByPreference = Object.values(tasks).sort(function (a, b) {
          // Inform a's range from the creep - priority - b's range from the creep - priority

          return (
               getRangeBetween(a.pos / 50, Math.floor(a.pos % 50), creep.pos.x, creep.pos.y) -
               a.priority * 5 -
               (getRangeBetween(b.pos / 50, Math.floor(b.pos % 50), creep.pos.x, creep.pos.y) - b.priority * 5)
          )
     })

     // Iterate through tasks of tasksByPreference

     for (const task of tasksByPreference) {
          // Iterate if the task's type isn't an allowedTaskType

          if (!allowedTaskTypes.has(task.type)) continue

          // Perform actions based on the task's type

          switch (task.type) {
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

                    if (task.resourceType !== resourceType)
                         continue

                         // Otherwise set the task's taskAmount to the creep's free capacity
                    ;(task as RoomPickupTask).taskAmount = creep.store.getFreeCapacity()

                    break

               // If offer

               case 'offer':
                    // Iterate if the resourceType doesn't match the requested one

                    if (task.resourceType !== resourceType) continue

                    // Iterate if the creep isn't looking for resources

                    if (!creep.needsResources())
                         continue

                         // Otherwise adjust the task's resource minimized to the creep's free capacity
                    ;(task as RoomOfferTask).taskAmount = Math.min(
                         creep.store.getFreeCapacity(),
                         (task as RoomOfferTask).taskAmount,
                    )

                    break

               // If withdraw

               case 'withdraw':
                    // Iterate if the resourceType doesn't match the requested one

                    if (task.resourceType !== resourceType) continue

                    // Iterate if the creep isn't looking for resources

                    if (!creep.needsResources())
                         continue

                         // Otherwise adjust the task's resource minimized to the creep's free capacity
                    ;(task as RoomWithdrawTask).taskAmount = Math.min(
                         creep.store.getFreeCapacity(),
                         (task as RoomWithdrawTask).taskAmount,
                    )

                    break

               // If transfer

               case 'transfer':
                    // If the creep isn't full of the requested resourceType and amount, iterate

                    if (creep.store.getUsedCapacity(task.resourceType) === 0) continue

                    // Iterate if the resourceType doesn't match the requested one

                    if (task.resourceType !== resourceType)
                         continue

                         // Otherwise adjust the task's resource minimized to the creep's used capacity of the requested resource
                    ;(task as RoomTransferTask).taskAmount = Math.min(
                         creep.store.getUsedCapacity(task.resourceType),
                         (task as RoomTransferTask).taskAmount,
                    )

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

Creep.prototype.shove = function (shoverPos) {
     const { room } = this

     /*
    if (!this.moveRequest) {
 */
     let goalPos: RoomPosition | undefined
     let flee = false

     if (this.memory.goalPos) {
          goalPos = unpackPos(this.memory.goalPos)
     }

     if (!goalPos || getRange(goalPos.x - this.pos.x, goalPos.y - this.pos.y) === 0) {
          goalPos = this.pos
          flee = true
     }

     this.createMoveRequest({
          origin: this.pos,
          goal: { pos: goalPos, range: 1 },
          /* weightGamebjects: { 255: this.room.find(FIND_MY_CREEPS) }, */
          weightPositions: { 255: [shoverPos] },
          flee,
          cacheAmount: 0,
     })

     if (!this.moveRequest) return false

     /*
     this.room.visual.line(this.pos, unpackAsRoomPos(this.moveRequest, this.room.name), { color: constants.colors.yellow })

     return this.runMoveRequest(this.moveRequest)

        return false

 */
     if (Memory.roomVisuals)
          room.visual.line(this.pos, unpackAsRoomPos(this.moveRequest, this.room.name), {
               color: constants.colors.yellow,
          })

     this.recurseMoveRequest(this.moveRequest)

     return true
}

Creep.prototype.runMoveRequest = function (packedPos) {
     const { room } = this

     // If requests are not allowed for this pos, inform false

     if (!room.moveRequests[packedPos]) return false

     const moveResult = this.move(this.pos.getDirectionTo(unpackAsRoomPos(packedPos, room.name))) === OK

     /* room.visual.text(moveResult.toString(), this.pos) */

     if (moveResult) {
          // Remove all moveRequests to the position

          room.moveRequests[packedPos] = []
          delete this.moveRequest

          // Remove record of the creep being on its current position

          room.creepPositions[pack(this.pos)] = undefined

          // Record the creep at its new position

          room.creepPositions[packedPos] = this.name

          // Record that the creep has moved this tick

          this.hasMoved = true
     }

     return moveResult
}

Creep.prototype.recurseMoveRequest = function (packedPos, queue = []) {
     const { room } = this

     // Try to find the name of the creep at pos

     const creepNameAtPos = room.creepPositions[packedPos]

     // If there is no creep at the pos

     if (!creepNameAtPos) {
          // If there are no creeps at the pos, operate the moveRequest

          this.runMoveRequest(packedPos)

          // Otherwise, loop through each index of the queue

          for (let index = queue.length - 1; index > 0; index -= 1) {
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

     // If the creep has already acted on a moveRequest, stop

     if (creepAtPos.hasMoved) return

     // Otherwise if creepAtPos is fatigued, stop

     if (creepAtPos.fatigue > 0) return

     // If the creepAtPos has a moveRequest and it's valid

     if (creepAtPos.moveRequest && room.moveRequests[pack(creepAtPos.pos)]) {
          // If the creep's pos and the creepAtPos's moveRequests are aligned

          if (pack(this.pos) === creepAtPos.moveRequest) {
               // Have the creep move to its moveRequest

               this.runMoveRequest(packedPos)

               // Have the creepAtPos move to the creepAtPos and stop

               creepAtPos.runMoveRequest(creepAtPos.moveRequest)
               return
          }

          // If the creep's moveRequests aren't aligned

          if (queue.includes(creepAtPos.name)) {
               // Operate the moveRequest

               this.runMoveRequest(packedPos)

               //

               creepAtPos.recurseMoveRequest(creepAtPos.moveRequest)

               // Loop through each index of the queue

               for (let index = queue.length - 1; index > 0; index -= 1) {
                    // Get the creep using the creepName

                    const queuedCreep = Game.creeps[queue[index]]

                    // Have the creep run its moveRequest

                    queuedCreep.runMoveRequest(queuedCreep.moveRequest)
               }

               // And stop

               return
          }

          // Otherwise add the creep to the traffic queue and stop

          queue.push(this.name)
          creepAtPos.recurseMoveRequest(creepAtPos.moveRequest, queue)
          return
     }

     // Otherwise the creepAtPos has no moveRequest and isn't fatigued

     if (creepAtPos.shove(this.pos)) {
          this.runMoveRequest(packedPos)
          return
     }

     // Have the creep move to its moveRequest

     this.runMoveRequest(packedPos)

     // Have the creepAtPos move to the creep and inform true

     creepAtPos.runMoveRequest(pack(this.pos))
}

Creep.prototype.getPushed = function () {
     /*
    const creep = this,
        room = creep.room

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
    */
}

Creep.prototype.needsResources = function () {
     // If the creep is empty

     if (this.store.getUsedCapacity() === 0) {
          // Record and inform that the creep needs resources

          this.memory.needsResources = true
          return true
     }

     // Otherwise if the creep is full

     if (this.store.getFreeCapacity() === 0) {
          // Record and inform that the creep does not resources

          delete this.memory.needsResources
          return false
     }

     // Otherwise inform the state of needsResources

     return this.memory.needsResources
}

Creep.prototype.fulfillTask = function () {
     const { room } = this

     this.say('FT')

     // Get the creep's task

     const task: RoomTask = room.global.tasksWithResponders[global[this.id].respondingTaskID]

     // If the task is undefined

     if (!task) {
          // Remove it as the creep's task and inform false

          delete global[this.id].respondingTaskID
          return false
     }

     // If visuals are enabled, show the task targeting

     if (Memory.roomVisuals)
          room.visual.line(this.pos, unpackAsRoomPos(task.pos, room.name), {
               color: constants.colors.lightBlue,
               width: 0.15,
          })

     // Run the creep's function based on the task type and inform its result

     return this[`fulfill${task.type.charAt(0).toUpperCase()}${task.type.slice(1)}Task`](task)
}

Creep.prototype.fulfillPullTask = function (task) {
     const creep = this
     const { room } = creep

     creep.say('PT')

     // Get the task info

     const taskTarget = findObjectWithID(task.creatorID) as Creep

     // If the creep is not close enough to pull the target

     if (creep.pos.getRangeTo(taskTarget.pos) > 1) {
          // Create a moveRequest to the target and inform false

          creep.createMoveRequest({
               origin: creep.pos,
               goal: { pos: taskTarget.pos, range: 1 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          return false
     }

     // Otherwise

     // Find the targetPos

     const { targetPos } = task

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
                    1: room.get('road'),
               },
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

Creep.prototype.fulfillTransferTask = function (task) {
     const creep = this

     creep.say('TT')

     // If the creep is empty of the task resource, inform true

     if (creep.store.getUsedCapacity(task.resourceType) === 0) return true

     // Get the transfer target using the task's transfer target IDs

     const transferTarget = findObjectWithID(task.creatorID) as AnyStoreStructure | Creep | Tombstone

     // Inform the result of the adancedTransfer to the transferTarget

     return creep.advancedTransfer(
          transferTarget,
          task.resourceType,
          Math.min(
               task.taskAmount,
               Math.min(
                    transferTarget.store.getFreeCapacity(task.resourceType),
                    creep.store.getUsedCapacity(task.resourceType),
               ),
          ),
     )
}

Creep.prototype.fulfillOfferTask = function (task) {
     const creep = this

     // Get the withdraw target

     const offerTarget = findObjectWithID(task.creatorID) as AnyStoreStructure | Creep | Tombstone

     creep.say('OT')

     // Try to withdraw from the target, informing the amount

     return creep.advancedWithdraw(
          offerTarget,
          task.resourceType,
          Math.min(
               task.taskAmount,
               Math.min(
                    creep.store.getFreeCapacity(task.resourceType),
                    offerTarget.store.getUsedCapacity(task.resourceType),
               ),
          ),
     )
}

Creep.prototype.fulfillWithdrawTask = function (task) {
     const creep = this
     const { room } = creep

     // Get the withdraw target

     const withdrawTarget = findObjectWithID(task.creatorID) as AnyStoreStructure | Creep | Tombstone

     creep.say('WT')

     // If the withdrawTarget is a creep

     if (withdrawTarget instanceof Creep) {
          // Inform the result of the adancedTransfer from the transferTarget

          const transferResult = withdrawTarget.transfer(
               creep,
               task.resourceType,
               Math.min(
                    task.taskAmount,
                    Math.min(
                         creep.store.getFreeCapacity(task.resourceType),
                         withdrawTarget.store.getUsedCapacity(task.resourceType),
                    ),
               ),
          )

          // creep isn't in range, move to the withdrawTarget

          if (transferResult === ERR_NOT_IN_RANGE) {
               // Create a moveRequest to the target and inform failure

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: withdrawTarget.pos, range: 1 },
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               return false
          }

          // Inform transferResult if the result is acceptable

          return transferResult === OK || transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES
     }

     // Try to withdraw from the target, informing the result

     return creep.advancedWithdraw(
          withdrawTarget,
          task.resourceType,
          Math.min(
               task.taskAmount,
               Math.min(
                    creep.store.getFreeCapacity(task.resourceType),
                    withdrawTarget.store.getUsedCapacity(task.resourceType),
               ),
          ),
     )
}

Creep.prototype.fulfillPickupTask = function (task) {
     const creep = this

     creep.say('PUT')

     // If the creep is full, inform true

     if (creep.store.getFreeCapacity() === 0) return true

     // Otherwise get the pickup target

     const pickupTarget = findObjectWithID(task.creatorID) as Resource

     // Try to pickup from the target, informing the result

     return creep.advancedPickup(pickupTarget)
}

Creep.prototype.advancedSignController = function () {
     const { room } = this

     // Construct the signMessage

     let signMessage: string

     // If the room is owned by an enemy or an ally, inform false

     if (room.memory.type === 'ally' || room.memory.type === 'enemy') return false

     if (room.controller.reservation && room.controller.reservation.username != Memory.me) return false

     // If the room is a commune

     if (room.memory.type === 'commune') {
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

     if (this.pos.getRangeTo(room.controller.pos) > 1) {
          // Request to move to the controller and inform false

          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: room.controller.pos, range: 1 },
               avoidEnemyRanges: true,
               plainCost: 1,
               swampCost: 1,
          })

          if (!this.moveRequest) return false

          return true
     }

     // Otherwise Try to sign the controller, informing the result

     return this.signController(room.controller, signMessage) === OK
}

Creep.prototype.isOnExit = function () {
     // Define an x and y aligned with the creep's pos

     const { x } = this.pos
     const { y } = this.pos

     // If the creep is on an exit, inform true. Otherwise inform false

     if (x <= 0 || x >= 49 || y <= 0 || y >= 49) return true
     return false
}

Creep.prototype.findHealPower = function () {
     // Initialize the healValue

     let healValue = 0

     // Loop through the creep's body

     for (const part of this.body) {
          // If the part isn't heal, iterate

          if (part.type !== HEAL) continue

          // Otherwise increase healValue by heal power * the part's boost

          healValue += HEAL_POWER * BOOSTS[part.type][part.boost][part.type]
     }

     // Inform healValue

     return healValue
}

Creep.prototype.advancedRecycle = function () {
     const { room } = this

     if (!room.structures.spawn.length) return

     this.say('♻️')

     // Otherwise, find the closest spawn to the creep

     const closestSpawn = this.pos.findClosestByRange(room.structures.spawn)

     const fastFillerContainers = (
          [room.get('fastFillerContainerLeft'), room.get('fastFillerContainerRight')] as (
               | StructureContainer
               | undefined
          )[]
     ).filter(function (container) {
          return container && getRange(container.pos.x - closestSpawn.pos.x, container.pos.y - closestSpawn.pos.y) == 1
     })

     if (fastFillerContainers.length) {
          const closestContainer = closestSpawn.pos.findClosestByRange(fastFillerContainers)

          // If the creep is in range of 1

          if (getRange(this.pos.x - closestContainer.pos.x, this.pos.y - closestContainer.pos.y) > 0) {
               this.createMoveRequest({
                    origin: this.pos,
                    goal: { pos: closestContainer.pos, range: 0 },
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                         1: room.get('road'),
                    },
               })

               return
          }
     } else if (this.pos.getRangeTo(closestSpawn.pos) > 1) {
          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: closestSpawn.pos, range: 1 },
               avoidEnemyRanges: true,
               weightGamebjects: {
                    1: room.get('road'),
               },
          })

          return
     }

     closestSpawn.recycleCreep(this)
}

Creep.prototype.advancedRenew = function () {
     const { room } = this

     if (this.body.length > 8) return false

     // If there is insufficient CPU to renew, inform false

     if (Game.cpu.bucket < CPUBucketRenewThreshold) return false

     if (!room.myCreeps.fastFiller.length) return false

     //

     if (this.isDying()) return false

     // If the creep's age is less than the benefit from renewing, inform false

     if (CREEP_LIFE_TIME - this.ticksToLive < Math.ceil(this.findCost() / 2.5 / this.body.length)) return false

     // Get the room's spawns, stopping if there are none

     const spawns: StructureSpawn[] = room.get('spawn')
     if (!spawns.length) return false

     // Get a spawn in range of 1, informing false if there are none

     const spawn = spawns.find(spawn => this.pos.getRangeTo(spawn.pos) === 1)
     if (!spawn) return false

     // If the spawn has already renewed this tick, inform false

     if (spawn.hasRenewed) return false

     // If the spawn is spawning, inform false

     if (spawn.spawning) return false

     // Otherwise

     // Record the spawn has renewed

     spawn.hasRenewed = true

     // And try to renew the creep, informing the result

     return spawn.renewCreep(this) === OK
}

Creep.prototype.advancedReserveController = function () {
     const { room } = this

     // Get the controller

     const { controller } = room

     // If the creep is in range of 1 of the controller

     if (this.pos.getRangeTo(controller.pos) === 1) {
          // If the controller is reserved and it isn't reserved by me

          if (controller.reservation && controller.reservation.username !== Memory.me) {
               // Try to attack it, informing the result

               this.say('🗡️')

               return this.attackController(controller) === OK
          }

          // Try to reserve it, informing the result

          this.say('🤳')

          return this.reserveController(controller) === OK
     }

     // Otherwise, make a move request to it and inform true

     this.say('⏩🤳')

     this.createMoveRequest({
          origin: this.pos,
          goal: { pos: controller.pos, range: 1 },
          avoidEnemyRanges: true,
          plainCost: 1,
     })

     return true
}

Creep.prototype.findHealStrength = function () {
     if (this.healStrength) return this.healStrength

     this.healStrength = 0

     let toughBoost = 0

     for (const part of this.body) {
          if (part.type === TOUGH) {
               toughBoost = Math.max(part.boost ? BOOSTS[part.type][part.boost].damage : 0, toughBoost)
               continue
          }

          if (part.type === HEAL)
               this.healStrength += HEAL_POWER * (part.boost ? BOOSTS[part.type][part.boost].heal : 1)
     }

     this.healStrength += this.healStrength * toughBoost

     return this.healStrength
}

Creep.prototype.findCost = function () {
     let cost = 0

     for (const part of this.body) cost += BODYPART_COST[part.type]

     return cost
}

Creep.prototype.passiveHeal = function () {
     const { room } = this

     this.say('PH')

     // If the creep is below max hits

     if (this.hitsMax > this.hits) {
          // Have it heal itself and stop

          this.heal(this)
          return false
     }

     let top = Math.max(Math.min(this.pos.y - 1, constants.roomDimensions - 2), 2)
     let left = Math.max(Math.min(this.pos.x - 1, constants.roomDimensions - 2), 2)
     let bottom = Math.max(Math.min(this.pos.y + 1, constants.roomDimensions - 2), 2)
     let right = Math.max(Math.min(this.pos.x + 1, constants.roomDimensions - 2), 2)

     // Find adjacent creeps

     const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

     // Loop through each adjacentCreep

     for (const posData of adjacentCreeps) {
          // If the creep is the posData creep, iterate

          if (this.id === posData.creep.id) continue

          // If the creep is not owned and isn't an ally

          if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

          // If the creep is at full health, iterate

          if (posData.creep.hitsMax === posData.creep.hits) continue

          // have the creep heal the adjacentCreep and stop

          this.heal(posData.creep)
          return false
     }

     ;(top = Math.max(Math.min(this.pos.y - 3, constants.roomDimensions - 2), 2)),
          (left = Math.max(Math.min(this.pos.x - 3, constants.roomDimensions - 2), 2)),
          (bottom = Math.max(Math.min(this.pos.y + 3, constants.roomDimensions - 2), 2)),
          (right = Math.max(Math.min(this.pos.x + 3, constants.roomDimensions - 2), 2))

     // Find my creeps in range of creep

     const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

     // Loop through each nearbyCreep

     for (const posData of nearbyCreeps) {
          // If the creep is the posData creep, iterate

          if (this.id === posData.creep.id) continue

          // If the creep is not owned and isn't an ally

          if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

          // If the creep is at full health, iterate

          if (posData.creep.hitsMax === posData.creep.hits) continue

          // have the creep rangedHeal the nearbyCreep and stop

          this.rangedHeal(posData.creep)
          return true
     }

     return false
}

Creep.prototype.aggressiveHeal = function () {
     const { room } = this

     this.say('AH')

     // If the creep is below max hits

     if (this.hitsMax > this.hits) {
          // Have it heal itself and stop

          this.heal(this)
          return false
     }

     const healTargets = room
          .find(FIND_MY_CREEPS)
          .concat(room.allyCreeps)
          .filter(function (creep) {
               return creep.hitsMax > creep.hits
          })

     if (!healTargets.length) return false

     const healTarget = this.pos.findClosestByRange(healTargets)
     const range = getRange(this.pos.x - healTarget.pos.x, this.pos.y - healTarget.pos.y)

     if (range > 1) {
          this.createMoveRequest({
               origin: this.pos,
               goal: { pos: healTarget.pos, range: 1 },
          })

          if (range <= 3) {
               this.rangedHeal(healTarget)
               return true
          }
     }

     this.heal(healTarget)
     return true
}

Creep.prototype.reservationManager = function () {
     let reservation
     let target

     for (let index = 0; index < this.memory.reservations.length; index++) {
          reservation = this.memory.reservations[index]
          target = findObjectWithID(reservation.targetID)

          if (!target) this.memory.reservations.splice(index, 1)

          if (target instanceof Resource) {
               target.amount -= reservation.amount
          } else target.store[reservation.resourceType] -= reservation.amount
     }
}

Creep.prototype.createReservation = function () {}
