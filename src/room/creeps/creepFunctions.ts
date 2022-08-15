import { spawn } from 'child_process'
import {
    allyList,
    cacheAmountModifier,
    communeSigns,
    CPUBucketCapacity,
    CPUBucketRenewThreshold,
    impassibleStructureTypes,
    myColors,
    nonCommuneSigns,
    roomDimensions,
} from 'international/constants'
import {
    arePositionsEqual,
    customLog,
    findClosestObject,
    findClosestPos,
    findCreepInQueueMatchingRequest,
    findObjectWithID,
    findCoordsInsideRect,
    getRange,
    pack,
    packXY,
    unpackAsPos,
    unpackAsRoomPos,
    findClosestObjectInRange,
} from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'
import { pick, repeat } from 'lodash'
import { packCoord, packPos, packPosList, unpackPos, unpackPosList } from 'other/packrat'
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
    // If creep isn't in transfer range

    if (this.pos.getRangeTo(target.pos) > 1) {
        // Make a moveRequest to target and inform false

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
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
            goal: { pos: target.pos, range: 1 },
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
            goal: { pos: target.pos, range: 1 },
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
    if (global.roomStats[this.room.name]) global.roomStats[this.room.name].eih += energyHarvested

    this.say(`⛏️${energyHarvested}`)
    return true
}

Creep.prototype.advancedUpgradeController = function () {
    const { room } = this

    // Assign either the controllerLink or controllerContainer as the controllerStructure

    const controllerStructure: StructureLink | StructureContainer | undefined =
        room.controllerContainer || room.controllerLink

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

        const upgradePos = unpackAsRoomPos(this.memory.packedPos, room.name)
        const upgradePosRange = getRange(this.pos.x, upgradePos.x, this.pos.y, upgradePos.y)

        if (upgradePosRange > 0) {
            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: upgradePos,
                    range: 0,
                },
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

                if (global.roomStats[this.room.name]) global.roomStats[this.room.name].eou += controlPoints
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
                    )

                    this.store.energy -= workPartCount

                    // Add control points to total controlPoints counter and say the success

                    if (global.roomStats[this.room.name]) global.roomStats[this.room.name].eoro += energySpentOnRepairs
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
        if (!this.memory.reservations || !this.memory.reservations.length) this.reserveWithdrawEnergy()

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
            goal: { pos: room.controller.pos, range: 3 },
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
            goal: { pos: room.controller.pos, range: 3 },
            avoidEnemyRanges: true,
        })

        // Inform false

        return false
    }

    // Try to upgrade the controller, and if it worked

    if (this.upgradeController(room.controller) === OK) {
        // Add control points to total controlPoints counter and say the success

        if (global.roomStats[this.room.name]) global.roomStats[this.room.name].eou += this.parts.work
        this.say(`🔋${this.parts.work}`)

        // Inform true

        return true
    }

    // Inform false

    return false
}

Creep.prototype.advancedBuildCSite = function () {
    const { room } = this

    const cSiteTarget = room.cSiteTarget

    // Stop if the cSite is undefined

    if (!cSiteTarget) return false

    this.say('ABCS')

    // If the cSite is out of range

    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.say('➡️CS')

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: cSiteTarget.pos, range: 3 },
            avoidEnemyRanges: true,
        })

        return true
    }

    // Buld the cSite

    if (this.build(cSiteTarget) === OK) {
        // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

        const energySpentOnConstruction = Math.min(
            this.parts.work * BUILD_POWER,
            (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER,
        )

        if (this.store.energy - energySpentOnConstruction <= 0) this.memory.NR = true

        // Add control points to total controlPoints counter and say the success

        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eob += Math.min(
                this.parts.work * BUILD_POWER,
                (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER,
            )

        this.say(`🚧${energySpentOnConstruction}`)

        return true
    }

    // Inform true

    return false
}

Creep.prototype.advancedBuildAllyCSite = function () {
    const { room } = this

    // If there is no construction target ID

    if (!room.memory.cSiteTargetID) {
        // Try to find a construction target. If none are found, stop

        room.findAllyCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object

    let cSiteTarget = findObjectWithID(room.memory.cSiteTargetID)

    // If there is no construction target

    if (!cSiteTarget) {
        // Try to find a construction target. If none are found, stop

        room.findAllyCSiteTargetID(this)
    }

    // Convert the construction target ID into a game object, stopping if it's undefined

    cSiteTarget = findObjectWithID(room.memory.cSiteTargetID)

    // Stop if the cSite is undefined

    if (!cSiteTarget) return false

    this.say('ABCS')

    // If the cSite is out of range

    if (getRange(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
        this.say('➡️CS')

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: cSiteTarget.pos, range: 3 },
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
        )

        this.store.energy -= energySpentOnConstruction

        // Add control points to total controlPoints counter and say the success

        if (global.roomStats[this.room.name])
            global.roomStats[this.room.name].eob += Math.min(
                this.parts.work * BUILD_POWER,
                (cSiteTarget.progressTotal - cSiteTarget.progress) * BUILD_POWER,
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

        return this.pos.findClosestByPath(rampartsUnderQuota, {
            ignoreCreeps: true,
            range: 3,
        })
    }

    // If no rampart was found, inform false

    return false
}

Creep.prototype.findRepairTarget = function (excludedIDs = new Set()) {
    const { room } = this

    // Get roads and containers in the room

    const possibleRepairTargets = [...room.structures.road, ...room.structures.container]

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

    return this.pos.findClosestByPath(viableRepairTargets, {
        ignoreCreeps: true,
        range: 3,
    })
}

Creep.prototype.findOptimalSourceName = function () {
    const { room } = this

    this.say('FOSN')

    if (this.memory.SI) return true

    // Get the rooms anchor, if it's undefined inform false

    if (!room.anchor) return false

    // Construct a creep threshold

    let creepThreshold = 1

    // So long as the creepThreshold is less than 4

    while (creepThreshold < 4) {
        // Then loop through the source names and find the first one with open spots

        for (const source of room.sourcesByEfficacy) {
            const { index } = source

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

    if (this.memory.packedPos) return true

    // Get usedSourceHarvestPositions

    const usedSourceCoords = room.usedSourceCoords[index]

    const openSourcePositions = room.sourcePositions[index].filter(pos => !usedSourceCoords.has(pack(pos)))
    if (!openSourcePositions.length) return false

    const packedPos = pack(openSourcePositions[0])

    this.memory.packedPos = packedPos
    room._usedSourceCoords[index].add(packedPos)

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

    const harvestPositions: Coord[] = room.get('mineralHarvestPositions')

    const openHarvestPositions = harvestPositions.filter(pos => !usedHarvestPositions.has(pack(pos)))
    if (!openHarvestPositions.length) return false

    openHarvestPositions.sort((a, b) => getRange(anchor.x, anchor.y, a.x, a.y) - getRange(anchor.x, anchor.y, b.x, b.y))

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

    const fastFillerPositions: Coord[] = room.get('fastFillerPositions')

    const openFastFillerPositions = fastFillerPositions.filter(pos => !usedFastFillerPositions.has(pack(pos)))
    if (!openFastFillerPositions.length) return false

    const packedPos = pack(findClosestPos(this.pos, openFastFillerPositions))

    this.memory.packedPos = packedPos
    usedFastFillerPositions.add(packedPos)

    return true
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

    if (!opts.cacheAmount) opts.cacheAmount = internationalManager.defaultCacheAmount

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
                color: myColors.lightBlue,
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

    const packedCoord = pack(path[0])

    // Add the creep's name to its moveRequest position

    room.moveRequests.get(packedCoord)
        ? room.moveRequests.get(packedCoord).push(this.name)
        : room.moveRequests.set(packedCoord, [this.name])

    // Make moveRequest true to inform a moveRequest has been made

    this.moveRequest = packedCoord

    // Set the creep's pathOpts to reflect this moveRequest's opts

    this.pathOpts = opts

    // Assign the goal's pos to the creep's goalPos

    this.memory.goalPos = packPos(opts.goal.pos)

    // Set the path in the creep's memory

    this.memory.path = packPosList(path)

    // Inform success

    return true
}

Creep.prototype.findShovePositions = function (avoidPackedPositions) {
    const { room } = this

    const x = this.pos.x
    const y = this.pos.y

    const adjacentPackedPositions = [
        packXY(x - 1, y - 1),
        packXY(x - 1, y),
        packXY(x - 1, y + 1),
        packXY(x, y - 1),
        packXY(x, y + 1),
        packXY(x + 1, y - 1),
        packXY(x + 1, y + 1),
        packXY(x + 1, y - 1),
    ]

    const shovePositions = []

    const terrain = room.getTerrain()

    for (let index = 0; index < adjacentPackedPositions.length; index++) {
        const packedPos = adjacentPackedPositions[index]

        if (room.creepPositions.get(packedPos)) continue

        if (avoidPackedPositions.has(packedPos)) continue

        let coord = unpackAsPos(packedPos)

        if (coord.x < 1 || coord.x >= roomDimensions - 1 || coord.y < 1 || coord.y >= roomDimensions - 1) continue

        let pos = new RoomPosition(coord.x, coord.y, room.name)

        if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

        let hasImpassibleStructure

        for (const structure of pos.lookFor(LOOK_STRUCTURES)) {
            if (!impassibleStructureTypes.includes(structure.structureType)) continue

            hasImpassibleStructure = true
            break
        }

        if (hasImpassibleStructure) continue

        for (const cSite of pos.lookFor(LOOK_CONSTRUCTION_SITES)) {
            if (!cSite.my && !Memory.allyList.includes(cSite.owner.username)) continue

            if (impassibleStructureTypes.includes(cSite.structureType)) {
                hasImpassibleStructure = true
                break
            }
        }

        if (hasImpassibleStructure) continue

        // If the shove positions must have viable ramparts

        if (this.memory.ROS) {
            let hasRampart

            for (const structure of pos.lookFor(LOOK_STRUCTURES)) {
                if (structure.structureType !== STRUCTURE_RAMPART) continue

                hasRampart = true
                break
            }

            if (!hasRampart) continue
        }

        shovePositions.push(pos)
    }

    return shovePositions
}

Creep.prototype.shove = function (shoverPos) {
    const { room } = this

    const shovePositions = this.findShovePositions(new Set([pack(shoverPos), pack(this.pos)]))
    if (!shovePositions.length) return false

    let goalPos: RoomPosition

    if (this.memory.goalPos) {
        goalPos = unpackPos(this.memory.goalPos)

        goalPos = shovePositions.sort((a, b) => {
            return getRange(goalPos.x, a.x, goalPos.y, a.y) - getRange(goalPos.x, b.x, goalPos.y, b.y)
        })[0]
    } else goalPos = shovePositions[0]

    const packedCoord = pack(goalPos)

    room.moveRequests.get(packedCoord)
        ? room.moveRequests.get(packedCoord).push(this.name)
        : room.moveRequests.set(packedCoord, [this.name])
    this.moveRequest = packedCoord

    if (Memory.roomVisuals)
        room.visual.circle(this.pos, {
            fill: '',
            stroke: myColors.red,
            radius: 0.5,
            strokeWidth: 0.15,
        })

    if (!this.moveRequest) return false

    if (Memory.roomVisuals) {
        room.visual.circle(this.pos, {
            fill: '',
            stroke: myColors.yellow,
            radius: 0.5,
            strokeWidth: 0.15,
        })

        room.visual.line(this.pos, unpackAsRoomPos(this.moveRequest, this.room.name), {
            color: myColors.yellow,
        })
    }

    this.recurseMoveRequest()
    return true
}

Creep.prototype.runMoveRequest = function () {
    const { room } = this

    // If requests are not allowed for this pos, inform false

    if (!room.moveRequests.get(this.moveRequest)?.length) return false

    if (this.move(this.pos.getDirectionTo(unpackAsRoomPos(this.moveRequest, room.name))) !== OK) return false

    // Record where the creep is tying to move

    this.moved = this.moveRequest

    // Remove all moveRequests to the position

    room.moveRequests.delete(this.moveRequest)
    delete this.moveRequest

    // Remove record of the creep being on its current position

    /* room.creepPositions[pack(this.pos)] = undefined */

    // Record the creep at its new position

    /* room.creepPositions[this.moveRequest] = this.name */

    return true
}

Creep.prototype.recurseMoveRequest = function (queue = []) {
    const { room } = this

    if (!this.moveRequest) return
    if (!room.moveRequests.get(this.moveRequest)?.length) return

    queue.push(this.name)

    // Try to find the name of the creep at pos

    const creepNameAtPos = room.creepPositions.get(this.moveRequest)

    // If there is no creep at the pos

    if (!creepNameAtPos) {
        // loop through each index of the queue, drawing visuals

        if (Memory.roomVisuals) {
            const moveRequestPos = unpackAsRoomPos(this.moveRequest, room.name)

            room.visual.rect(moveRequestPos.x - 0.5, moveRequestPos.y - 0.5, 1, 1, {
                fill: myColors.green,
                opacity: 0.2,
            })

            for (let index = queue.length - 1; index >= 0; index--)
                room.visual.line(Game.creeps[queue[index]].pos, this.pos, {
                    color: myColors.yellow,
                    opacity: 0.2,
                })
        }

        // Otherwise, loop through each index of the queue

        for (let index = queue.length - 1; index >= 0; index--)
            // Have the creep run its moveRequesat

            Game.creeps[queue[index]].runMoveRequest()

        return
    }

    // Get the creepAtPos with the name

    const creepAtPos = Game.creeps[creepNameAtPos]

    if (creepAtPos.moved) {
        // Otherwise, loop through each index of the queue

        for (let index = queue.length - 1; index >= 0; index--)
            // Have the creep run its moveRequest

            Game.creeps[queue[index]].runMoveRequest()

        // loop through each index of the queue, drawing visuals

        if (Memory.roomVisuals)
            for (let index = queue.length - 1; index >= 0; index--)
                room.visual.line(Game.creeps[queue[index]].pos, this.pos, {
                    color: myColors.yellow,
                    opacity: 0.2,
                })
        return
    }

    // If the creepAtPos has a moveRequest

    if (creepAtPos.moveRequest) {
        // If it's not valid

        if (!room.moveRequests.get(creepAtPos.moveRequest)?.length) return

        // If the creep's pos and the creepAtPos's moveRequests are aligned

        if (pack(this.pos) === creepAtPos.moveRequest) {
            // Have the creep move to its moveRequest

            this.runMoveRequest()
            creepAtPos.recurseMoveRequest()
            return
        }

        // If the creepAtPos is in the queue

        if (queue.includes(creepAtPos.name)) {
            // loop through each index of the queue

            for (let index = queue.length - 1; index >= 0; index--)
                // Have the creep run its moveRequest

                Game.creeps[queue[index]].runMoveRequest()

            // loop through each index of the queue, drawing visuals

            if (Memory.roomVisuals)
                for (let index = queue.length - 1; index >= 0; index--)
                    room.visual.line(Game.creeps[queue[index]].pos, this.pos, {
                        color: myColors.yellow,
                        opacity: 0.2,
                    })

            return
        }

        creepAtPos.recurseMoveRequest(queue)
        return
    }

    // Otherwise if creepAtPos is fatigued, stop

    if (creepAtPos.fatigue > 0) return

    // Otherwise the creepAtPos has no moveRequest

    if (creepAtPos.shove(this.pos)) {
        this.runMoveRequest()
        return
    }

    // Have the creep move to its moveRequest

    this.runMoveRequest()

    // Have the creepAtPos move to the creep and inform true

    creepAtPos.moveRequest = pack(this.pos)
    creepAtPos.runMoveRequest()
}

Creep.prototype.needsResources = function () {
    // If the creep is empty

    if (this.usedStore() <= 0)
        // Record and inform that the creep needs resources

        return (this.memory.NR = true)

    // Otherwise if the creep is full

    if (this.freeStore(RESOURCE_ENERGY) <= 0) {
        // Record and inform that the creep does not resources

        delete this.memory.NR
        return false
    }

    return this.memory.NR
}

Creep.prototype.isOnExit = function () {
    // Define an x and y aligned with the creep's pos

    const { x } = this.pos
    const { y } = this.pos

    // If the creep is on an exit, inform true. Otherwise inform false

    if (x <= 0 || x >= 49 || y <= 0 || y >= 49) return true
    return false
}

Creep.prototype.findTotalHealPower = function (range = 1) {
    // Initialize the healValue

    let heal = 0

    // Loop through the creep's body

    for (const part of this.body) {
        // If the part isn't heal, iterate

        if (part.type !== HEAL) continue

        // Otherwise increase healValue by heal power * the part's boost

        heal +=
            (part.boost ? BOOSTS[part.type][part.boost][part.type] : 1) * (range <= 1 ? HEAL_POWER : RANGED_HEAL_POWER)
    }

    // Inform healValue

    return heal
}

Creep.prototype.findRecycleTarget = function () {
    const { room } = this

    const spawns = room.structures.spawn

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

    this.say('♻️')

    const recycleTarget = this.findRecycleTarget()

    // If the creep could not find a recycle target

    if (!recycleTarget) return false

    // If the target is a spawn

    if (recycleTarget instanceof StructureSpawn) {
        // If the recycleTarget is out of actionable range, move to it

        if (getRange(this.pos.x, recycleTarget.pos.x, this.pos.y, recycleTarget.pos.y) > 1) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: recycleTarget.pos, range: 1 },
                avoidEnemyRanges: true,
            })

            return true
        }

        // If the recycleTarget is a spawn, directly recycle

        if (recycleTarget instanceof Spawn) return recycleTarget.recycleCreep(this) === OK
    }

    // Otherwise if the target is a container

    // If the recycleTarget is out of actionable range, move to it

    if (getRange(this.pos.x, recycleTarget.pos.x, this.pos.y, recycleTarget.pos.y) > 0) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: recycleTarget.pos, range: 1 },
            avoidEnemyRanges: true,
        })

        return true
    }

    // Otherwise recycleTarget must be a container, so find the closest spawn and recycle

    const spawn = findClosestObject(this.pos, room.structures.spawn)

    return spawn.recycleCreep(this) === OK
}

Creep.prototype.advancedRenew = function () {
    const { room } = this

    if (this.body.length > 8) return

    // If there is insufficient CPU to renew, inform false

    if (Game.cpu.bucket < CPUBucketRenewThreshold) return

    if (!room.myCreeps.fastFiller.length) return

    if (this.isDying()) return

    // If the creep's age is less than the benefit from renewing, inform false

    if (CREEP_LIFE_TIME - this.ticksToLive < Math.ceil(this.findCost() / 2.5 / this.body.length)) return

    // Get the room's spawns, stopping if there are none

    const spawns = room.structures.spawn

    // Get a spawn in range of 1, informing false if there are none

    const spawn = spawns.find(spawn => getRange(this.pos.x, spawn.pos.x, this.pos.y, spawn.pos.y) === 1)
    if (!spawn) return

    // If the spawn has already renewed this tick, inform false

    if (spawn.hasRenewed) return

    // If the spawn is spawning, inform false

    if (spawn.spawning) return

    if (spawn.renewCreep(this) === OK) spawn.hasRenewed = true
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

Creep.prototype.findCost = function () {
    let cost = 0

    for (const part of this.body) cost += BODYPART_COST[part.type]

    return cost
}

Creep.prototype.passiveHeal = function () {
    const { room } = this

    this.say('PH')

    if (!this.meleed) {
        // If the creep is below max hits

        if (this.hitsMax > this.hits) {
            // Have it heal itself and stop

            this.heal(this)
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

            if (this.id === posData.creep.id) continue

            // If the creep is not owned and isn't an ally

            if (!posData.creep.my && !Memory.allyList.includes(posData.creep.owner.username)) continue

            // If the creep is at full health, iterate

            if (posData.creep.hitsMax === posData.creep.hits) continue

            // have the creep heal the adjacentCreep and stop

            this.heal(posData.creep)
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

        if (this.id === posData.creep.id) continue

        // If the creep is not owned and isn't an ally

        if (!posData.creep.my && !Memory.allyList.includes(posData.creep.owner.username)) continue

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

    if (this.meleed) {
        // If the creep is below max hits

        if (this.hitsMax > this.hits) {
            // Have it heal itself and stop

            this.heal(this)
            return false
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
            goal: { pos: healTarget.pos, range: 1 },
        })

        if (range <= 3) {
            this.rangedHeal(healTarget)
            return true
        }
    }

    if (this.meleed) return false

    this.heal(healTarget)
    return true
}

Creep.prototype.passiveRangedAttack = function () {
    return true
}

Creep.prototype.deleteReservation = function (index) {
    this.memory.reservations.splice(index, 1)

    this.message += '❌'
}

Creep.prototype.createReservation = function (type, targetID, amount, resourceType = RESOURCE_ENERGY) {
    if (!this.memory.reservations) this.memory.reservations = []

    this.memory.reservations.push({
        type,
        targetID,
        amount,
        resourceType,
    })

    const reservation = this.memory.reservations[0]

    const target = findObjectWithID(reservation.targetID)

    this.message += '➕' + type[0]

    if (target instanceof Resource) {
        target.reserveAmount -= reservation.amount
        return
    }

    if (reservation.type === 'transfer') {
        target.store[reservation.resourceType] += reservation.amount
        return
    }

    target.store[reservation.resourceType] -= reservation.amount
}

Creep.prototype.reservationManager = function () {
    if (!this.memory.reservations) return

    for (let index = 0; index < this.memory.reservations.length; index++) {
        const reservation = this.memory.reservations[index]
        const target = findObjectWithID(reservation.targetID)

        if (!target || target.room.name !== this.room.name) {
            this.deleteReservation(index)
            continue
        }

        if (target instanceof Resource) {
            let { amount } = reservation

            target.reserveAmount -= amount

            if (amount === 0) {
                target.reserveAmount += amount
                this.deleteReservation(0)
            }

            if (Memory.roomVisuals) {
                this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
                this.room.visual.text(`${target.reserveAmount}`, this.pos.x, this.pos.y + 2, { font: 0.5 })
            }

            continue
        }

        if (reservation.type === 'transfer') {
            let amount = Math.min(reservation.amount, target.freeStore(reservation.resourceType))

            target.store[reservation.resourceType] += amount

            if (amount === 0) {
                target.store[reservation.resourceType] -= amount
                this.deleteReservation(0)
            }

            if (Memory.roomVisuals) {
                this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
                this.room.visual.text(`${target.store[reservation.resourceType]}`, this.pos.x, this.pos.y + 2, {
                    font: 0.5,
                })
            }

            reservation.amount = amount

            continue
        }

        let amount = reservation.amount

        target.store[reservation.resourceType] -= amount

        if (Memory.roomVisuals) {
            this.room.visual.text(`${amount}`, this.pos.x, this.pos.y + 1, { font: 0.5 })
            this.room.visual.text(`${target.store[reservation.resourceType]}`, this.pos.x, this.pos.y + 2, {
                font: 0.5,
            })
        }
    }
}

Creep.prototype.fulfillReservation = function () {
    if (!this.memory.reservations) return true

    const reservation = this.memory.reservations[0]
    if (!reservation) return true

    const target = findObjectWithID(reservation.targetID)

    const { room } = this

    // If visuals are enabled, show the task targeting

    if (Memory.roomVisuals)
        room.visual.line(this.pos, target.pos, {
            color: myColors.lightBlue,
            width: 0.15,
            opacity: 0.2,
        })

    this.message += '📲'

    if (getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y) > 1) {
        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: target.pos, range: 1 },
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
            this.store[reservation.resourceType] += reservation.amount

            this.movedResource = true
            this.deleteReservation(0)
            return true
        }

        return false
    }

    let amount = 0

    // Transfer

    if (reservation.type === 'transfer') {
        amount = Math.min(reservation.amount, target.freeStore(RESOURCE_ENERGY) + reservation.amount)

        target.store[reservation.resourceType] -= amount
        this.message += amount

        const transferResult = this.transfer(target as any, reservation.resourceType, amount)
        this.message += transferResult

        if (transferResult === ERR_FULL || transferResult === ERR_NOT_ENOUGH_RESOURCES) {
            this.deleteReservation(0)
            return true
        }

        if (transferResult === OK) {
            target.store[reservation.resourceType] += amount
            this.store[reservation.resourceType] -= amount

            this.movedResource = true
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

    target.store[reservation.resourceType] += amount

    const withdrawResult = this.withdraw(target as any, reservation.resourceType, amount)
    this.message += withdrawResult

    if (withdrawResult === ERR_FULL) {
        this.deleteReservation(0)
        return true
    }

    if (withdrawResult === OK) {
        target.store[reservation.resourceType] -= amount
        this.store[reservation.resourceType] += amount

        this.movedResource = true
        this.deleteReservation(0)
        return true
    }

    return false
}

Creep.prototype.reserveWithdrawEnergy = function () {

    if (this.memory.reservations?.length) return

    const { room } = this

    if (!this.needsResources()) return

    let withdrawTargets = room.MAWT.filter(target => {
        if (target instanceof Resource)
            return (
                target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
            )

        return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
    })

    withdrawTargets = withdrawTargets.concat(
        [room.fastFillerContainerLeft, room.fastFillerContainerRight, room.controllerContainer].filter(target => {
            return target && target.store.energy >= target.store.getCapacity(RESOURCE_ENERGY) * 0.5
        }),
    )

    let target
    let amount

    if (withdrawTargets.length) {
        target = findClosestObject(this.pos, withdrawTargets)

        if (target instanceof Resource) amount = target.reserveAmount
        else amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy)

        this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
        return
    }

    withdrawTargets = room.OAWT.filter(target => {
        if (target instanceof Resource)
            return (
                target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
            )

        return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
    })

    if (!withdrawTargets.length) return

    target = findClosestObject(this.pos, withdrawTargets)

    if (target instanceof Resource) amount = target.reserveAmount
    else amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy)

    this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
}

Creep.prototype.reserveTransferEnergy = function () {

    if (this.memory.reservations?.length) return

    const { room } = this

    if (this.usedStore() === 0) return

    let transferTargets = room.MATT.filter(function (target) {
        return target.freeSpecificStore(RESOURCE_ENERGY) > 0
    })

    transferTargets = transferTargets.concat(
        room.MEFTT.filter(target => {
            return (
                (target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
                target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY)
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

    transferTargets = room.OATT.filter(target => {
        return target.freeStore(RESOURCE_ENERGY) >= this.usedStore()
    })

    if (!transferTargets.length) return

    target = findClosestObject(this.pos, transferTargets)

    amount = Math.min(Math.max(this.usedStore(), 0), target.freeStore(RESOURCE_ENERGY))

    this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
}
