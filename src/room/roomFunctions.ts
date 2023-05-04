import {
    allStructureTypes,
    WorkRequestKeys,
    CombatRequestKeys,
    defaultPlainCost,
    defaultSwampCost,
    impassibleStructureTypes,
    impassibleStructureTypesSet,
    maxRampartGroupSize,
    maxRemoteRoomDistance,
    customColors,
    PlayerMemoryKeys,
    roomDimensions,
    roomTypeProperties,
    roomTypes,
    constantRoomTypes,
    stamps,
    defaultStructureTypesByBuildPriority,
    RESULT_FAIL,
    RESULT_NO_ACTION,
    adjacentOffsets,
    RESULT_SUCCESS,
    CreepMemoryKeys,
    RoomMemoryKeys,
    RoomTypes,
} from 'international/constants'
import {
    advancedFindDistance,
    areCoordsEqual,
    cleanRoomMemory,
    createPosMap,
    customLog,
    findAdjacentCoordsToCoord,
    findClosestClaimType,
    findClosestCommuneName,
    findCoordsInsideRect,
    findObjectWithID,
    findDynamicScore,
    getRangeXY,
    isNearRoomEdge,
    newID,
    packAsNum,
    packXYAsNum,
    randomRange,
    unpackNumAsCoord,
    unpackNumAsPos,
    doesCoordExist,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { packCoord, packXYAsCoord, unpackCoord, unpackCoordAsPos, unpackPos, unpackPosList } from 'other/codec'
import { posix } from 'path'
import { BasePlans } from './construction/basePlans'
import { customFindPath } from 'international/customPathFinder'

/**
    @param pos1 pos of the object performing the action
    @param pos2 pos of the object getting acted on
    @param [type] The status of action performed
*/
Room.prototype.actionVisual = function (pos1, pos2, type?) {
    const room = this

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // Construct colors for each type

    const colorsForTypes: { [key: string]: string } = {
        success: customColors.lightBlue,
        fail: customColors.red,
    }

    // If no type, type is success. Construct type from color

    if (!type) type = 'success'
    const color: string = colorsForTypes[type]

    // Create visuals

    room.visual.circle(pos2.x, pos2.y, { stroke: color })
    room.visual.line(pos1, pos2, { color })
}

Room.prototype.targetVisual = function (coord1, coord2, visualize = Memory.roomVisuals) {
    if (!visualize) return

    this.visual.line(coord1.x, coord1.y, coord2.x, coord2.y, { color: customColors.green, opacity: 0.3 })
}

Room.prototype.scoutByRoomName = function () {
    // Find the numbers in the room's name

    const [EWstring, NSstring] = this.name.match(/\d+/g)

    // Convert he numbers from strings into actual numbers

    const EW = parseInt(EWstring)
    const NS = parseInt(NSstring)

    // Use the numbers to deduce some room types - cheaply!

    if (EW % 10 === 0 && NS % 10 === 0) return (this.memory[RoomMemoryKeys.type] = RoomTypes.intersection)
    if (EW % 10 === 0 || NS % 10 === 0) return (this.memory[RoomMemoryKeys.type] = RoomTypes.highway)
    if (EW % 5 === 0 && NS % 5 === 0) return (this.memory[RoomMemoryKeys.type] = RoomTypes.keeperCenter)
    if (Math.abs(5 - (EW % 10)) <= 1 && Math.abs(5 - (NS % 10)) <= 1)
        return (this.memory[RoomMemoryKeys.type] = RoomTypes.keeper)

    return false
}

Room.prototype.scoutRemote = function (scoutingRoom) {
    if (this.scoutEnemyReservedRemote()) return this.memory[RoomMemoryKeys.type]
    if (this.scoutEnemyUnreservedRemote()) return this.memory[RoomMemoryKeys.type]

    if (!scoutingRoom) return this.memory[RoomMemoryKeys.type]
    return this.scoutMyRemote(scoutingRoom)
}

Room.prototype.scoutEnemyReservedRemote = function () {
    const { controller } = this

    if (!controller.reservation) return false
    if (controller.reservation.username === Memory.me) return false
    if (controller.reservation.username === 'Invader') return false

    // If there are roads or containers or sources harvested, inform false

    if (
        !this.roomManager.structures.road &&
        !this.roomManager.structures.container &&
        !this.find(FIND_SOURCES, {
            filter: source => source.ticksToRegeneration > 0,
        })
    )
        return false

    // If the controller is not reserved by an ally

    if (!Memory.allyPlayers.includes(controller.reservation.username)) {
        this.memory[RoomMemoryKeys.owner] = controller.reservation.username
        return (this.memory[RoomMemoryKeys.type] = RoomTypes.enemyRemote)
    }

    // Otherwise if the room is reserved by an ally

    this.memory[RoomMemoryKeys.owner] = controller.reservation.username
    return (this.memory[RoomMemoryKeys.type] = RoomTypes.allyRemote)
}

Room.prototype.scoutEnemyUnreservedRemote = function () {
    const { controller } = this

    if (controller.reservation) {
        if (controller.reservation.username === Memory.me) return false
        if (controller.reservation.username === 'Invader') return false
    }

    const harvestedSources = this.find(FIND_SOURCES, {
        filter: source => source.ticksToRegeneration > 0,
    })
    if (!harvestedSources.length) return false

    // Find creeps that I don't own that aren't invaders

    const creepsNotMine = this.enemyCreeps.concat(this.allyCreeps)

    // Iterate through them

    for (const creep of creepsNotMine) {
        // If the creep is an invdader, iterate

        if (creep.owner.username === 'Invader') continue

        // If the creep has work parts

        if (creep.parts.work > 0) {
            // If the creep is owned by an ally

            if (Memory.allyPlayers.includes(creep.owner.username)) {
                // Set type to allyRemote and stop

                this.memory[RoomMemoryKeys.owner] = creep.owner.username
                return (this.memory[RoomMemoryKeys.type] = RoomTypes.allyRemote)
            }

            // If the creep is not owned by an ally

            // Set type to enemyRemote and stop

            this.memory[RoomMemoryKeys.owner] = creep.owner.username

            /* room.createAttackCombatRequest() */
            this.createHarassCombatRequest()

            return (this.memory[RoomMemoryKeys.type] = RoomTypes.enemyRemote)
        }
    }

    return false
}

Room.prototype.scoutMyRemote = function (scoutingRoom) {
    const roomMemory = Memory.rooms[this.name]
    if (
        roomMemory[RoomMemoryKeys.type] === RoomTypes.remote &&
        !global.communes.has(roomMemory[RoomMemoryKeys.commune])
    )
        roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral

    // If the room is already a remote of the scoutingRoom

    if (
        roomMemory[RoomMemoryKeys.type] === RoomTypes.remote &&
        scoutingRoom.name === roomMemory[RoomMemoryKeys.commune]
    )
        return roomMemory[RoomMemoryKeys.type]

    let distance = Game.map.getRoomLinearDistance(scoutingRoom.name, this.name)

    if (distance > maxRemoteRoomDistance) return roomMemory[RoomMemoryKeys.type]

    // Find distance from scoutingRoom

    if (distance <= maxRemoteRoomDistance)
        distance = advancedFindDistance(scoutingRoom.name, this.name, {
            typeWeights: {
                keeper: Infinity,
                enemy: Infinity,
                enemyRemote: Infinity,
                ally: Infinity,
                allyRemote: Infinity,
            },
        })

    if (distance > maxRemoteRoomDistance) return roomMemory[RoomMemoryKeys.type]

    // Get the anchor from the scoutingRoom, stopping if it's undefined

    const anchor = scoutingRoom.roomManager.anchor
    if (!anchor) return roomMemory[RoomMemoryKeys.type]

    const newSourceEfficacies = []
    let newSourceEfficaciesTotal = 0

    // Get base planning data

    // loop through sourceNames

    for (const source of this.find(FIND_SOURCES)) {
        const path = customFindPath({
            origin: source.pos,
            goals: [{ pos: anchor, range: 4 }],
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                enemyRemote: Infinity,
                allyRemote: Infinity,
            },
            plainCost: defaultPlainCost,
            weightStructurePlans: true,
        })

        if (!path.length) return roomMemory[RoomMemoryKeys.type]

        // Stop if there is a source inefficient enough

        if (path.length > 300) return roomMemory[RoomMemoryKeys.type]

        let newSourceEfficacy = 0

        for (const pos of path) {
            newSourceEfficacy +=
                internationalManager.getTerrainCoords(pos.roomName)[packAsNum(pos)] === TERRAIN_MASK_SWAMP
                    ? defaultSwampCost
                    : 1
        }

        newSourceEfficacies.push(newSourceEfficacy)
        newSourceEfficaciesTotal += newSourceEfficacy
    }

    const newReservationEfficacy = customFindPath({
        origin: this.controller.pos,
        goals: [{ pos: anchor, range: 4 }],
        typeWeights: {
            enemy: Infinity,
            ally: Infinity,
            keeper: Infinity,
            enemyRemote: Infinity,
            allyRemote: Infinity,
        },
    }).length

    if (!newReservationEfficacy) return roomMemory[RoomMemoryKeys.type]

    // If the room isn't already a remote

    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.remote) {
        // Generate new important positions

        const packedRemoteSources = this.roomManager.findRemoteSources(scoutingRoom)
        const packedRemoteSourceHarvestPositions = this.roomManager.findRemoteSourceHarvestPositions(scoutingRoom, packedRemoteSources)
        const packedRemoteSourcePaths = this.roomManager.findRemoteSourcePaths(scoutingRoom, packedRemoteSourceHarvestPositions)
        for (const packedPath of packedRemoteSourcePaths) {
            if (!packedPath.length) {
                console.log('No remote source paths for ' + this.name)
                throw Error('No remote source paths for ' + this.name)
                return roomMemory[RoomMemoryKeys.type]
            }
        }
        console.log('remote work 2 check', packedRemoteSourcePaths)
        const packedRemoteControllerPositions = this.roomManager.findRemoteControllerPositions(scoutingRoom)
        const packedRemoteControllerPath = this.roomManager.findRemoteControllerPath(scoutingRoom, packedRemoteControllerPositions)
        if (!packedRemoteControllerPath.length) throw Error('No remote controller path for ' + this.name)

        roomMemory[RoomMemoryKeys.remoteSources] = packedRemoteSources
        roomMemory[RoomMemoryKeys.remoteSourceHarvestPositions] = packedRemoteSourceHarvestPositions
        roomMemory[RoomMemoryKeys.remoteSourcePaths] = packedRemoteSourcePaths
        roomMemory[RoomMemoryKeys.remoteControllerPositions] = packedRemoteControllerPositions
        roomMemory[RoomMemoryKeys.remoteControllerPath] = packedRemoteControllerPath

        roomMemory[RoomMemoryKeys.reservationEfficacy] = newReservationEfficacy

        roomMemory[RoomMemoryKeys.maxSourceIncome] = []
        roomMemory[RoomMemoryKeys.remoteSourceHarvesters] = []
        roomMemory[RoomMemoryKeys.remoteHaulers] = []

        // Add the room's name to the scoutingRoom's remotes list

        Memory.rooms[scoutingRoom.name][RoomMemoryKeys.remotes].push(this.name)
        roomMemory[RoomMemoryKeys.commune] = scoutingRoom.name
        roomMemory[RoomMemoryKeys.type] = RoomTypes.remote
        console.log('remote paths', roomMemory[RoomMemoryKeys.remoteSourcePaths])
        return roomMemory[RoomMemoryKeys.type]
    }

    const currentRemoteEfficacy =
        roomMemory[RoomMemoryKeys.remoteSourcePaths].reduce((sum, el) => sum + el.length, 0) /
            roomMemory[RoomMemoryKeys.remoteSourcePaths].length +
        roomMemory[RoomMemoryKeys.reservationEfficacy]
    const newRemoteEfficacy = newSourceEfficaciesTotal / newSourceEfficacies.length + newReservationEfficacy

    // If the new average source efficacy is above the current, stop

    if (newRemoteEfficacy >= currentRemoteEfficacy) return roomMemory[RoomMemoryKeys.type]

    // Generate new important positions

    const packedRemoteSources = this.roomManager.findRemoteSources(scoutingRoom)
    const packedRemoteSourceHarvestPositions = this.roomManager.findRemoteSourceHarvestPositions(scoutingRoom, packedRemoteSources)
    const packedRemoteSourcePaths = this.roomManager.findRemoteSourcePaths(scoutingRoom, packedRemoteSourceHarvestPositions)
    for (const packedPath of packedRemoteSourcePaths) {
        if (!packedPath.length) {
            throw Error('No remote source paths for ' + this.name)
            return roomMemory[RoomMemoryKeys.type]
        }
    }

    const packedRemoteControllerPositions = this.roomManager.findRemoteControllerPositions(scoutingRoom)
    const packedRemoteControllerPath = this.roomManager.findRemoteControllerPath(scoutingRoom, packedRemoteControllerPositions)
    if (!packedRemoteControllerPath.length) throw Error('No remote controller path for ' + this.name)

    roomMemory[RoomMemoryKeys.remoteSources] = packedRemoteSources
    roomMemory[RoomMemoryKeys.remoteSourceHarvestPositions] = packedRemoteSourceHarvestPositions
    roomMemory[RoomMemoryKeys.remoteSourcePaths] = packedRemoteSourcePaths
    roomMemory[RoomMemoryKeys.remoteControllerPositions] = packedRemoteControllerPositions
    roomMemory[RoomMemoryKeys.remoteControllerPath] = packedRemoteControllerPath

    roomMemory[RoomMemoryKeys.reservationEfficacy] = newReservationEfficacy

    roomMemory[RoomMemoryKeys.maxSourceIncome] = []
    roomMemory[RoomMemoryKeys.remoteSourceHarvesters] = []
    roomMemory[RoomMemoryKeys.remoteHaulers] = []

    // Add the room's name to the scoutingRoom's remotes list

    Memory.rooms[scoutingRoom.name][RoomMemoryKeys.remotes].push(this.name)
    roomMemory[RoomMemoryKeys.commune] = scoutingRoom.name
    roomMemory[RoomMemoryKeys.type] = RoomTypes.remote

    return roomMemory[RoomMemoryKeys.type]
}

Room.prototype.scoutEnemyRoom = function () {
    const { controller } = this
    const playerName = controller.owner.username
    const roomMemory = this.memory

    let player = Memory.players[playerName]
    if (!player) {
        player = Memory.players[playerName] = {
            [PlayerMemoryKeys.offensiveThreat]: 0,
            [PlayerMemoryKeys.defensiveStrength]: 0,
            [PlayerMemoryKeys.hate]: 0,
            [PlayerMemoryKeys.lastAttacked]: Infinity,
        }
    }

    // General

    const level = controller.level
    roomMemory[RoomMemoryKeys.RCL] = level

    roomMemory[RoomMemoryKeys.powerEnabled] = controller.isPowerEnabled

    // Offensive threat

    let threat = 0

    threat += Math.pow(level, 2)

    threat += this.roomManager.structures.spawn.length * 50
    threat += this.roomManager.structures.nuker.length * 300
    threat += Math.pow(this.roomManager.structures.lab.length * 10000, 0.4)

    threat = Math.floor(threat)

    roomMemory[RoomMemoryKeys.offensiveThreat] = threat
    Memory.players[playerName][PlayerMemoryKeys.offensiveThreat] = Math.max(
        threat,
        player[PlayerMemoryKeys.offensiveThreat],
    )

    // Defensive threat

    threat = 0

    const energy = this.resourcesInStoringStructures.energy

    roomMemory[RoomMemoryKeys.energy] = energy
    threat += Math.pow(energy, 0.5)

    const ramparts = this.roomManager.structures.rampart
    const avgRampartHits = ramparts.reduce((total, rampart) => total + rampart.hits, 0) / ramparts.length

    threat += Math.pow(avgRampartHits, 0.5)
    threat += this.roomManager.structures.spawn.length * 100
    threat += this.roomManager.structures.tower.length * 300
    threat += Math.pow(this.roomManager.structures.extension.length * 400, 0.8)

    const hasTerminal = this.terminal !== undefined

    if (hasTerminal) {
        threat += 800

        roomMemory[RoomMemoryKeys.terminal] = true
    }

    threat = Math.floor(threat)

    roomMemory[RoomMemoryKeys.defensiveStrength] = threat
    Memory.players[playerName][PlayerMemoryKeys.defensiveStrength] = Math.max(
        threat,
        player[PlayerMemoryKeys.defensiveStrength],
    )

    // Combat request creation

    this.createAttackCombatRequest({
        [CombatRequestKeys.maxTowerDamage]: Math.ceil(
            this.roomManager.structures.tower.length * TOWER_POWER_ATTACK * 1.1,
        ),
        [CombatRequestKeys.minDamage]: 50,
    })

    roomMemory[RoomMemoryKeys.type] = RoomTypes.enemy
    return roomMemory[RoomMemoryKeys.type]
}

Room.prototype.basicScout = function () {
    const { controller } = this

    // Record that the room was scouted this tick

    this.memory[RoomMemoryKeys.lastScout] = Game.time

    if (!controller) return this.memory[RoomMemoryKeys.type]

    // If the contoller is owned

    if (controller.owner) {
        // Stop if the controller is owned by me

        if (controller.my) return this.memory[RoomMemoryKeys.type]

        const owner = controller.owner.username
        this.memory[RoomMemoryKeys.owner] = owner

        // If the controller is owned by an ally

        if (Memory.allyPlayers.includes(owner)) return (this.memory[RoomMemoryKeys.type] = RoomTypes.ally)

        return this.scoutEnemyRoom()
    }

    this.createWorkRequest()

    // No controller owner

    if (this.scoutRemote()) return this.memory[RoomMemoryKeys.type]

    return (this.memory[RoomMemoryKeys.type] = RoomTypes.neutral)
}

Room.prototype.advancedScout = function (scoutingRoom: Room) {
    const { controller } = this

    // Record that the room was scouted this tick

    this.memory[RoomMemoryKeys.lastScout] = Game.time

    if (constantRoomTypes.has(this.memory[RoomMemoryKeys.type])) return this.memory[RoomMemoryKeys.type]
    if (this.scoutByRoomName()) return this.memory[RoomMemoryKeys.type]

    // If there is a controller

    if (controller) {
        // If the contoller is owned

        if (controller.owner) {
            // Stop if the controller is owned by me

            if (controller.my) return this.memory[RoomMemoryKeys.type]

            const owner = controller.owner.username

            this.memory[RoomMemoryKeys.owner] = owner

            // If the controller is owned by an ally

            if (Memory.allyPlayers.includes(owner)) return (this.memory[RoomMemoryKeys.type] = RoomTypes.ally)

            return this.scoutEnemyRoom()
        }

        this.createWorkRequest()

        // No controlller owner

        if (this.scoutRemote(scoutingRoom)) return this.memory[RoomMemoryKeys.type]

        return (this.memory[RoomMemoryKeys.type] = RoomTypes.neutral)
    }

    return this.memory[RoomMemoryKeys.type]
}

Room.prototype.createAttackCombatRequest = function (opts) {
    if (!Memory.autoAttack) return
    if (this.controller && this.controller.safeMode) return

    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request[CombatRequestKeys.type] !== 'attack') return

        if (!opts) return

        Object.assign(request, opts)
        return
    }

    if (
        !this.enemyCreeps.length &&
        !this.find(FIND_HOSTILE_STRUCTURES).find(structure => structure.structureType !== STRUCTURE_CONTROLLER)
    )
        return
    if (Memory.nonAggressionPlayers.includes(this.memory[RoomMemoryKeys.owner])) return

    request = Memory.combatRequests[this.name] = {
        [CombatRequestKeys.type]: 'attack',
    }

    request[CombatRequestKeys.minDamage] = 10
    request[CombatRequestKeys.minMeleeHeal] = 10
    request[CombatRequestKeys.minRangedHeal] = 10
    request[CombatRequestKeys.quadQuota] = 1

    if (opts) {
        Object.assign(request, opts)
        return
    }
}

Room.prototype.createHarassCombatRequest = function (opts) {
    if (!Memory.autoAttack) return

    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request[CombatRequestKeys.type] !== 'harass') return

        if (!opts) return

        Object.assign(request, opts)
        return
    }

    if (!this.enemyCreeps.length) return
    if (Memory.nonAggressionPlayers.includes(this.memory[RoomMemoryKeys.owner])) return
    if (this.enemyAttackers.length > 0) return

    request = Memory.combatRequests[this.name] = {
        [CombatRequestKeys.type]: 'harass',
    }

    request[CombatRequestKeys.minDamage] = 10
    request[CombatRequestKeys.minMeleeHeal] = 10
    request[CombatRequestKeys.minRangedHeal] = 10

    if (opts) {
        Object.assign(request, opts)
        return
    }

    /*
    const structures = this[CreepMemoryKeys.structureTarget]s

    let totalHits = 0
    for (const structure of structures) totalHits += structure.hits

    if (structures.length > 0)
        request[CombatRequestKeys.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
 */
}

Room.prototype.createDefendCombatRequest = function (opts) {
    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request[CombatRequestKeys.type] !== 'defend') return

        if (!opts) return

        Object.assign(request, opts)
        return
    }

    request = Memory.combatRequests[this.name] = {
        [CombatRequestKeys.type]: 'defend',
    }

    request[CombatRequestKeys.inactionTimer] = 0
    request[CombatRequestKeys.inactionTimerMax] = randomRange(5000, 5000 + Math.floor(Math.random() * 5000))

    if (opts) {
        Object.assign(request, opts)
        return
    }

    request[CombatRequestKeys.minDamage] = 40
    request[CombatRequestKeys.minMeleeHeal] = 10
    request[CombatRequestKeys.minRangedHeal] = 10
}

Room.prototype.distanceTransform = function (
    initialCoords,
    visuals,
    minAvoid = 1,
    x1 = 0,
    y1 = 0,
    x2 = roomDimensions - 1,
    y2 = roomDimensions - 1,
) {
    // Use a costMatrix to record distances

    const distanceCoords = new Uint8Array(2500)

    if (!initialCoords) initialCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))

    let x
    let y
    let minX = Math.max(x1 - 1, 0)
    let minY = Math.max(y1 - 1, 0)
    let maxX = Math.min(x2 + 1, roomDimensions - 1)
    let maxY = Math.min(y2 + 1, roomDimensions - 1)
    let packedCoord

    for (x = minX; x <= maxX; x += 1) {
        for (y = minY; y <= maxY; y += 1) {
            packedCoord = packXYAsNum(x, y)
            distanceCoords[packedCoord] = initialCoords[packedCoord] >= minAvoid ? 0 : 255
        }
    }

    let top
    let left
    let topLeft
    let topRight
    let bottomLeft

    // Loop through the xs and ys inside the bounds

    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            top = distanceCoords[packXYAsNum(x, y - 1)] || 0
            left = distanceCoords[packXYAsNum(x - 1, y)] || 0
            topLeft = distanceCoords[packXYAsNum(x - 1, y - 1)] || 0
            topRight = distanceCoords[packXYAsNum(x + 1, y - 1)] || 0
            bottomLeft = distanceCoords[packXYAsNum(x - 1, y + 1)] || 0

            packedCoord = packXYAsNum(x, y)

            distanceCoords[packedCoord] = Math.min(
                Math.min(top, left, topLeft, topRight, bottomLeft) + 1,
                distanceCoords[packedCoord],
            )
        }
    }

    let bottom
    let right
    let bottomRight

    // Loop through the xs and ys inside the bounds

    for (x = x2; x >= x1; x -= 1) {
        for (y = y2; y >= y1; y -= 1) {
            bottom = distanceCoords[packXYAsNum(x, y + 1)] || 0
            right = distanceCoords[packXYAsNum(x + 1, y)] || 0
            bottomRight = distanceCoords[packXYAsNum(x + 1, y + 1)] || 0
            topRight = distanceCoords[packXYAsNum(x + 1, y - 1)] || 0
            bottomLeft = distanceCoords[packXYAsNum(x - 1, y + 1)] || 0

            packedCoord = packXYAsNum(x, y)

            distanceCoords[packedCoord] = Math.min(
                Math.min(bottom, right, bottomRight, topRight, bottomLeft) + 1,
                distanceCoords[packedCoord],
            )
        }
    }

    if (visuals) {
        // Loop through the xs and ys inside the bounds

        for (x = x1; x <= x2; x += 1) {
            for (y = y1; y <= y2; y += 1) {
                this.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${distanceCoords[packXYAsNum(x, y)] * 10}, 100%, 60%)`,
                    opacity: 0.4,
                })
                this.visual.text(distanceCoords[packXYAsNum(x, y)].toString(), x, y)
            }
        }
    }

    return distanceCoords
}

Room.prototype.diagonalDistanceTransform = function (
    initialCoords,
    visuals,
    minAvoid = 1,
    x1 = 0,
    y1 = 0,
    x2 = roomDimensions - 1,
    y2 = roomDimensions - 1,
) {
    // Use a costMatrix to record distances

    const distanceCoords = new Uint8Array(2500)

    if (!initialCoords) initialCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))

    let x
    let y
    let packedCoord

    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            packedCoord = packXYAsNum(x, y)
            distanceCoords[packedCoord] = initialCoords[packedCoord] >= minAvoid ? 0 : 255
        }
    }

    let top
    let left

    // Loop through the xs and ys inside the bounds

    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            top = distanceCoords[packXYAsNum(x, y - 1)] || 0
            left = distanceCoords[packXYAsNum(x - 1, y)] || 0

            packedCoord = packXYAsNum(x, y)

            distanceCoords[packedCoord] = Math.min(Math.min(top, left) + 1, distanceCoords[packedCoord])
        }
    }

    let bottom
    let right

    // Loop through the xs and ys inside the bounds

    for (x = x2; x >= x1; x -= 1) {
        for (y = y2; y >= y1; y -= 1) {
            bottom = distanceCoords[packXYAsNum(x, y + 1)] || 0
            right = distanceCoords[packXYAsNum(x + 1, y)] || 0

            packedCoord = packXYAsNum(x, y)

            distanceCoords[packedCoord] = Math.min(Math.min(bottom, right) + 1, distanceCoords[packedCoord])
        }
    }

    if (visuals) {
        // Loop through the xs and ys inside the bounds

        for (x = x1; x <= x2; x += 1) {
            for (y = y1; y <= y2; y += 1) {
                this.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${distanceCoords[packXYAsNum(x, y)] * 10}, 100%, 60%)`,
                    opacity: 0.4,
                })
                this.visual.text(distanceCoords[packXYAsNum(x, y)].toString(), x, y)
            }
        }
    }

    return distanceCoords
}

Room.prototype.floodFill = function (seeds, coordMap, visuals) {
    // Construct a cost matrix for the flood

    const floodCoords = new Uint8Array(2500)
    const terrainCoords = new Uint8Array(internationalManager.getTerrainCoords(this.name))
    const visitedCoords = new Uint8Array(2500)

    // Construct values for the flood

    let depth = 0
    let thisGeneration = seeds
    let nextGeneration: Coord[] = []

    // Loop through positions of seeds

    for (const coord of seeds) visitedCoords[packAsNum(coord)] = 1

    // So long as there are positions in this gen

    while (thisGeneration.length) {
        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const coord1 of thisGeneration) {
            // If the depth isn't 0

            if (depth > 0) {
                const packedCoord1 = packAsNum(coord1)

                // Iterate if the terrain is a wall

                if (terrainCoords[packedCoord1] === 255) continue

                if (coordMap && coordMap[packAsNum(coord1)] > 0) continue

                // Otherwise so long as the pos isn't a wall record its depth in the flood cost matrix

                floodCoords[packedCoord1] = depth

                // If visuals are enabled, show the depth on the pos
                /*
                if (visuals)
                    this.visual.rect(coord1.x - 0.5, coord1.y - 0.5, 1, 1, {
                        fill: `hsl(${200}${depth * 2}, 100%, 60%)`,
                        opacity: 0.4,
                    })
                     */
            }

            // Loop through adjacent positions

            for (const offset of adjacentOffsets) {
                const coord2 = {
                    x: coord1.x + offset.x,
                    y: coord1.y + offset.y,
                }

                const packedCoord2 = packAsNum(coord2)

                // Iterate if the adjacent pos has been visited or isn't a tile

                if (visitedCoords[packedCoord2] === 1) continue

                // Otherwise record that it has been visited

                visitedCoords[packedCoord2] = 1

                // Add it to the next gen

                nextGeneration.push(coord2)
            }
        }

        // Set this gen to next gen

        thisGeneration = nextGeneration

        // Increment depth

        depth += 1
    }

    return floodCoords
}

Room.prototype.findClosestPos = function (opts) {
    // Construct a cost matrix for visited tiles and add seeds to it

    let visitedCoords = new Uint8Array(2500)

    // Record startPos as visited

    for (const coord of opts.sources) visitedCoords[packAsNum(coord)] = 1

    // Construct values for the check

    let thisGeneration = opts.sources
    let nextGeneration: Coord[] = []
    let depth = 0

    // So long as there are positions in this gen

    while (thisGeneration.length) {
        // Reset nextGeneration

        nextGeneration = []

        let localVisitedCoords = new Uint8Array(visitedCoords)

        // Flood cardinal directions, excluding impassibles

        if (opts.cardinalFlood) {
            // Iterate through positions of this gen

            for (const coord of thisGeneration) {
                // If the pos can be an anchor, inform it

                if (opts.targetCondition(coord)) return new RoomPosition(coord.x, coord.y, this.name)

                // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                const adjacentCoords = [
                    {
                        x: coord.x - 1,
                        y: coord.y,
                    },
                    {
                        x: coord.x + 1,
                        y: coord.y,
                    },
                    {
                        x: coord.x,
                        y: coord.y - 1,
                    },
                    {
                        x: coord.x,
                        y: coord.y + 1,
                    },
                ]

                // Loop through adjacent positions

                for (const coord2 of adjacentCoords) {
                    if (!doesCoordExist(coord2)) continue

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                    // Otherwise record that it has been visited

                    localVisitedCoords[packAsNum(coord2)] = 1

                    if (opts.coordMap[packAsNum(coord2)] === 255) continue

                    // Add it tofastFillerSide the next gen

                    nextGeneration.push(coord2)
                }
            }
        }

        // Flood all adjacent positions excluding diagonals

        if (!nextGeneration.length) {
            localVisitedCoords = new Uint8Array(visitedCoords)

            // Iterate through positions of this gen

            for (const coord of thisGeneration) {
                // If the pos can be an anchor, inform it

                if (opts.targetCondition(coord)) return new RoomPosition(coord.x, coord.y, this.name)

                // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                const adjacentCoords = findCoordsInsideRect(coord.x - 1, coord.y - 1, coord.x + 1, coord.y + 1)

                // Loop through adjacent positions

                for (const coord2 of adjacentCoords) {
                    if (!doesCoordExist(coord2)) continue

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                    // Otherwise record that it has been visited

                    localVisitedCoords[packAsNum(coord2)] = 1

                    if (opts.coordMap[packAsNum(coord2)] === 255) continue

                    // Add it tofastFillerSide the next gen

                    nextGeneration.push(coord2)
                }
            }
        }

        // Flood all adjacent positions, including diagonals

        if (!nextGeneration.length) {
            localVisitedCoords = new Uint8Array(visitedCoords)

            // Iterate through positions of this gen

            for (const coord of thisGeneration) {
                // If the pos can be an anchor, inform it

                if (opts.targetCondition(coord)) return new RoomPosition(coord.x, coord.y, this.name)

                // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                const adjacentCoords = findCoordsInsideRect(coord.x - 1, coord.y - 1, coord.x + 1, coord.y + 1)
                // Loop through adjacent positions

                for (const coord2 of adjacentCoords) {
                    if (!doesCoordExist(coord2)) continue

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                    // Otherwise record that it has been visited

                    localVisitedCoords[packAsNum(coord2)] = 1

                    // Add it tofastFillerSide the next gen

                    nextGeneration.push(coord2)
                }
            }
        }

        if (opts.visuals) {
            for (const coord of nextGeneration) {
                this.visual.text(opts.coordMap[packAsNum(coord)].toString(), coord.x, coord.y, {
                    font: 0.5,
                    color: customColors.yellow,
                })

                this.visual.text(depth.toString(), coord.x, coord.y + 0.5, {
                    font: 0.5,
                    color: customColors.green,
                })
            }
        }

        // Set this gen to next gen

        visitedCoords = new Uint8Array(localVisitedCoords)
        thisGeneration = nextGeneration
        depth += 1
    }

    // Inform false if no value was found

    return false
}

Room.prototype.findClosestPosOfValue = function (opts) {
    const room = this

    if (opts.visuals) {
        for (const coord of opts.startCoords)
            this.visual.circle(coord.x, coord.y, {
                stroke: customColors.yellow,
            })
    }

    /**
     *
     */
    function isViableAnchor(coord1: Coord, iterations: number): boolean {
        // Get the value of the pos4271

        const posValue = opts.coordMap[packAsNum(coord1)]
        if (posValue === 255) return false
        if (posValue === 0) return false

        // We don't want to plan to close to exits for target given value

        if (opts.protectionOffset) {
            if (isNearRoomEdge(coord1, opts.protectionOffset)) {
                const nearbyCoords = findCoordsInsideRect(
                    coord1.x - opts.protectionOffset,
                    coord1.y - opts.protectionOffset,
                    coord1.x + opts.protectionOffset,
                    coord1.y + opts.protectionOffset,
                )

                for (const coord of nearbyCoords) {
                    if (room.exitCoords.has(packCoord(coord))) {
                        room.visual.circle(coord1.x, coord1.y, { fill: customColors.red })
                        return false
                    }
                }
            }
        }

        /*
        if (opts.spaceFromExits && iterations <= opts.requiredValue) {
            room.visual.circle(coord1.x, coord1.y, { fill: customColors.red })
            return false
        }
 */
        // If the posValue is less than the requiredValue, inform false

        if (posValue < opts.requiredValue) return false

        // If adjacentToRoads is a requirement

        if (!opts.adjacentToRoads) return true

        if (opts.roadCoords[packAsNum(coord1)] > 0) return false

        // Loop through adjacent positions

        for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
            // If the adjacentPos isn't a roadPosition, iterate

            if (opts.roadCoords[packAsNum(coord2)] !== 1) continue

            // Otherwise set nearbyRoad to true and stop the loop

            return true
        }

        return false
    }

    while (opts.reduceIterations >= 0) {
        // Construct a cost matrix for visited tiles and add seeds to it

        let visitedCoords = new Uint8Array(2500)

        // Record startPos as visited

        for (const coord of opts.startCoords) visitedCoords[packAsNum(coord)] = 1

        // Construct values for the check

        let thisGeneration = opts.startCoords
        let nextGeneration: Coord[] = []
        let i = 0

        // So long as there are positions in this gen

        while (thisGeneration.length) {
            // Reset nextGeneration

            nextGeneration = []
            i++

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood cardinal directions, excluding impassibles

            if (opts.cardinalFlood) {
                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1, i)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = [
                        {
                            x: coord1.x - 1,
                            y: coord1.y,
                        },
                        {
                            x: coord1.x + 1,
                            y: coord1.y,
                        },
                        {
                            x: coord1.x,
                            y: coord1.y - 1,
                        },
                        {
                            x: coord1.x,
                            y: coord1.y + 1,
                        },
                    ]

                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (opts.coordMap[packAsNum(coord2)] === 0) continue

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions excluding diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1, i)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)

                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (opts.coordMap[packAsNum(coord2)] === 0) continue

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions, including diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1, i)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)
                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            if (opts.visuals) {
                for (const coord of nextGeneration)
                    this.visual.text(opts.coordMap[packAsNum(coord)].toString(), coord.x, coord.y, {
                        font: 0.5,
                        color: customColors.yellow,
                    })
            }

            // Set this gen to next gen

            visitedCoords = new Uint8Array(localVisitedCoords)
            thisGeneration = nextGeneration
        }

        opts.reduceIterations -= 1
        opts.requiredValue -= 1
    }

    // Inform false if no value was found

    return false
}

Room.prototype.findClosestPosOfValueAsym = function (opts) {
    const room = this

    if (opts.visuals) {
        for (const coord of opts.startCoords)
            this.visual.circle(coord.x, coord.y, {
                stroke: customColors.yellow,
            })
    }

    /**
     *
     */
    function isViableAnchor(coord1: Coord): boolean {
        // Get the value of the pos4271

        const posValue = opts.coordMap[packAsNum(coord1)]
        if (posValue === 255) return false
        if (posValue === 0) return false

        // If the posValue is less than the requiredValue, inform false

        if (posValue < opts.requiredValue) return false

        // Loop through adjacent positions

        for (const coord2 of findCoordsInsideRect(
            coord1.x - opts.offset,
            coord1.y - opts.offset,
            coord1.x + opts.offset + opts.asymOffset,
            coord1.y + opts.offset + opts.asymOffset,
        )) {
            // If the adjacentPos isn't walkable, iterate

            if (opts.coordMap[packAsNum(coord2)] === 0) return false
        }
        /*
        for (const coord2 of findCoordsInsideRect(coord1.x - opts.offset, coord1.y - opts.offset, coord1.x + opts.offset + opts.asymOffset, coord1.y + opts.offset + opts.asymOffset)) {
            // If the adjacentPos isn't walkable, iterate
            room.visual.text(opts.coordMap[packAsNum(coord2)].toString(), coord2.x, coord2.y)
        }
 */
        // If adjacentToRoads is a requirement

        if (!opts.adjacentToRoads) return true

        if (opts.roadCoords[packAsNum(coord1)] > 0) return false

        // Loop through adjacent positions

        for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
            // If the adjacentPos isn't a roadPosition, iterate

            if (opts.roadCoords[packAsNum(coord2)] !== 1) continue

            // Otherwise set nearbyRoad to true and stop the loop

            return true
        }

        return false
    }

    while (opts.reduceIterations >= 0) {
        // Construct a cost matrix for visited tiles and add seeds to it

        let visitedCoords = new Uint8Array(2500)

        // Record startPos as visited

        for (const coord of opts.startCoords) visitedCoords[packAsNum(coord)] = 1

        // Construct values for the check

        let thisGeneration = opts.startCoords
        let nextGeneration: Coord[] = []
        let i = 0
        // So long as there are positions in this gen

        while (thisGeneration.length) {
            // Reset nextGeneration

            nextGeneration = []
            i++

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood cardinal directions, excluding impassibles

            if (opts.cardinalFlood) {
                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = [
                        {
                            x: coord1.x - 1,
                            y: coord1.y,
                        },
                        {
                            x: coord1.x + 1,
                            y: coord1.y,
                        },
                        {
                            x: coord1.x,
                            y: coord1.y - 1,
                        },
                        {
                            x: coord1.x,
                            y: coord1.y + 1,
                        },
                    ]

                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (opts.coordMap[packAsNum(coord2)] === 0) continue

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions excluding diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)

                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (opts.coordMap[packAsNum(coord2)] === 0) continue

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions, including diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // If the pos can be an anchor, inform it

                    if (isViableAnchor(coord1)) return new RoomPosition(coord1.x, coord1.y, room.name)

                    // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

                    const adjacentCoords = findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)
                    // Loop through adjacent positions

                    for (const coord2 of adjacentCoords) {
                        // Iterate if the pos doesn't map onto a room

                        if (coord2.x < 0 || coord2.x >= roomDimensions || coord2.y < 0 || coord2.y >= roomDimensions)
                            continue

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[packAsNum(coord2)] = 1

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            if (opts.visuals) {
                for (const coord of nextGeneration)
                    this.visual.text(opts.coordMap[packAsNum(coord)].toString(), coord.x, coord.y, {
                        font: 0.5,
                        color: customColors.yellow,
                    })
            }

            // Set this gen to next gen

            visitedCoords = new Uint8Array(localVisitedCoords)
            thisGeneration = nextGeneration
        }

        opts.reduceIterations -= 1
        opts.requiredValue -= 1
    }

    // Inform false if no value was found

    return false
}

Room.prototype.pathVisual = function (path, color, visualize = Memory.roomVisuals) {
    if (!visualize) return

    if (!path.length) return

    // Filter only positions in the path that are in the path's starting room

    const currentRoomName = path[0].roomName

    for (let index = 0; index < path.length; index += 1) {
        const pos = path[index]

        if (pos.roomName === currentRoomName) continue

        path.splice(index, path.length - 1)
        break
    }

    // Generate the visual

    this.visual.poly(path, {
        stroke: customColors[color],
        strokeWidth: 0.15,
        opacity: 0.3,
    })
}

Room.prototype.errorVisual = function (coord, visualize = Memory.roomVisuals) {
    if (!visualize) return

    this.visual.circle(coord.x, coord.y, {
        fill: '',
        stroke: customColors.red,
        radius: 0.5,
        strokeWidth: 0.15,
        opacity: 0.3,
    })
}

Room.prototype.findAllyCSiteTargetID = function (creep) {
    // If there are no sites inform false

    if (!this.allyCSites.length) return false

    // Loop through structuretypes of the build priority

    for (const structureType of defaultStructureTypesByBuildPriority) {
        // Get the structures with the relevant type

        const cSitesOfType = this.allyCSitesByType[structureType]

        // If there are no cSites of this type, iterate

        if (!cSitesOfType.length) continue

        // Otherwise get the anchor, using the creep's pos if undefined, or using the center of the room if there is no creep

        const anchor = this.roomManager.anchor || creep?.pos || new RoomPosition(25, 25, this.name)

        // Record the closest site to the anchor in the room's global and inform true

        this.memory[RoomMemoryKeys.constructionSiteTarget] = anchor.findClosestByPath(cSitesOfType, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
            range: 3,
        }).id
        return true
    }

    // If no cSiteTarget was found, inform false

    return false
}

Room.prototype.findUnprotectedCoords = function (visuals) {
    // Construct a cost matrix for the flood

    this.unprotectedCoords = new Uint8Array(2500)
    const visitedCoords = new Uint8Array(2500)

    // Construct values for the flood

    let depth = 0
    let thisGeneration: Coord[] = this.find(FIND_EXIT)
    let nextGeneration: Coord[] = []

    // Loop through positions of seeds

    for (const coord of thisGeneration) visitedCoords[packAsNum(coord)] = 1

    // So long as there are positions in this gen

    while (thisGeneration.length) {
        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const coord1 of thisGeneration) {
            // If the depth isn't 0

            if (depth > 0) {
                const packedCoord1 = packAsNum(coord1)

                // Iterate if the terrain is a wall

                if (this.rampartCoords[packedCoord1] > 0) continue

                // Otherwise so long as the pos isn't a wall record its depth in the flood cost matrix

                this.unprotectedCoords[packedCoord1] = depth * 10 + 10

                // If visuals are enabled, show the depth on the pos
                /*
                if (visuals)
                    this.visual.rect(coord1.x - 0.5, coord1.y - 0.5, 1, 1, {
                        fill: `hsl(${200}${depth * 2}, 100%, 60%)`,
                        opacity: 0.4,
                    })
                    this.visual.text(depth.toString(), coord1.x, coord1.y)
 */
            }

            // Loop through adjacent positions

            for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
                const packedCoord2 = packAsNum(coord2)

                // Iterate if the adjacent pos has been visited or isn't a tile

                if (visitedCoords[packedCoord2] === 1) continue

                // Otherwise record that it has been visited

                visitedCoords[packedCoord2] = 1

                // Add it to the next gen

                nextGeneration.push(coord2)
            }
        }

        // Set this gen to next gen

        thisGeneration = nextGeneration

        // Increment depth

        depth += 1
    }
}

Room.prototype.groupRampartPositions = function (rampartPositions) {
    const room = this

    // Construct a costMatrix to store visited positions

    const visitedCoords = new Uint8Array(2500)

    const groupedPositions = []
    let groupIndex = 0

    // Loop through each pos of positions

    for (const packedPos of rampartPositions) {
        const pos = unpackNumAsCoord(packedPos)

        // If the pos has already been visited, iterate

        if (visitedCoords[packAsNum(pos)] === 1) continue

        // Record that this pos has been visited

        visitedCoords[packAsNum(pos)] = 1

        // Construct the group for this index with the pos in it the group

        groupedPositions[groupIndex] = [new RoomPosition(pos.x, pos.y, room.name)]

        // Construct values for floodFilling

        let thisGeneration = [pos]
        let nextGeneration: Coord[] = []
        let groupSize = 0

        // So long as there are positions in this gen

        while (thisGeneration.length) {
            // Reset next gen

            nextGeneration = []

            // Iterate through positions of this gen

            for (const pos of thisGeneration) {
                // Loop through adjacent positions

                for (const adjacentPos of findAdjacentCoordsToCoord(pos)) {
                    const packedAdjacentCoord = packAsNum(adjacentPos)

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (visitedCoords[packedAdjacentCoord] === 1) continue

                    // Otherwise record that it has been visited

                    visitedCoords[packedAdjacentCoord] = 1

                    // If a rampart is not planned for this position, iterate

                    if (this.rampartCoords[packAsNum(adjacentPos)] !== 1) continue

                    // Add it to the next gen and this group

                    groupedPositions[groupIndex].push(new RoomPosition(adjacentPos.x, adjacentPos.y, room.name))

                    groupSize += 1
                    nextGeneration.push(adjacentPos)
                }
            }

            if (groupSize >= maxRampartGroupSize) break

            // Set this gen to next gen

            thisGeneration = nextGeneration
        }

        // Increase the groupIndex

        groupIndex += 1
    }

    // Inform groupedPositions

    return groupedPositions
}

Room.prototype.findPositionsInsideRect = function (x1, y1, x2, y2) {
    // Construct positions

    const positions = []

    // Loop through coordinates inside the rect

    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push(new RoomPosition(x, y, this.name))
        }
    }

    // Inform positions

    return positions
}

Room.prototype.findAdjacentPositions = function (rx, ry) {
    // Construct positions

    const positions = []

    // Loop through coordinates inside the rect

    for (let x = rx - 1; x <= rx + 1; x += 1) {
        for (let y = ry - 1; y <= ry + 1; y += 1) {
            if (x === rx && y === ry) continue

            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push(new RoomPosition(x, y, this.name))
        }
    }

    // Inform positions

    return positions
}

Room.prototype.getPartsOfRole = function (role) {
    if (this.partsOfRoles[role]) return this.partsOfRoles[role]

    this.partsOfRoles[role] = {}

    // Loop through every creepName in the creepsFromRoom of the specified role

    for (const creepName of this.creepsFromRoom[role]) {
        const creep = Game.creeps[creepName]

        for (const key in creep.parts) {
            const partType = key as BodyPartConstant

            if (!this.partsOfRoles[role][partType]) {
                this.partsOfRoles[role][partType] = 1
                continue
            }

            this.partsOfRoles[role][partType] += 1
        }
    }

    return this.partsOfRoles[role]
}

Room.prototype.createWorkRequest = function () {
    if (this.find(FIND_SOURCES).length < 2) return false
    if (Memory.workRequests[this.name]) return false

    findDynamicScore(this.name)

    const communePlanned = Memory.rooms[this.name][RoomMemoryKeys.communePlanned]
    if (communePlanned === false) return false

    if (communePlanned !== true) {
        const result = this.roomManager.communePlanner.preTickRun()
        if (result === RESULT_FAIL) {
            this.memory[RoomMemoryKeys.communePlanned] = false
            return false
        }

        if (result !== RESULT_SUCCESS) {
            return false
        }
    }

    const request = (Memory.workRequests[this.name] = {})

    return true
}

Room.prototype.findSwampPlainsRatio = function () {
    const terrainAmounts = [0, 0, 0]

    const terrain = this.getTerrain()

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            terrainAmounts[terrain.get(x, y)] += 1
        }
    }

    return terrainAmounts[TERRAIN_MASK_SWAMP] / terrainAmounts[0]
}

Room.prototype.visualizeCoordMap = function (coordMap, color, magnification = 2) {
    if (color) {
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                this.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${coordMap[packXYAsNum(x, y)] * magnification}, 100%, 60%)`,
                    opacity: 0.4,
                })
            }
        }

        return
    }

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            this.visual.text(coordMap[packXYAsNum(x, y)].toString(), x, y, {
                font: 0.5,
            })
        }
    }
}

Room.prototype.visualizeCostMatrix = function (cm, color, magnification = 2) {
    if (color) {
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                this.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${cm.get(x, y) * magnification}, 100%, 60%)`,
                    opacity: 0.4,
                })
            }
        }

        return
    }

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            this.visual.text(cm.get(x, y).toString(), x, y, {
                font: 0.5,
            })
        }
    }
}

Room.prototype.coordHasStructureTypes = function (coord, types) {
    for (const structure of this.lookForAt(LOOK_STRUCTURES, coord.x, coord.y)) {
        if (!types.has(structure.structureType)) continue

        return true
    }

    return false
}

Room.prototype.createPowerTask = function (target, powerType, priority) {
    // There is already has a power creep responding to this target with the power
    customLog('MADE POWER TASK FOR', target)
    if (target.reservePowers.has(powerType)) return false

    // Create a power task with info on the cooldown

    const effect = target.effectsData.get(powerType)
    const cooldown = effect ? effect.ticksRemaining : 0

    const ID = internationalManager.newTickID()

    return (this.powerTasks[ID] = {
        taskID: ID,
        targetID: target.id,
        powerType,
        packedCoord: packCoord(target.pos),
        cooldown,
        priority,
    })
}

Room.prototype.highestWeightedStoringStructures = function (resourceType) {
    if (!this.storage && this.terminal) return false

    if (!this.storage) return this.terminal
    if (!this.terminal) return this.storage

    if (this.storage.store.getUsedCapacity(resourceType) * 3 > this.terminal.store.getUsedCapacity(resourceType))
        return this.storage
    return this.terminal
}

Room.prototype.createRoomLogisticsRequest = function (args) {
    // Don't make requests when there is nobody to respond

    if (!this.myCreepsAmount) return RESULT_NO_ACTION

    if (!args.resourceType) args.resourceType = RESOURCE_ENERGY
    // We can only handle energy until we have a storage or terminal
    else if (args.resourceType !== RESOURCE_ENERGY && !this.advancedLogistics) return RESULT_FAIL

    let amount: number

    // Make sure we are not infringing on the threshold

    if (args.target instanceof Resource) {
        amount = (args.target as Resource).reserveAmount

        if (amount < 1) return RESULT_FAIL
    } else if (args.type === 'transfer') {
        if (args.target.reserveStore[args.resourceType] >= args.target.store.getCapacity(args.resourceType))
            return RESULT_FAIL

        amount = args.target.freeReserveStoreOf(args.resourceType)
        /* this.visual.text(args.target.reserveStore[args.resourceType].toString(), args.target.pos) */
    }

    // Offer or withdraw types
    else {
        amount = args.target.reserveStore[args.resourceType]

        // We don't have enough resources to make a request

        if (amount < 1) return RESULT_FAIL

        if (args.maxAmount) amount = Math.min(amount, Math.round(args.maxAmount))
    }

    if (args.priority === undefined) args.priority = 1
    else args.priority = Math.round(args.priority * 100) / 100

    const ID = internationalManager.newTickID()
    /* this.visual.text(args.priority.toString(), args.target.pos) */
    /* this.visual.resource(args.resourceType, args.target.pos.x, args.target.pos.y) */
    /* if (args.type === 'transfer') this.visual.resource(args.resourceType, args.target.pos.x, args.target.pos.y) */
    /* if (args.type === 'offer') {

        this.visual.text(amount.toString(), args.target.pos.x, args.target.pos.y + 0.5)
        this.visual.text(args.priority.toString(), args.target.pos)
    } */
    /* if (args.type === 'withdraw') {

        this.visual.text(amount.toString(), args.target.pos.x, args.target.pos.y + 0.5)
        this.visual.text(args.priority.toString(), args.target.pos)
    } */
    return (this.roomLogisticsRequests[args.type][ID] = {
        ID,
        type: args.type,
        targetID: args.target.id,
        resourceType: args.resourceType,
        amount: amount,
        priority: args.priority,
        onlyFull: args.onlyFull,
        noReserve: !this.advancedLogistics || undefined, // Don't reserve if advancedLogistics is disabled
    })
}

Room.prototype.findStructureAtCoord = function <T extends Structure>(
    coord: Coord,
    conditions: (structure: T) => boolean,
) {
    return this.findStructureAtXY(coord.x, coord.y, conditions)
}

Room.prototype.findStructureAtXY = function <T extends Structure>(
    x: number,
    y: number,
    conditions: (structure: T) => boolean,
) {
    const structureIDs = this.roomManager.structureCoords.get(packXYAsCoord(x, y))
    if (!structureIDs) return false

    for (const ID of structureIDs) {
        const structure = findObjectWithID(ID) as T
        if (conditions(structure)) return structure
    }

    return false
}

Room.prototype.findCSiteAtCoord = function <T extends ConstructionSite>(
    coord: Coord,
    conditions: (cSite: T) => boolean,
) {
    return this.findCSiteAtXY(coord.x, coord.y, conditions)
}

Room.prototype.findCSiteAtXY = function <T extends ConstructionSite>(
    x: number,
    y: number,
    conditions: (cSite: T) => boolean,
) {
    const cSiteIDs = this.roomManager.cSiteCoords.get(packXYAsCoord(x, y))
    if (!cSiteIDs) return false

    for (const ID of cSiteIDs) {
        const cSite = findObjectWithID(ID) as T
        /* console.log('findCSite', cSite, ID) */
        if (conditions(cSite)) return cSite
    }

    return false
}

Room.prototype.findStructureInsideRect = function <T extends Structure>(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    condition: (structure: T) => boolean,
): T | false {
    let structureID: Id<Structure>

    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            const structureIDs = this.roomManager.structureCoords.get(packXYAsCoord(x, y))
            if (!structureIDs) continue

            structureID = structureIDs.find(structureID => {
                return condition(findObjectWithID(structureID) as T)
            })

            if (structureID) return findObjectWithID(structureID) as T
        }
    }

    return false
}

Room.prototype.findStructureInRange = function <T extends Structure>(
    startCoord: Coord,
    range: number,
    condition: (structure: T) => boolean,
): T | false {
    let structureID: Id<Structure>

    for (let x = startCoord.x - range; x <= startCoord.x + range; x += 1) {
        for (let y = startCoord.y - range; y <= startCoord.y + range; y += 1) {
            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            const structureIDs = this.roomManager.structureCoords.get(packXYAsCoord(x, y))
            if (!structureIDs) continue

            structureID = structureIDs.find(structureID => {
                return condition(findObjectWithID(structureID) as T)
            })

            if (structureID) return findObjectWithID(structureID) as T
        }
    }

    return false
}

Room.prototype.coordVisual = function (x, y, fill = customColors.lightBlue) {
    this.visual.rect(x - 0.5, y - 0.5, 1, 1, { fill })
}
