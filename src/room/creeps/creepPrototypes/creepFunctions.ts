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
import { pick, repeat } from 'lodash'
import {
    packCoord,
    packPos,
    packPosList,
    packXYAsCoord,
    unpackCoord,
    unpackCoordAsPos,
    unpackPos,
    unpackPosList,
} from 'other/packrat'
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

    if (transferResult === OK /* || transferResult === ERR_FULL */ || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
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
        this.say(`⛏️${harvestResult} ${source.index}`)
        return false
    }

    // Record that the creep has worked

    this.worked = true

    // Find amount of energy harvested and record it in data

    const energyHarvested = Math.min(this.parts.work * HARVEST_POWER, source.energy)

    globalStatsUpdater(this.room.name, 'eih', energyHarvested)

    this.say(`⛏️${energyHarvested}`)
    return true
}

Creep.prototype.findUpgradePos = function () {
    const { room } = this

    if (this.memory.PC) return unpackCoordAsPos(this.memory.PC, room.name)

    // Get usedUpgradePositions, informing false if they're undefined

    const usedUpgradePositions = room.usedUpgradePositions

    // Loop through each upgradePositions

    for (const pos of room.upgradePositions) {
        // Construct the packedPos using pos

        const packedPos = packPos(pos)

        // Iterate if the pos is used

        if (usedUpgradePositions.has(packedPos)) continue

        // Otherwise record packedPos in the creep's memory and in usedUpgradePositions

        this.memory.PC = packedPos
        usedUpgradePositions.add(packedPos)

        return pos
    }

    return false
}

Creep.prototype.advancedUpgradeController = function () {
    const { room } = this

    // Assign either the controllerLink or controllerContainer as the controllerStructure

    let controllerStructure: StructureLink | StructureContainer | undefined = room.controllerContainer

    const controllerLink = room.controllerLink
    if (!controllerStructure && controllerLink && controllerLink.RCLActionable) controllerStructure = controllerLink

    // If there is a controllerContainer

    if (controllerStructure) {
        const upgradePos = this.findUpgradePos()
        if (!upgradePos) return false

        if (getRange(this.pos.x, upgradePos.x, this.pos.y, upgradePos.y) > 0) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: upgradePos,
                        range: 0,
                    },
                ],
                avoidEnemyRanges: true,
            })

            this.message += '➡️'
        }

        const workPartCount = this.parts.work
        const controllerRange = getRange(this.pos.x, room.controller.pos.x, this.pos.y, room.controller.pos.y)

        if (controllerRange <= 3 && this.store.energy > 0) {
            if (this.upgradeController(room.controller) === OK) {
                this.store.energy -= workPartCount

                const controlPoints = workPartCount * UPGRADE_CONTROLLER_POWER

                globalStatsUpdater(this.room.name, 'eou', controlPoints)
                this.message += `🔋${controlPoints}`
            }
        }

        const controllerStructureRange = getRange(
            this.pos.x,
            controllerStructure.pos.x,
            this.pos.y,
            controllerStructure.pos.y,
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
                        this.store.energy,
                    )

                    this.store.energy -= energySpentOnRepairs

                    // Add control points to total controlPoints counter and say the success

                    globalStatsUpdater(this.room.name, 'eoro', energySpentOnRepairs)
                    this.message += `🔧${energySpentOnRepairs * REPAIR_POWER}`
                }
            }

            if (controllerStructureRange <= 1 && this.store.energy <= 0) {
                // Withdraw from the controllerContainer, informing false if the withdraw failed

                if (this.withdraw(controllerStructure, RESOURCE_ENERGY) !== OK) return false

                this.store.energy += Math.min(this.store.getCapacity(), controllerStructure.store.energy)
                controllerStructure.store.energy -= this.store.energy

                this.message += `⚡`
            }
        }

        this.say(this.message)
        return true
    }

    // If the creep needs resources

    if (this.needsResources()) {
        if (!this.memory.Rs || !this.memory.Rs.length) this.reserveWithdrawEnergy()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return false
        }

        this.reserveWithdrawEnergy()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return false
        }

        if (this.needsResources()) return false

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: room.controller.pos, range: 3 }],
            avoidEnemyRanges: true,
        })
        return false
    }

    // Otherwise if the creep doesn't need resources

    // If the controller is out of upgrade range

    if (this.pos.getRangeTo(room.controller.pos) > 3) {
        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: room.controller.pos, range: 3 }],
            avoidEnemyRanges: true,
        })

        // Inform false

        return false
    }

    // Try to upgrade the controller, and if it worked

    if (this.upgradeController(room.controller) === OK) {
        // Add control points to total controlPoints counter and say the success

        const energySpentOnUpgrades = Math.min(this.store.energy, this.parts.work * UPGRADE_CONTROLLER_POWER)

        globalStatsUpdater(this.room.name, 'eou', energySpentOnUpgrades)
        this.say(`🔋${energySpentOnUpgrades}`)

        // Inform true

        return true
    }

    // Inform false

    return false
}

Creep.prototype.advancedBuild = function () {
    const cSiteTarget = this.room.cSiteTarget
    if (!cSiteTarget) return RESULT_FAIL

    if (this.needsResources()) {
        this.runRoomLogisticsRequests({
            types: new Set(['withdraw', 'offer', 'pickup']),
            conditions: request => request.resourceType === RESOURCE_ENERGY,
        })

        if (!this.needsResources()) return RESULT_SUCCESS
    }

    // If there is a cSite, try to build it and iterate

    this.advancedBuildCSite(cSiteTarget)

    if (!this.needsResources()) return RESULT_SUCCESS

    this.runRoomLogisticsRequests({
        types: new Set(['withdraw', 'offer', 'pickup']),
        conditions: request => request.resourceType === RESOURCE_ENERGY,
    })

    return RESULT_SUCCESS
}

Creep.prototype.advancedBuildCSite = function (cSite) {
    // If the cSite is out of range

    if (getRangeOfCoords(this.pos, cSite.pos) > 3) {
        this.message = '➡️CS'

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: cSite.pos, range: 3 }],
            avoidEnemyRanges: true,
        })

        return RESULT_ACTION
    }

    if (this.worked) return RESULT_NO_ACTION

    // Buld the cSite

    if (this.build(cSite) === OK) {
        // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

        const energySpentOnConstruction = Math.min(
            this.parts.work * BUILD_POWER,
            (cSite.progressTotal - cSite.progress) * BUILD_POWER,
            this.store.energy,
        )

        this.nextStore.energy -= energySpentOnConstruction

        // Add control points to total controlPoints counter and say the success

        globalStatsUpdater(this.room.name, 'eob', energySpentOnConstruction)
        this.message = `🚧${energySpentOnConstruction}`

        return RESULT_SUCCESS
    }

    // Inform true

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

    this.say('ABCS')

    // If the cSite is out of range

    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.say('➡️CS')

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: cSiteTarget.pos, range: 3 }],
            avoidEnemyRanges: true,
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
            this.store.energy,
        )

        this.store.energy -= energySpentOnConstruction

        // Add control points to total controlPoints counter and say the success

        globalStatsUpdater(this.room.name, 'eob', energySpentOnConstruction)
        this.say(`🚧${energySpentOnConstruction}`)

        // Inform true

        return true
    }

    // Inform true

    return true
}

Creep.prototype.findRampartRepairTarget = function () {
    let minScore = Infinity
    let bestTarget

    let ramparts = this.room.enemyAttackers.length ? this.room.defensiveRamparts : this.room.structures.rampart

    for (const structure of ramparts) {
        // If above 90% of max hits

        if (structure.hits / structure.hitsMax > 0.9) continue

        const score = getRange(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) + structure.hits / 1000

        if (score > minScore) continue

        minScore = score
        bestTarget = structure
    }

    if (!bestTarget) return false

    this.memory.quota = bestTarget.hits + (this.parts.work * REPAIR_POWER * this.store.getCapacity()) / CARRY_CAPACITY

    this.memory.repairTarget = bestTarget.id
    return bestTarget
}

Creep.prototype.findRepairTarget = function () {
    if (this.memory.repairTarget) {
        const repairTarget = findObjectWithID(this.memory.repairTarget)
        if (repairTarget) return repairTarget
    }

    const { room } = this

    let possibleRepairTargets: (StructureRoad | StructureContainer)[] = room.structures.road
    possibleRepairTargets = possibleRepairTargets.concat(room.structures.container)

    let minScore = Infinity
    let bestTarget

    for (const structure of possibleRepairTargets) {
        // If above 30% of max hits

        if (structure.hits / structure.hitsMax > 0.3) continue

        const score =
            getRange(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) +
            (structure.hits / structure.hitsMax) * 1000

        if (score > minScore) continue

        minScore = score
        bestTarget = structure
    }

    if (!bestTarget) return false

    this.memory.repairTarget = bestTarget.id
    return bestTarget
}

Creep.prototype.findOptimalSourceIndex = function () {
    const { room } = this

    this.say('FOSN')

    if (this.memory.SI !== undefined) return true

    // Get the rooms anchor, if it's undefined inform false

    if (!room.anchor) return false

    // Construct a creep threshold

    let creepThreshold = 1

    // So long as the creepThreshold is less than 4

    while (creepThreshold < 4) {
        // Then loop through the source names and find the first one with open spots

        for (const source of room.sourcesByEfficacy) {
            const index = source.index as 0 | 1

            // If there are still creeps needed to harvest a source under the creepThreshold

            if (Math.min(creepThreshold, room.sourcePositions[index].length) - room.creepsOfSourceAmount[index] > 0) {
                this.memory.SI = index
                return true
            }
        }

        // Otherwise increase the creepThreshold

        creepThreshold += 1
    }

    // No source was found, inform false

    return false
}

Creep.prototype.findSourcePos = function (index) {
    const { room } = this

    this.say('FSHP')

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

    this.say('FMHP')

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
    const freeNextStore = this.freeNextStore

    if (freeNextStore === this.store.getCapacity())
        // Record and inform that the creep needs resources

        return (this.memory.NR = true)

    // Otherwise if the creep is full

    if (freeNextStore == 0) {
        // Record and inform that the creep does not resources

        delete this.memory.NR
        return false
    }

    return this.memory.NR
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
        this.say('♻️ S')

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

    this.say('♻️ C')

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

    this.say('PH')

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

    this.say('AH')

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

Creep.prototype.deleteReservation = function (index) {
    this.memory.Rs.splice(index, 1)

    this.message += '❌'
}

Creep.prototype.createReservation = function (type, targetID, amount, resourceType = RESOURCE_ENERGY) {
    if (!this.memory.Rs) this.memory.Rs = []
    if (amount <= 0) return

    this.memory.Rs.push({
        type,
        targetID,
        amount,
        resourceType,
    })

    const reservation = this.memory.Rs[0]

    const target = findObjectWithID(reservation.targetID)

    this.message += '➕' + type[0]

    if (target instanceof Resource) {
        target.reserveAmount -= reservation.amount
        return
    }

    if (reservation.type === 'transfer') {
        return
    }
}

Creep.prototype.reservationManager = function () {
    if (!this.memory.Rs) return

    for (let index = 0; index < this.memory.Rs.length; index++) {
        const reservation = this.memory.Rs[index]
        const target = findObjectWithID(reservation.targetID)

        if (!target || target.room.name !== this.room.name) {
            this.deleteReservation(index)
            continue
        }

        if (this.room.enemyThreatCoords.has(packCoord(target.pos))) {
            this.deleteReservation(index)
            continue
        }

        if (target instanceof Resource) {
            let { amount } = reservation

            target.reserveAmount -= amount

            if (amount <= 0) {
                target.reserveAmount += amount
                this.deleteReservation(0)
            }
            /*
            if (Memory.roomVisuals) {
                this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
                this.room.visual.text(`${target.reserveAmount}`, this.pos.x, this.pos.y + 2, { font: 0.5 })
            } */

            continue
        }

        if (reservation.type === 'transfer') {
            let amount = Math.min(reservation.amount, target.store.getFreeCapacity(reservation.resourceType))

            if (amount <= 0) {
                this.deleteReservation(0)
            }
            /*
            if (Memory.roomVisuals) {
                this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
                this.room.visual.text(`${target.store[reservation.resourceType]}`, this.pos.x, this.pos.y + 2, {
                    font: 0.5,
                })
            }
 */
            reservation.amount = amount

            continue
        }

        let amount = reservation.amount

        /*
        if (Memory.roomVisuals) {
            this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
            this.room.visual.text(`${target.store[reservation.resourceType]}`, this.pos.x, this.pos.y + 2, {
                font: 0.5,
            })
        }
         */
    }
}

Creep.prototype.fulfillReservation = function () {
    if (!this.memory.Rs) return true

    const reservation = this.memory.Rs[0]
    if (!reservation) return true

    const target = findObjectWithID(reservation.targetID)
    if (!target) {
        this.deleteReservation(0)
        return true
    }

    const { room } = this

    // If visuals are enabled, show the task targeting

    if (Memory.roomVisuals)
        room.visual.line(this.pos, target.pos, {
            color: customColors.green,
            opacity: 0.2,
        })

    this.message += '📲'

    if (getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
            avoidEnemyRanges: true,
        })

        return false
    }

    if (this.movedResource) return false

    // Pickup

    if (target instanceof Resource) {
        const pickupResult = this.pickup(target)
        this.message += pickupResult

        if (pickupResult === ERR_FULL) {
            this.deleteReservation(0)
            return true
        }

        if (pickupResult === OK) {
            this.movedResource = true
            this.freeCapacityNextTick = Math.max(this.store.getFreeCapacity() - target.amount, 0)
            this.deleteReservation(0)
            return true
        }

        return false
    }

    let amount = 0

    // Transfer

    if (reservation.type === 'transfer') {
        // This needs to use the direct functions to calculate free space, not the reserved amount

        amount = Math.min(
            reservation.amount,
            target.store.getFreeCapacity(reservation.resourceType),
            this.store[reservation.resourceType],
        )

        this.message += amount

        const transferResult = this.transfer(target as any, reservation.resourceType, amount)
        this.message += transferResult

        if (transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
            this.deleteReservation(0)
            return true
        }

        if (transferResult === OK) {
            this.movedResource = true
            this.freeCapacityNextTick = this.store.getFreeCapacity() + amount
            this.deleteReservation(0)
            return true
        }

        return false
    }

    amount = Math.min(
        Math.min(amount, this.store.getFreeCapacity(reservation.resourceType)),
        target.store[reservation.resourceType] + reservation.amount,
    )

    // Withdraw

    let withdrawResult: ScreepsReturnCode

    if (target instanceof Creep) {
        withdrawResult = target.transfer(this, reservation.resourceType, amount)
    } else withdrawResult = this.withdraw(target, reservation.resourceType, amount)
    this.message += withdrawResult

    if (withdrawResult === ERR_NOT_ENOUGH_RESOURCES) {
        this.deleteReservation(0)
        return true
    }

    if (withdrawResult === ERR_INVALID_TARGET) {
        this.deleteReservation(0)
        return true
    }

    if (withdrawResult === ERR_FULL) {
        this.deleteReservation(0)
        return true
    }

    if (withdrawResult === OK) {
        this.movedResource = true
        this.freeCapacityNextTick = this.store.getFreeCapacity() - amount
        this.deleteReservation(0)
        return true
    }

    return false
}

Creep.prototype.reserveWithdrawEnergy = function () {
    if (this.memory.Rs && this.memory.Rs?.length) return

    const { room } = this

    if (!this.needsResources()) return
    if (this.freeCapacityNextTick === undefined) this.freeCapacityNextTick = this.store.getFreeCapacity()

    let withdrawTargets = room.MEWT.filter(target => {
        if (target instanceof Resource)
            return (
                target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeCapacityNextTick
            )

        return target.store.energy >= this.freeCapacityNextTick
    })

    if (!room.storage && !room.terminal) {
        withdrawTargets = withdrawTargets.concat(
            [room.fastFillerContainerLeft, room.fastFillerContainerRight, room.controllerContainer].filter(target => {
                return target && target.store.energy >= target.store.getCapacity(RESOURCE_ENERGY) * 0.5
            }),
        )
    }

    let target
    let amount

    if (withdrawTargets.length) {
        target = findClosestObject(this.pos, withdrawTargets)

        if (target instanceof Resource) amount = target.reserveAmount
        else amount = Math.min(this.freeCapacityNextTick, target.store.energy)

        this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
        return
    }

    withdrawTargets = room.OEWT.filter(target => {
        if (target instanceof Resource)
            return (
                target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeCapacityNextTick
            )

        return target.store.energy >= this.freeCapacityNextTick
    })

    if (!withdrawTargets.length) return

    target = findClosestObject(this.pos, withdrawTargets)

    if (target instanceof Resource) amount = target.reserveAmount
    else amount = Math.min(this.freeCapacityNextTick, target.store.energy)

    this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
}

Creep.prototype.reserveTransferEnergy = function () {
    if (this.memory.Rs?.length) return

    const { room } = this

    if (this.usedStore() === 0) return

    let transferTargets = room.METT.filter(function (target) {
        return target.freeSpecificStore(RESOURCE_ENERGY) > 0
    })

    transferTargets = transferTargets.concat(
        room.MEFTT.filter(target => {
            return (
                (target.freeStore() >= this.store.energy && this.store.energy > 0) ||
                target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore()
            )
        }),
    )

    let target
    let amount

    if (transferTargets.length) {
        target = findClosestObject(this.pos, transferTargets)

        amount = Math.min(Math.max(this.usedStore(), 0), target.freeSpecificStore(RESOURCE_ENERGY))

        this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
        return
    }

    transferTargets = room.OETT.filter(target => {
        return target.freeStore() >= this.usedStore()
    })

    if (!transferTargets.length) return

    target = findClosestObject(this.pos, transferTargets)

    amount = Math.min(Math.max(this.usedStore(), 0), target.freeStore())

    this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
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
    if (spawn.spawning.remainingTime > 1) return

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
    const target = findObjectWithID(request.TID)

    // Pickup type

    if (target instanceof Resource) {
        // Update in accordance to potential resource decay

        request.A = Math.min(Math.min(this.freeNextStore, target.nextAmount), request.A)
        if (request.A <= 0) {
            this.memory.RLRs.splice(0, 1)
            return
        }

        target.reserveAmount -= request.A
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

        target.reserveStore[request.RT] += request.A
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

    target.reserveStore[request.RT] -= request.A
}

Creep.prototype.findRoomLogisticsRequest = function (args) {
    if (this.memory.RLRs[0]) return this.memory.RLRs[0]

    const types = this.findRoomLogisticsRequestTypes(args)

    let lowestScore = Infinity
    let bestRequest: RoomLogisticsRequest | 0

    for (const type of types) {
        for (const requestID in this.room.roomLogisticsRequests[type]) {
            const request = this.room.roomLogisticsRequests[type][requestID]

            delete request.delivery

            // Customizable conditions

            if (args) {
                if (args.conditions && !args.conditions(request)) continue
            }

            // Default conditions

            if (!this.canAcceptRoomLogisticsRequest(request.type, request.ID.toString())) continue

            const targetPos = findObjectWithID(request.targetID).pos
            const score = request.priority + getRangeOfCoords(targetPos, this.pos) / 100

            if (score >= lowestScore) continue

            lowestScore = score
            bestRequest = request
        }
    }

    customLog('FINDING REQ', bestRequest + ', ' + Array.from(types))

    let creepRequest: CreepRoomLogisticsRequest | 0

    if (!bestRequest) {
        creepRequest = this.createBackupStoringStructuresRoomLogisticsRequest(types)
        if (!creepRequest) return RESULT_FAIL
    } else {
        creepRequest = {
            T: bestRequest.type,
            TID: bestRequest.targetID,
            RT: bestRequest.resourceType,
            A: this.findRoomLogisticRequestAmount(bestRequest),
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
                    A: Math.max(Math.min(this.freeNextStore, nextRequest.amount), this.freeNextStore),
                }

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

            this.memory.RLRs.push(nextCreepRequest)
        }

        // Delete the request if it has no more utility

        if (bestRequest.amount === creepRequest.A)
            delete this.room.roomLogisticsRequests[bestRequest.type][bestRequest.ID]
        else bestRequest.amount -= creepRequest.A
    }

    this.memory.RLRs.push(creepRequest)

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
    if (args && args.types) return args.types

    if (this.needsResources()) return new Set(['withdraw', 'pickup'])

    return new Set(['transfer'])
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

        // We don't have enough resource and we have free space

        if (this.nextStore[request.resourceType] <= 0 && this.freeNextStore > 0) {
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

            // Try to find a sufficient storing structure

            if (this.room.name === this.commune.name) {
                const storingStructure = this.commune.communeManager.storingStructures.find(
                    structure => structure.store[request.resourceType] >= amount,
                )
                if (storingStructure) {
                    request.delivery = storingStructure.id
                    return true
                }
            }
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

Creep.prototype.createBackupStoringStructuresRoomLogisticsRequest = function (types) {
    if (this.room.name !== this.commune.name) return RESULT_FAIL
    if (!types.has('transfer')) return RESULT_FAIL

    const storingStructures = this.commune.communeManager.storingStructures
    if (!storingStructures.length) return RESULT_FAIL

    let resourceType: ResourceConstant

    for (const key in this.store) {
        if (key === RESOURCE_ENERGY) continue

        resourceType = key as ResourceConstant
        break
    }
    customLog("BACKUP", resourceType)
    const storingStructure = storingStructures.find(
        structure => structure.freeReserveStore >= this.nextStore[resourceType],
    )
    if (!storingStructure) return RESULT_FAIL

    return {
        T: 'transfer',
        TID: storingStructure.id,
        RT: resourceType,
        A: this.nextStore[resourceType],
    }

    return RESULT_FAIL
}

Creep.prototype.findRoomLogisticRequestAmount = function (request) {
    const target = findObjectWithID(request.targetID)

    // Pickup type

    if (target instanceof Resource) {
        return Math.min(this.freeNextStore, request.amount)
    }

    if (request.type === 'transfer') {
        if (request.delivery) return request.amount
        return Math.min(this.nextStore[request.resourceType], request.amount)
    }

    // Withdraw or offer type

    return Math.min(this.freeNextStore, request.amount)
}

Creep.prototype.runRoomLogisticsRequest = function (args) {
    const request = this.findRoomLogisticsRequest(args)
    if (!request) return RESULT_FAIL
    customLog('REQUEST RESPONSE', request.T)
    const target = findObjectWithID(request.TID)

    if (getRangeOfCoords(target.pos, this.pos) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: target.pos, range: 1 }],
        })

        return RESULT_ACTION
    }
    customLog('REQUEST SUCCESS', 'See above ^')

    // Pickup type

    if (target instanceof Resource) {
        this.pickup(target)

        this.nextStore[request.RT] += request.A
        target.nextAmount -= request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    if (request.T === 'transfer') {
        this.transfer(target as AnyStoreStructure | Creep, request.RT, request.A)

        this.nextStore[request.RT] -= request.A
        target.nextStore[request.RT] += request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    // Withdraw or offer type

    // Creeps need to transfer to each other

    if (target instanceof Creep) {
        target.transfer(this, request.RT, request.A)

        this.nextStore[request.RT] += request.A
        target.nextStore[request.RT] -= request.A

        this.memory.RLRs.splice(0, 1)
        return RESULT_SUCCESS
    }

    this.withdraw(target, request.RT, request.A)

    this.nextStore[request.RT] += request.A
    target.nextStore[request.RT] -= request.A

    this.memory.RLRs.splice(0, 1)
    return RESULT_SUCCESS
}

Creep.prototype.runRoomLogisticsRequests = function (args) {
    if (this.spawning) return false

    if (this.runRoomLogisticsRequest(args) !== RESULT_SUCCESS) return false

    this.runRoomLogisticsRequest(args)
    return true
}
