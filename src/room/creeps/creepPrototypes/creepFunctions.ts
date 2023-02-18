import { spawn } from 'child_process'
import {
    cacheAmountModifier,
    communeSign,
    CPUBucketCapacity,
    CPUBucketRenewThreshold,
    defaultCreepSwampCost,
    defaultPlainCost,
    impassibleStructureTypes,
    customColors,
    nonCommuneSigns,
    quadAttackMemberOffsets,
    roomDimensions,
    TrafficPriorities,
    offsetsByDirection,
    RESULT_FAIL,
    RESULT_ACTION,
    RESULT_SUCCESS,
    RESULT_NO_ACTION,
    RESULT_STOP,
} from 'international/constants'
import {
    areCoordsEqual,
    customLog,
    findClosestObject,
    findClosestPos,
    findCreepInQueueMatchingRequest,
    findObjectWithID,
    findCoordsInsideRect,
    getRange,
    findClosestObjectInRange,
    isXYExit,
    packAsNum,
    unpackNumAsPos,
    packXYAsNum,
    unpackNumAsCoord,
    getRangeOfCoords,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { any, pick, repeat } from 'lodash'
import {
    packCoord,
    packPos,
    packPosList,
    packXYAsCoord,
    unpackCoord,
    unpackCoordAsPos,
    unpackPos,
    unpackPosList,
} from 'other/codec'
import { creepClasses } from '../creepClasses'
import { globalStatsUpdater } from 'international/statsManager'

Creep.prototype.preTickManager = function () {}

Creep.prototype.endTickManager = function () {}

Creep.prototype.advancedTransfer = function (target, resourceType = RESOURCE_ENERGY, amount) {
    // If creep isn't in transfer range

    if (this.pos.getRangeTo(target.pos) > 1) {
        // Make a moveRequest to target and inform false

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            avoidEnemyRanges: true,
        })
        return false
    }

    if (this.movedResource) return false

    // Try to transfer, recording the result

    const transferResult = this.transfer(target, resourceType, amount)
    this.message += transferResult

    // If the action can be considered a success

    if (transferResult === OK || transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
        this.movedResource = true
        return true
    }

    // Otherwise inform false

    return false
}

Creep.prototype.advancedWithdraw = function (target, resourceType = RESOURCE_ENERGY, amount) {
    // If creep isn't in transfer range

    if (this.pos.getRangeTo(target.pos) > 1) {
        // Create a moveRequest to the target and inform failure

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            avoidEnemyRanges: true,
        })

        return false
    }

    if (this.movedResource) return false

    // Try to withdraw, recording the result

    const withdrawResult = this.withdraw(target as any, resourceType, amount)
    this.message += withdrawResult

    // If the action can be considered a success

    if (withdrawResult === OK || withdrawResult === ERR_FULL) {
        this.movedResource = true
        return true
    }

    // Otherwise inform false

    return false
}

Creep.prototype.advancedPickup = function (target) {
    // If creep isn't in transfer range

    if (this.pos.getRangeTo(target.pos) > 1) {
        // Make a moveRequest to the target and inform failure

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            avoidEnemyRanges: true,
        })

        return false
    }

    if (this.movedResource) return false

    const pickupResult = this.pickup(target)
    this.message += pickupResult

    // Try to pickup. if the action can be considered a success

    if (pickupResult === OK || pickupResult === ERR_FULL) {
        this.movedResource = true
        return true
    }

    // Otherwise inform false

    return false
}

Creep.prototype.advancedHarvestSource = function (source) {

    const harvestResult = this.harvest(source)

    // Harvest the source, informing the result if it didn't succeed

    if (harvestResult !== OK) {
        this.message = `⛏️${harvestResult} ${source.index}`
        return false
    }

    // Record that the creep has worked

    this.worked = true

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(this.parts.work * HARVEST_POWER, source.energy)
    this.nextStore.energy += energyHarvested
    this.commune.communeManager.estimatedEnergyIncome += energyHarvested

    globalStatsUpdater(this.room.name, 'eih', energyHarvested)

    this.message = `⛏️${energyHarvested}`
    return true
}

Creep.prototype.findUpgradePos = function () {
    const { room } = this

    if (this.memory.PC) return unpackCoordAsPos(this.memory.PC, room.name)

    // Get usedUpgradeCoords, informing false if they're undefined

    const usedUpgradeCoords = room.usedUpgradeCoords

    // Loop through each upgradePositions

    for (const pos of room.upgradePositions) {
        // Construct the packedPos using pos

        const packedPos = packCoord(pos)

        // Iterate if the pos is used

        if (usedUpgradeCoords.has(packedPos)) continue

        // Otherwise record packedPos in the creep's memory and in usedUpgradeCoords

        this.memory.PC = packedPos
        usedUpgradeCoords.add(packedPos)

        return pos
    }

    return false
}

Creep.prototype.advancedUpgradeController = function () {
    const { room } = this

    // Assign either the controllerLink or controllerContainer as the controllerStructure

    let controllerStructure: StructureLink | StructureContainer | undefined = room.controllerContainer

    const controllerLink = room.controllerLink
    // console.log('structure', controllerStructure, this.name)
    if (!controllerStructure && controllerLink && controllerLink.RCLActionable) controllerStructure = controllerLink

    // If there is a controllerContainer

    if (controllerStructure) {
        const upgradePos = this.findUpgradePos()
        // console.log('pos', upgradePos, this.name)
        if (!upgradePos) return false

        if (getRangeOfCoords(this.pos, upgradePos) > 0) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: upgradePos,
                        range: 0,
                    },
                ],
                avoidEnemyRanges: true,
                weightCostMatrix: 'defaultCostMatrix',
            })

            this.message += '➡️'
        }

        const workPartCount = this.parts.work
        const controllerRange = getRangeOfCoords(this.pos, room.controller.pos)

        if (controllerRange <= 3 && this.nextStore.energy > 0) {
            if (this.upgradeController(room.controller) === OK) {
                this.nextStore.energy -= workPartCount

                const controlPoints = workPartCount * UPGRADE_CONTROLLER_POWER

                globalStatsUpdater(this.room.name, 'eou', controlPoints)
                this.message += `🔋${controlPoints}`
            }
        }

        const controllerStructureRange = getRangeOfCoords(this.pos, controllerStructure.pos)
        if (controllerStructureRange <= 3) {
            // If the controllerStructure is a container and is in need of repair

            if (
                this.nextStore.energy > 0 &&
                controllerStructure.structureType === STRUCTURE_CONTAINER &&
                controllerStructure.hitsMax - controllerStructure.hits >= workPartCount * REPAIR_POWER
            ) {
                // If the repair worked

                if (this.repair(controllerStructure) === OK) {
                    // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

                    const energySpentOnRepairs = Math.min(
                        workPartCount,
                        (controllerStructure.hitsMax - controllerStructure.hits) / REPAIR_POWER,
                        this.nextStore.energy,
                    )

                    this.nextStore.energy -= energySpentOnRepairs

                    // Add control points to total controlPoints counter and say the success

                    globalStatsUpdater(this.room.name, 'eoro', energySpentOnRepairs)
                    this.message += `🔧${energySpentOnRepairs * REPAIR_POWER}`
                }
            }

            if (controllerStructureRange <= 1 && this.nextStore.energy <= 0) {
                // Withdraw from the controllerContainer, informing false if the withdraw failed

                if (this.withdraw(controllerStructure, RESOURCE_ENERGY) !== OK) return false

                this.nextStore.energy += Math.min(this.store.getCapacity(), controllerStructure.nextStore.energy)
                controllerStructure.nextStore.energy -= this.nextStore.energy

                this.message += `⚡`
            }
        }

        return true
    }

    // If the creep needs resources

    if (this.needsResources()) {
        this.runRoomLogisticsRequestsAdvanced({
            types: new Set(['withdraw', 'offer', 'pickup']),
            conditions: request => request.resourceType === RESOURCE_ENERGY,
        })

        if (this.needsResources()) return false

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: room.controller.pos, range: 3 }],
            avoidEnemyRanges: true,
            weightCostMatrix: 'defaultCostMatrix',
        })
        return false
    }

    // Otherwise if the creep doesn't need resources

    // If the controller is out of upgrade range

    if (getRangeOfCoords(this.pos, room.controller.pos) > 3) {
        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: room.controller.pos, range: 3 }],
            avoidEnemyRanges: true,
            weightCostMatrix: 'defaultCostMatrix',
        })

        // Inform false

        return false
    }

    // Try to upgrade the controller, and if it worked

    if (this.upgradeController(room.controller) === OK) {
        // Add control points to total controlPoints counter and say the success

        const energySpentOnUpgrades = Math.min(this.nextStore.energy, this.parts.work * UPGRADE_CONTROLLER_POWER)

        globalStatsUpdater(this.room.name, 'eou', energySpentOnUpgrades)
        this.message = `🔋${energySpentOnUpgrades}`

        // Inform true

        return true
    }

    // Inform false

    return false
}

Creep.prototype.advancedBuild = function () {
    const cSiteTarget = this.room.cSiteTarget
    if (!cSiteTarget) return RESULT_FAIL

    // Try to run catch every situation of results

    if (this.builderGetEnergy() === RESULT_STOP) return RESULT_SUCCESS

    this.advancedBuildCSite(cSiteTarget)

    if (this.builderGetEnergy() === RESULT_STOP) return RESULT_SUCCESS
    return RESULT_SUCCESS
}

Creep.prototype.builderGetEnergy = function () {
    // If there is a sufficient storing structure

    if (this.room.communeManager.buildersMakeRequests) return RESULT_SUCCESS
    if (!this.needsResources()) return RESULT_NO_ACTION

    let conditions
    if (this.room.anchor && this.room.structures.extension.length < 5) {
        // Only get from around the fastFiller

        conditions = (request: RoomLogisticsRequest) => {
            return (
                request.resourceType === RESOURCE_ENERGY &&
                getRangeOfCoords(this.room.anchor, findObjectWithID(request.targetID).pos) <= 2
            )
        }
    } else {
        // Get from anywhere

        conditions = (request: RoomLogisticsRequest) => {
            return request.resourceType === RESOURCE_ENERGY
        }
    }

    // We need energy, find a request

    this.runRoomLogisticsRequestsAdvanced({
        types: new Set(['withdraw', 'offer', 'pickup']),
        conditions: request => request.resourceType === RESOURCE_ENERGY,
    })

    // Don't try to build if we still need resources

    if (this.needsResources()) return RESULT_STOP
    return RESULT_SUCCESS
}

Creep.prototype.advancedBuildCSite = function (cSite) {
    // If the cSite is out of range

    if (getRangeOfCoords(this.pos, cSite.pos) > 3) {
        this.message = '➡️🚧'

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: cSite.pos, range: 3 }],
            avoidEnemyRanges: true,
            weightCostMatrix: 'defaultCostMatrix',
        })

        return RESULT_ACTION
    }

    if (this.worked) return RESULT_NO_ACTION

    // Buld the cSite

    if (this.build(cSite) !== OK) return RESULT_FAIL

    // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

    const energySpentOnConstruction = Math.min(
        this.parts.work * BUILD_POWER,
        (cSite.progressTotal - cSite.progress) * BUILD_POWER,
        this.nextStore.energy,
    )

    this.nextStore.energy -= energySpentOnConstruction

    // Add control points to total controlPoints counter and say the success

    globalStatsUpdater(this.room.name, 'eob', energySpentOnConstruction)
    this.message = `🚧 ` + energySpentOnConstruction

    return RESULT_SUCCESS
}

Creep.prototype.advancedBuildAllyCSite = function () {
    const { room } = this

    // If there is no construction target ID

    if (!room.memory.CSTID) {
        // Try to find a construction target. If none are found, stop

        room.findAllyCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object

    let cSiteTarget = findObjectWithID(room.memory.CSTID)

    // If there is no construction target

    if (!cSiteTarget) {
        // Try to find a construction target. If none are found, stop

        room.findAllyCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object, stopping if it's undefined

    cSiteTarget = findObjectWithID(room.memory.CSTID)

    // Stop if the cSite is undefined

    if (!cSiteTarget) return false

    this.message = 'ABCS'

    // If the cSite is out of range

    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.message = '➡️CS'

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: cSiteTarget.pos, range: 3 }],
            avoidEnemyRanges: true,
            weightCostMatrix: 'defaultCostMatrix',
        })

        return true
    }

    // Otherwise

    // Try to build the construction site

    const buildResult = this.build(cSiteTarget)

    // If the build worked

    if (buildResult === OK) {
        // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

        const energySpentOnConstruction = Math.min(
            this.parts.work * BUILD_POWER,
            (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER,
            this.nextStore.energy,
        )

        this.nextStore.energy -= energySpentOnConstruction

        // Add control points to total controlPoints counter and say the success

        globalStatsUpdater(this.room.name, 'eob', energySpentOnConstruction)
        this.message = `🚧${energySpentOnConstruction}`

        // Inform true

        return true
    }

    // Inform true

    return true
}

Creep.prototype.findNewRampartRepairTarget = function () {
    let lowestScore = Infinity
    let bestTarget

    let ramparts = this.room.enemyAttackers.length ? this.room.defensiveRamparts : this.room.structures.rampart
    for (const structure of ramparts) {
        // If above 90% of max hits

        if (structure.nextHits / structure.hitsMax > 0.9) continue

        const score = getRangeOfCoords(this.pos, structure.pos) + structure.nextHits / 1000

        if (score >= lowestScore) continue

        lowestScore = score
        bestTarget = structure
    }

    if (!bestTarget) return false

    this.memory.repairTarget = bestTarget.id
    return bestTarget
}

Creep.prototype.findNewRepairTarget = function () {
    let possibleRepairTargets: Structure<BuildableStructureConstant>[] = this.room.structures.road
    possibleRepairTargets = possibleRepairTargets.concat(this.room.structures.container)

    let lowestScore = Infinity
    let bestTarget

    for (const structure of possibleRepairTargets) {
        // If above 30% of max hits

        if (structure.nextHits / structure.hitsMax > 0.3) continue

        const score = getRangeOfCoords(this.pos, structure.pos) + (structure.nextHits / structure.hitsMax) * 20
        if (score >= lowestScore) continue

        lowestScore = score
        bestTarget = structure
    }

    if (!bestTarget) return false

    this.memory.repairTarget = bestTarget.id
    return bestTarget
}

Creep.prototype.findRepairTarget = function () {
    if (this.memory.repairTarget) {
        const repairTarget = findObjectWithID(this.memory.repairTarget)
        if (repairTarget) return repairTarget
    }

    return this.findNewRepairTarget() || this.findNewRampartRepairTarget()
}

Creep.prototype.findOptimalSourceIndex = function () {
    const { room } = this

    this.message = 'FOSN'

    if (this.memory.SI !== undefined) return true
    if (!room.anchor) return false

    let creepThreshold = 1

    // So long as the creepThreshold is less than 4

    while (creepThreshold < 4) {
        // Find the first source with open spots

        for (const source of room.sourcesByEfficacy) {
            const index = source.index as 0 | 1

            // If there are still creeps needed to harvest a source under the creepThreshold

            if (Math.min(creepThreshold, room.sourcePositions[index].length) - room.creepsOfSource[index].length > 0) {
                this.memory.SI = index
                return true
            }
        }

        // Otherwise increase the creepThreshold

        creepThreshold += 1
    }

    return false
}

Creep.prototype.findSourcePos = function (index) {
    const { room } = this

    this.message = 'FSHP'

    // Stop if the creep already has a packedHarvestPos

    if (this.memory.PC) return unpackCoordAsPos(this.memory.PC, room.name)

    // Get usedSourceHarvestPositions

    const usedSourceCoords = room.usedSourceCoords[index]

    const openSourcePositions = room.sourcePositions[index].filter(pos => !usedSourceCoords.has(packCoord(pos)))
    if (!openSourcePositions.length) return false

    const packedCoord = packCoord(openSourcePositions[0])

    this.memory.PC = packedCoord
    room._usedSourceCoords[index].add(packedCoord)

    return openSourcePositions[0]
}

Creep.prototype.findMineralHarvestPos = function () {
    const { room } = this

    this.message = 'FMHP'

    // Stop if the creep already has a packedHarvestPos

    if (this.memory.PC) return unpackCoordAsPos(this.memory.PC, room.name)

    // Get usedSourceHarvestPositions

    const usedMineralCoords = room.usedMineralCoords

    const openMineralPositions = room.mineralPositions.filter(pos => !usedMineralCoords.has(packCoord(pos)))
    if (!openMineralPositions.length) return false

    const packedCoord = packCoord(openMineralPositions[0])

    this.memory.PC = packedCoord
    room._usedMineralCoords.add(packedCoord)

    return openMineralPositions[0]
}

Creep.prototype.needsResources = function () {
    // If the creep is empty

    if (this.usedNextStore === 0) return (this.memory.NR = true)
    // Otherwise if the creep is full
    else if (this.freeNextStore <= 0) {
        delete this.memory.NR
        return false
    } else {
        // Otherwise keep it the same

        return this.memory.NR
    }
}

Creep.prototype.hasNonEnergyResource = function () {
    return !!Object.keys(this.nextStore).find(resourceType => resourceType !== RESOURCE_ENERGY)
}

Creep.prototype.findRecycleTarget = function () {
    const { room } = this

    const spawns = room.structures.spawn.filter(spawn => spawn.RCLActionable)

    if (!spawns.length) return false

    if (this.memory.RecT) {
        const spawn = findObjectWithID(this.memory.RecT)
        if (spawn) return spawn
    }

    const fastFillerContainers = [room.fastFillerContainerLeft, room.fastFillerContainerRight]

    for (const container of fastFillerContainers) {
        if (!container) continue

        // If there is no spawn adjacent to the container

        if (!findClosestObjectInRange(container.pos, spawns, 1)) continue

        return findObjectWithID((this.memory.RecT = container.id))
    }

    // Find the closest spawn to the creep

    const spawn = findClosestObject(this.pos, spawns)

    return findObjectWithID((this.memory.RecT = spawn.id))
}

Creep.prototype.advancedRecycle = function () {
    const { room } = this

    const recycleTarget = this.findRecycleTarget()
    if (!recycleTarget) return false

    const range = getRange(this.pos.x, recycleTarget.pos.x, this.pos.y, recycleTarget.pos.y)

    // If the target is a spawn

    if (recycleTarget instanceof StructureSpawn) {
        this.message = '♻️ S'

        // If the recycleTarget is out of actionable range, move to it

        if (range > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: recycleTarget.pos, range: 1 }],
                avoidEnemyRanges: true,
            })

            return true
        }

        // If the recycleTarget is a spawn, directly recycle

        return recycleTarget.recycleCreep(this) === OK
    }

    // Otherwise if the target is a container

    this.message = '♻️ C'

    if (range === 0) {
        const spawn = findClosestObject(this.pos, room.structures.spawn)

        return spawn.recycleCreep(this) === OK
    }

    // If the recycleTarget is out of actionable range, move to it

    this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: recycleTarget.pos, range: 0 }],
        avoidEnemyRanges: true,
    })

    return true
}

Creep.prototype.activeRenew = function () {
    const { room } = this

    // If there is insufficient CPU to renew, inform false

    if (Game.cpu.bucket < CPUBucketRenewThreshold) return
    if (!room.myCreeps.fastFiller.length) return
    if (this.dying) return

    // If the creep's age is less than the benefit from renewing, inform false

    const energyCost = Math.ceil(this.findCost() / 2.5 / this.body.length)
    if (CREEP_LIFE_TIME - this.ticksToLive < Math.floor(600 / this.body.length)) return

    const spawns = room.structures.spawn
    if (!spawns.length) return

    const spawn = findClosestObject(this.pos, spawns)
    if (spawn.renewed) return
    if (spawn.spawning) return

    if (getRangeOfCoords(this.pos, spawn.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: spawn.pos, range: 1 }],
            avoidEnemyRanges: true,
        })
        return
    }

    const result = spawn.renewCreep(this)
    if (result === OK) {
        globalStatsUpdater(this.room.name, 'eosp', energyCost)
        spawn.renewed = true
    }
}

Creep.prototype.passiveRenew = function () {
    const { room } = this

    // If there is insufficient CPU to renew, inform false

    if (Game.cpu.bucket < CPUBucketRenewThreshold) return
    if (!room.myCreeps.fastFiller.length) return
    if (this.dying) return

    // If the creep's age is less than the benefit from renewing, inform false

    const energyCost = Math.ceil(this.findCost() / 2.5 / this.body.length)
    if (CREEP_LIFE_TIME - this.ticksToLive < Math.floor(600 / this.body.length)) return

    // Get the room's spawns, stopping if there are none

    const spawns = room.structures.spawn

    // Get a spawn in range of 1, informing false if there are none

    const spawn = spawns.find(
        spawn =>
            getRange(this.pos.x, spawn.pos.x, this.pos.y, spawn.pos.y) === 1 &&
            !spawn.renewed &&
            !spawn.spawning &&
            spawn.RCLActionable,
    )
    if (!spawn) return

    const result = spawn.renewCreep(this)
    if (result === OK) {
        globalStatsUpdater(this.room.name, 'eosp', energyCost)
        spawn.renewed = true
    }
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

            this.message = '🗡️'

            return this.attackController(controller) === OK
        }

        // Try to reserve it, informing the result

        this.message = '🤳'

        return this.reserveController(controller) === OK
    }

    // Otherwise, make a move request to it and inform true

    this.message = '⏩🤳'

    this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: controller.pos, range: 1 }],
        avoidEnemyRanges: true,
        plainCost: 1,
    })

    return true
}

Creep.prototype.findCost = function () {
    let cost = 0

    for (const part of this.body) cost += BODYPART_COST[part.type]

    return cost
}

Creep.prototype.passiveHeal = function () {
    const { room } = this

    this.message = 'PH'

    if (!this.worked) {
        // If the creep is below max hits

        if (this.hitsMax > this.hits) {
            // Have it heal itself and stop

            this.heal(this)
            this.worked = true
            return false
        }

        let top = Math.max(Math.min(this.pos.y - 1, roomDimensions - 1), 0)
        let left = Math.max(Math.min(this.pos.x - 1, roomDimensions - 1), 0)
        let bottom = Math.max(Math.min(this.pos.y + 1, roomDimensions - 1), 0)
        let right = Math.max(Math.min(this.pos.x + 1, roomDimensions - 1), 0)

        // Find adjacent creeps

        const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

        // Loop through each adjacentCreep

        for (const posData of adjacentCreeps) {
            // If the creep is the posData creep, iterate

            if (this.name === posData.creep.name) continue

            // If the creep is not owned and isn't an ally

            if (!posData.creep.my && !Memory.allyPlayers.includes(posData.creep.owner.username)) continue

            // If the creep is at full health, iterate

            if (posData.creep.hitsMax === posData.creep.hits) continue

            // have the creep heal the adjacentCreep and stop

            this.heal(posData.creep)
            this.worked = true
            return false
        }
    }

    if (this.ranged) return false

    let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 2), 2)
    let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 2), 2)
    let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 2), 2)
    let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 2), 2)

    // Find my creeps in range of creep

    const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

    // Loop through each nearbyCreep

    for (const posData of nearbyCreeps) {
        // If the creep is the posData creep, iterate

        if (this.name === posData.creep.name) continue

        // If the creep is not owned and isn't an ally

        if (!posData.creep.my && !Memory.allyPlayers.includes(posData.creep.owner.username)) continue

        // If the creep is at full health, iterate

        if (posData.creep.hitsMax === posData.creep.hits) continue

        // have the creep rangedHeal the nearbyCreep and stop

        this.rangedHeal(posData.creep)
        this.ranged = true
        return true
    }

    return false
}

Creep.prototype.aggressiveHeal = function () {
    const { room } = this

    this.message = 'AH'

    if (!this.worked) {
        // If the creep is below max hits

        if (this.hitsMax > this.hits) {
            // Have it heal itself and stop

            this.heal(this)
            this.worked = true
            return true
        }
    }

    const healTargets = room
        .find(FIND_MY_CREEPS)
        .concat(room.allyCreeps)
        .filter(function (creep) {
            return creep.hitsMax > creep.hits
        })

    if (!healTargets.length) return false

    const healTarget = findClosestObject(this.pos, healTargets)
    const range = getRange(this.pos.x, healTarget.pos.x, this.pos.y, healTarget.pos.y)

    if (range > 1) {
        if (this.ranged) return false

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: healTarget.pos, range: 1 }],
        })

        if (range <= 3) {
            this.rangedHeal(healTarget)
            return true
        }
    }

    if (this.worked) return false

    this.heal(healTarget)
    return true
}

Creep.prototype.passiveRangedAttack = function () {
    return true
}

Creep.prototype.findBulzodeTargets = function (goalPos) {
    return []
}

Creep.prototype.findQuadBulldozeTargets = function (goalPos) {
    if (this.memory.QBTIDs && this.memory.QBTIDs.length) return this.memory.QBTIDs

    const path = this.room.advancedFindPath({
        origin: this.pos,
        goals: [
            {
                pos: goalPos,
                range: 0,
            },
        ],
        weightCostMatrixes: ['quadBulldozeCostMatrix'],
    })

    path.push(goalPos)

    const targetStructureIDs: Set<Id<Structure>> = new Set()
    const visitedCoords: Set<string> = new Set()

    for (const pos of path) {
        for (let i = quadAttackMemberOffsets.length - 1; i > -1; i--) {
            const offset = quadAttackMemberOffsets[i]
            const coord = {
                x: pos.x + offset.x,
                y: pos.y + offset.y,
            }
            const packedCoord = packCoord(coord)
            if (visitedCoords.has(packedCoord)) continue

            visitedCoords.add(packedCoord)

            for (const structure of this.room.lookForAt(LOOK_STRUCTURES, coord.x, coord.y)) {
                if (structure.structureType === STRUCTURE_KEEPER_LAIR) continue

                if (
                    !impassibleStructureTypes.includes(structure.structureType) &&
                    structure.structureType !== STRUCTURE_RAMPART
                )
                    continue

                if (targetStructureIDs.has(structure.id)) continue

                targetStructureIDs.add(structure.id)
            }
        }
    }

    return (this.memory.QBTIDs = Array.from(targetStructureIDs))
}

Creep.prototype.manageSpawning = function (spawn: StructureSpawn) {
    if (spawn.spawning.remainingTime > 1 || spawn.spawning.name.includes('shard')) return

    const offset = offsetsByDirection[spawn.spawning.directions[0]]
    const coord = {
        x: this.pos.x + offset[0],
        y: this.pos.y + offset[1],
    }

    this.assignMoveRequest(coord)
}

Creep.prototype.roomLogisticsRequestManager = function () {
    if (!this.memory.RLRs) {
        this.memory.RLRs = []
        return
    }
    if (!this.memory.RLRs.length) return

    for (let i = this.memory.RLRs.length - 1; i >= 0; i--) {
        const request = this.memory.RLRs[i]
        const target = findObjectWithID(request.TID)
        if (target) continue

        this.memory.RLRs.splice(i, 1)
    }

    const request = this.memory.RLRs[0]
    if (!request) return

    const target = findObjectWithID(request.TID)

    // Pickup type

    if (target instanceof Resource) {
        // Update in accordance to potential resource decay

        request.A = Math.min(Math.min(this.freeNextStore, target.nextAmount), request.A)
        if (request.A <= 0) {
            this.memory.RLRs.splice(0, 1)
            return
        }

        if (!request.NR) target.reserveAmount -= request.A
        return
    }

    if (request.T === 'transfer') {
        // Delete the request if the target is fulfilled

        if (target.freeNextStore < request.A) {
            this.memory.RLRs.splice(0, 1)
            return
        }

        request.A = Math.min(Math.min(this.nextStore[request.RT], target.freeNextStore), request.A)
        if (request.A <= 0) {
            this.memory.RLRs.splice(0, 1)
            return
        }

        if (!request.NR) target.reserveStore[request.RT] += request.A
        return
    }

    // Withdraw or offer type

    // Delete the request if the target doesn't have what we need

    if (target.nextStore[request.RT] < request.A) {
        this.memory.RLRs.splice(0, 1)
        return
    }

    request.A = Math.min(Math.min(this.freeNextStore, target.nextStore[request.RT]), request.A)
    if (request.A <= 0) {
        this.memory.RLRs.splice(0, 1)
        return
    }

    if (!request.NR) target.reserveStore[request.RT] -= request.A
}

Creep.prototype.findRoomLogisticsRequest = function (args) {
    if (this.memory.RLRs[0]) return this.memory.RLRs[0]

    delete this.noDelivery

    const types = this.findRoomLogisticsRequestTypes(args)
    if (!types.size) return RESULT_FAIL

    let lowestScore = Infinity
    let bestRequest: RoomLogisticsRequest | 0

    for (const type of types) {
        for (const requestID in this.room.roomLogisticsRequests[type]) {
            const request = this.room.roomLogisticsRequests[type][requestID]

            delete request.delivery

            // Customizable conditions

            if (args) {
                if (args.resourceTypes && !args.resourceTypes.has(request.resourceType)) continue
                if (args.conditions && !args.conditions(request)) continue
            }

            // Default conditions

            if (!this.canAcceptRoomLogisticsRequest(request.type, request.ID)) continue

            const targetPos = findObjectWithID(request.targetID).pos
            const score = request.priority + getRangeOfCoords(targetPos, this.pos) / 100

            if (score >= lowestScore) continue

            lowestScore = score
            bestRequest = request
        }
    }
    /*
    customLog('FINDING REQ', bestRequest + ', ' + Array.from(types), { superPosition: 1 })
 */
    let creepRequest: CreepRoomLogisticsRequest | 0

    if (!bestRequest) {
        creepRequest = this.createBackupStoringStructuresRoomLogisticsRequest(types, args?.resourceTypes)
        if (!creepRequest) return RESULT_FAIL
    } else {
        creepRequest = {
            T: bestRequest.type,
            TID: bestRequest.targetID,
            RT: bestRequest.resourceType,
            A: this.findRoomLogisticRequestAmount(bestRequest),
            NR: bestRequest.noReserve,
        }

        if (bestRequest.delivery) {
            let nextCreepRequest: CreepRoomLogisticsRequest
            const storingStructure = findObjectWithID(bestRequest.delivery as Id<AnyStoreStructure>)

            if (storingStructure) {
                nextCreepRequest = {
                    T: 'withdraw',
                    TID: storingStructure.id,
                    RT: bestRequest.resourceType,
                    A: Math.min(storingStructure.reserveStore[bestRequest.resourceType], creepRequest.A),
                }
            } else {
                const nextRequest =
                    this.room.roomLogisticsRequests.withdraw[bestRequest.delivery] ||
                    this.room.roomLogisticsRequests.offer[bestRequest.delivery] ||
                    this.room.roomLogisticsRequests.pickup[bestRequest.delivery]

                nextCreepRequest = {
                    T: nextRequest.type,
                    TID: nextRequest.targetID,
                    RT: nextRequest.resourceType,
                    A: this.freeNextStore,
                    NR: creepRequest.NR,
                }

                if (!creepRequest.NR) {
                    if (nextRequest.amount === nextCreepRequest.A)
                        delete this.room.roomLogisticsRequests[nextRequest.type][nextRequest.ID]
                    else nextRequest.amount -= nextCreepRequest.A

                    const target = findObjectWithID(nextRequest.targetID)

                    // Pickup type

                    if (target instanceof Resource) {
                        target.reserveAmount -= nextCreepRequest.A
                    } else {
                        // Withdraw or offer type

                        target.reserveStore[nextCreepRequest.RT] -= nextCreepRequest.A
                    }
                }
            }

            this.memory.RLRs.push(nextCreepRequest)
        }

        // Delete the request if it has no more utility

        if (!creepRequest.NR && bestRequest.amount === creepRequest.A)
            delete this.room.roomLogisticsRequests[bestRequest.type][bestRequest.ID]
        else bestRequest.amount -= creepRequest.A
    }

    this.memory.RLRs.push(creepRequest)
    if (creepRequest.NR) return this.memory.RLRs[0]

    const target = findObjectWithID(creepRequest.TID)

    // Pickup type

    if (target instanceof Resource) {
        target.reserveAmount -= creepRequest.A

        return this.memory.RLRs[0]
    }

    if (creepRequest.T === 'transfer') {
        target.reserveStore[creepRequest.RT] += creepRequest.A

        return this.memory.RLRs[0]
    }

    // Withdraw or offer type

    target.reserveStore[creepRequest.RT] -= creepRequest.A

    return this.memory.RLRs[0]
}

Creep.prototype.findRoomLogisticsRequestTypes = function (args) {
    if (args && args.types) {
        if (args.types.has('transfer') && this.hasNonEnergyResource()) {
            this.noDelivery = true
            return new Set(['transfer'])
        }

        // Make sure we have the right store values for our types

        if (this.needsResources()) {
            args.types.delete('transfer')
            return args.types
        }

        args.types.delete('pickup')
        args.types.delete('offer')
        args.types.delete('withdraw')
        return args.types
    }

    if (this.hasNonEnergyResource()) {
        this.noDelivery = true
        return new Set(['transfer'])
    }

    if (!this.needsResources()) return new Set(['transfer'])
    return new Set(['withdraw', 'pickup', 'transfer'])
}

Creep.prototype.canAcceptRoomLogisticsRequest = function (requestType, requestID) {
    const request = this.room.roomLogisticsRequests[requestType][requestID]
    const target = findObjectWithID(request.targetID)

    // Pickup type

    if (target instanceof Resource) {
        if (request.onlyFull) {
            // If the creep has enough space

            if (this.freeNextStore >= target.reserveAmount) return true
            return false
        }

        return true
    }

    if (request.type === 'transfer') {
        const amount = Math.min(this.store.getCapacity(), request.amount)

        // We don't have enough resource and we can deliver

        if (this.nextStore[request.resourceType] <= 0) {
            if (this.noDelivery) return false

            // There are no practical storing structures to deliver from

            if (this.room.name !== this.commune.name) return false

            // We don't have space to get any

            if (this.freeNextStore <= 0) return false
            /*
            // Try to find a sufficient withdraw or offer task

            const types: RoomLogisticsRequestTypes[] = ['withdraw', 'pickup']

            let lowestScore = Infinity
            let bestRequest2

            for (const type of types) {
                for (const request2ID in this.room.roomLogisticsRequests[type]) {
                    const request2 = this.room.roomLogisticsRequests[type][request2ID]

                    if (request2.resourceType !== request.resourceType) continue

                    const target2Pos = findObjectWithID(request2.targetID).pos
                    const score = request2.priority + getRangeOfCoords(target2Pos, this.pos) / 100

                    if (score >= lowestScore) continue

                    lowestScore = score
                    bestRequest2 = request2
                }
            }

            if (bestRequest2) {
                request.delivery = bestRequest2.ID as unknown as string
                return true
            }
 */
            // Try to find a sufficient storing structure

            let storingStructure

            // If energy, make sure there is enough to fill us to full

            if (request.resourceType === RESOURCE_ENERGY) {
                storingStructure = this.commune.communeManager.storingStructures.find(
                    structure => structure.store[request.resourceType] >= this.freeNextStore,
                )
            } else {
                storingStructure = this.commune.communeManager.storingStructures.find(
                    structure => structure.store[request.resourceType] >= amount,
                )
            }

            if (!storingStructure) return false

            request.delivery = storingStructure.id
            return true
        }

        if (request.onlyFull) {
            // If the creep has enough resource

            if (this.nextStore[request.resourceType] >= amount) return true
            return false
        }

        return true
    }

    // Withdraw or offer type

    if (request.onlyFull) {
        // If the creep has enough space

        if (target.reserveStore[request.resourceType] >= this.freeNextStore) return true
        return false
    }

    return true
}

Creep.prototype.createBackupStoringStructuresRoomLogisticsRequest = function (types, resourceTypes) {
    if (this.room.name !== this.commune.name) return RESULT_FAIL

    if (types.has('transfer')) return this.createBackupStoringStructuresRoomLogisticsRequestTransfer()

    if (this.role === 'hauler') return RESULT_FAIL
    return this.createBackupStoringStructuresRoomLogisticsRequestWithdraw(resourceTypes)
}

Creep.prototype.createBackupStoringStructuresRoomLogisticsRequestTransfer = function () {
    const storingStructures = this.commune.communeManager.storingStructures
    if (!storingStructures.length) return RESULT_FAIL

    let resourceType: ResourceConstant

    for (const key in this.store) {
        if (key === RESOURCE_ENERGY) continue
        if (this.nextStore[key as ResourceConstant] <= 0) continue

        resourceType = key as ResourceConstant
        break
    }

    if (!resourceType) return RESULT_FAIL

    const storingStructure = storingStructures.find(
        structure => structure.freeReserveStore >= this.nextStore[resourceType],
    )
    if (!storingStructure) return RESULT_FAIL
    /* this.room.visual.text((this.nextStore[resourceType]).toString(), this.pos.x, this.pos.y, { color: customColors.red }) */
    return {
        T: 'transfer',
        TID: storingStructure.id,
        RT: resourceType,
        A: this.nextStore[resourceType],
    }
}

Creep.prototype.createBackupStoringStructuresRoomLogisticsRequestWithdraw = function (
    resourceTypes = new Set([RESOURCE_ENERGY]),
) {
    const storingStructures = this.commune.communeManager.storingStructures
    if (!storingStructures.length) return RESULT_FAIL

    let resourceType: ResourceConstant
    let storingStructure: AnyStoreStructure

    for (resourceType of resourceTypes) {
        storingStructure = storingStructures.find(
            structure => structure.reserveStore[resourceType] >= this.freeNextStore,
        )
        if (storingStructure) break
    }

    if (!storingStructure) return RESULT_FAIL

    /* this.room.visual.text((this.nextStore[resourceType]).toString(), this.pos.x, this.pos.y, { color: customColors.red }) */
    return {
        T: 'withdraw',
        TID: storingStructure.id,
        RT: resourceType,
        A: this.freeNextStore,
    }
}

Creep.prototype.findRoomLogisticRequestAmount = function (request) {
    const target = findObjectWithID(request.targetID)

    // Pickup type

    if (target instanceof Resource) {
        return Math.min(this.freeNextStore, request.amount)
    }

    if (request.type === 'transfer') {
        if (request.delivery) {
            // Take extra energy in case its needed

            if (request.resourceType === RESOURCE_ENERGY) {
                return this.nextStore[request.resourceType] + this.freeNextStore
            }

            return Math.min(request.amount, this.nextStore[request.resourceType] + this.freeNextStore)
        }
        return Math.min(this.nextStore[request.resourceType], request.amount)
    }

    // Withdraw or offer type

    return Math.min(this.freeNextStore, request.amount)
}

Creep.prototype.runRoomLogisticsRequestAdvanced = function (args) {
    const request = this.findRoomLogisticsRequest(args)
    if (!request) return RESULT_FAIL

    /* customLog('REQUEST RESPONSE', request.T, { superPosition: 1 }) */
    const target = findObjectWithID(request.TID)

    if (getRangeOfCoords(target.pos, this.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            weightCostMatrix: 'defaultCostMatrix',
        })

        return RESULT_ACTION
    }

    /*     customLog(
        'DOING REQUEST',
        request.T + ', ' + request.A + ', ' + this.store.getCapacity(request.RT) + ', ' + this.name,
        { superPosition: 1 },
    ) */
    // Pickup type

    if (target instanceof Resource) {
        this.pickup(target)
        customLog('PRE END AMOUNT', this.nextStore.energy, { superPosition: 1 })
        this.nextStore[request.RT] += request.A
        target.nextAmount -= request.A
        customLog('END AMOUNT', request.A + ', ' + this.nextStore.energy + ', ' + this.usedNextStore, {
            superPosition: 1,
        })
        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    if (request.T === 'transfer') {
        if (this.transfer(target as AnyStoreStructure | Creep, request.RT, request.A) !== OK) return RESULT_FAIL

        this.nextStore[request.RT] -= request.A
        target.nextStore[request.RT] += request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    // Withdraw or offer type

    // Creeps need to transfer to each other

    if (target instanceof Creep) {
        if (target.transfer(this, request.RT, request.A) !== OK) return RESULT_FAIL

        this.nextStore[request.RT] += request.A
        target.nextStore[request.RT] -= request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    if (this.withdraw(target, request.RT, request.A) !== OK) return RESULT_FAIL
    customLog('PRE END AMOUNT', this.nextStore.energy, { superPosition: 1 })
    this.nextStore[request.RT] += request.A
    target.nextStore[request.RT] -= request.A
    customLog('END AMOUNT', request.A + ', ' + this.nextStore.energy + ', ' + this.usedNextStore, { superPosition: 1 })
    this.memory.RLRs.splice(0, 1)
    return RESULT_SUCCESS
}

Creep.prototype.runRoomLogisticsRequestsAdvanced = function (args) {
    if (this.spawning) return false

    if (this.runRoomLogisticsRequestAdvanced(args) !== RESULT_SUCCESS) return false

    this.runRoomLogisticsRequestAdvanced(args)
    return true
}

Creep.prototype.runRoomLogisticsRequest = function () {
    const request = this.memory.RLRs[0]
    if (!request) return RESULT_FAIL

    /* customLog('REQUEST RESPONSE', request.T, { superPosition: 1 }) */
    const target = findObjectWithID(request.TID)

    if (getRangeOfCoords(target.pos, this.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            weightCostMatrix: 'defaultCostMatrix',
        })

        return RESULT_ACTION
    }

    /*     customLog(
        'DOING REQUEST',
        request.T + ', ' + request.A + ', ' + this.store.getCapacity(request.RT) + ', ' + this.name,
        { superPosition: 1 },
    ) */
    // Pickup type

    if (target instanceof Resource) {
        this.pickup(target)
        customLog('PRE END AMOUNT', this.nextStore.energy, { superPosition: 1 })
        this.nextStore[request.RT] += request.A
        target.nextAmount -= request.A
        customLog('END AMOUNT', request.A + ', ' + this.nextStore.energy + ', ' + this.usedNextStore, {
            superPosition: 1,
        })
        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    if (request.T === 'transfer') {
        if (this.transfer(target as AnyStoreStructure | Creep, request.RT, request.A) !== OK) return RESULT_FAIL

        this.nextStore[request.RT] -= request.A
        target.nextStore[request.RT] += request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    // Withdraw or offer type

    // Creeps need to transfer to each other

    if (target instanceof Creep) {
        if (target.transfer(this, request.RT, request.A) !== OK) return RESULT_FAIL

        this.nextStore[request.RT] += request.A
        target.nextStore[request.RT] -= request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    if (this.withdraw(target, request.RT, request.A) !== OK) return RESULT_FAIL
    customLog('PRE END AMOUNT', this.nextStore.energy, { superPosition: 1 })
    this.nextStore[request.RT] += request.A
    target.nextStore[request.RT] -= request.A
    customLog('END AMOUNT', request.A + ', ' + this.nextStore.energy + ', ' + this.usedNextStore, { superPosition: 1 })
    this.memory.RLRs.splice(0, 1)
    return RESULT_SUCCESS
}

Creep.prototype.runRoomLogisticsRequests = function () {
    if (this.spawning) return false

    if (this.runRoomLogisticsRequest() !== RESULT_SUCCESS) return false

    this.runRoomLogisticsRequest()
    return true
}

Creep.prototype.findCreepRoomLogisticsRequestAmount = function (type, targetID, amount, resourceType) {
    const target = findObjectWithID(targetID)

    // Pickup type

    if (target instanceof Resource) {
        // Update in accordance to potential resource decay

        amount = Math.min(target.nextAmount, amount)
        if (amount <= 0) return amount

        target.reserveAmount -= amount
        return amount
    }

    if (type === 'transfer') {
        // Delete the request if the target is fulfilled

        if (target.freeNextStore < amount) return 0

        amount = Math.min(Math.min(this.nextStore[resourceType], target.freeNextStore), amount)
        if (amount <= 0) return amount

        target.reserveStore[resourceType] += amount
        return amount
    }

    // Withdraw or offer type

    // Delete the request if the target doesn't have what we need

    if (target.nextStore[resourceType] < amount) return amount

    amount = Math.min(target.nextStore[resourceType], amount)
    if (amount <= 0) return amount

    target.reserveStore[resourceType] -= amount
    return amount
}

Creep.prototype.createCreepRoomLogisticsRequest = function (type, targetID, amount, resourceType = RESOURCE_ENERGY) {
    /* amount = */ this.findCreepRoomLogisticsRequestAmount(type, targetID, amount, resourceType)
    if (amount <= 0) return RESULT_FAIL

    this.memory.RLRs.push({
        T: type,
        TID: targetID,
        RT: resourceType,
        A: amount,
    })

    return RESULT_SUCCESS
}
