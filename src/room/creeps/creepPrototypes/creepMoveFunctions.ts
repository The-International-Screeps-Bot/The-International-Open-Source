import {
    defaultCreepSwampCost,
    defaultPlainCost,
    impassibleStructureTypes,
    impassibleStructureTypesSet,
    customColors,
    offsetsByDirection,
    roomDimensions,
    TrafficPriorities,
    packedPosLength,
    CreepMemoryKeys,
    RoomMemoryKeys,
    RoomTypes,
} from 'international/constants'
import { customFindPath } from 'international/customPathFinder'
import { internationalManager } from 'international/international'
import {
    areCoordsEqual,
    arePositionsEqual,
    customLog,
    findAdjacentCoordsToCoord,
    findObjectWithID,
    getRangeXY,
    getRangeEuc,
    getRangeEucXY,
    getRange,
    isCoordExit,
} from 'international/utils'
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

PowerCreep.prototype.needsNewPath = Creep.prototype.needsNewPath = function (path, opts) {
    // Inform true if there is no path

    if (!path) return true

    if (this.spawning) return false

    // Inform true if the path is at its end

    if (path.length === 0) return true

    // Inform true if there is no lastCache value in the creep's memory

    const creepMemory = Memory.creeps[this.name]
    if (!creepMemory[CreepMemoryKeys.lastCache]) return true
    if (creepMemory[CreepMemoryKeys.flee] !== opts.flee) return true

    // Inform true if the path is out of caching time

    if (creepMemory[CreepMemoryKeys.lastCache] + opts.cacheAmount <= Game.time) return true

    // Inform true if the path isn't in the same room as the creep

    if (path[0].roomName !== this.room.name) return true

    if (!creepMemory[CreepMemoryKeys.goalPos]) return true

    // Inform true if the creep's previous target isn't its current

    if (!areCoordsEqual(unpackPos(creepMemory[CreepMemoryKeys.goalPos]), opts.goals[0].pos)) return true

    // If next pos in the path is not in range, inform true

    if (this.pos.getRangeTo(path[0]) > 1) return true

    // Otherwise inform false

    return false
}
/*
PowerCreep.prototype.createMoveRequestByPath = Creep.prototype.createMoveRequestByPath = function (opts, pathOpts) {
    // Stop if the we know the creep won't move

    if (this.moveRequest) return false
    if (this.moved) return false
    if (this.fatigue > 0) return false
    if (this instanceof Creep && !this.parts.move) return false

    if (this.room.enemyDamageThreat) return this.createMoveRequest(opts)

    const cachedIndex = pathOpts.packedPath.indexOf(packPos(this.pos))
    if (cachedIndex >= 0 && cachedIndex + 2 !== pathOpts.packedPath.length) {
        console.log(pathOpts.packedPath.length, unpackPosList(pathOpts.packedPath))
        console.log(pathOpts.packedPath[cachedIndex], pathOpts.packedPath)
        pathOpts.packedPath = pathOpts.packedPath.slice(cachedIndex)

        let path: RoomPosition[]

        // If we have a remote, avoid abandoned remotes

        if (pathOpts.remoteName) {

            console.log(pathOpts.packedPath.length, cachedIndex)
            const roomNames: Set<string> = new Set()
            path = unpackPosList(pathOpts.packedPath)

            for (const pos of path) {
                roomNames.add(pos.roomName)
            }

            for (const roomName of roomNames) {
                const roomMemory = Memory.rooms[roomName]

                if (Memory.rooms[roomName][RoomMemoryKeys.type] !== RoomTypes.remote) continue
                if (!roomMemory[RoomMemoryKeys.abandon]) continue

                // The room is unsafe, don't use cached paths

                return this.createMoveRequest(opts)
            }
        }

        if (!path) path = unpackPosList(pathOpts.packedPath)

        this.memory[CreepMemoryKeys.path] = pathOpts.packedPath
        this.assignMoveRequest(path[1])
        return true
    }

    // If loose is enabled, don't try to get back on the cached path

    if (pathOpts.loose) return this.createMoveRequest(opts)

    // Try to get on the path

    opts.goals = []

    for (const pos of unpackPosList(pathOpts.packedPath))
        opts.goals.push({
            pos: pos,
            range: 0,
        })

    return this.createMoveRequest(opts)
}
 */

PowerCreep.prototype.createMoveRequestByPath = Creep.prototype.createMoveRequestByPath = function (opts, pathOpts) {
    // Stop if the we know the creep won't move

    if (this.moveRequest) return false
    if (this.moved) return false
    if (this.fatigue > 0) return false
    if (this instanceof Creep && !this.getActiveBodyparts(MOVE)) {
        this.moved = 'moved'
        return false
    }

    if (this.room.enemyDamageThreat) return this.createMoveRequest(opts)

    const posIndex = pathOpts.packedPath.indexOf(packPos(this.pos))

    //
    /*
    const path = unpackPosList(pathOpts.packedPath)
    for (const pos of path) new RoomVisual(pos.roomName).rect(pos.x - 0.5, pos.y - 0.5, 1, 1, { fill: customColors.lightBlue, opacity: 0.2 })
 */
    const packedGoalPos = packPos(opts.goals[0].pos)
    const isOnLastPos = posIndex + packedPosLength === pathOpts.packedPath.length

    if (Memory.roomVisuals) {
        this.room.targetVisual(this.pos, opts.goals[0].pos, true)

        this.room.visual.text(pathOpts.packedPath.length.toString(), this.pos.x, this.pos.y + 0.5, { font: 0.4 })
        this.room.visual.text((posIndex || -1).toString(), this.pos)
    }

    if (!isOnLastPos && posIndex !== -1 && this.memory[CreepMemoryKeys.usedPathForGoal] !== packedGoalPos) {
        const packedPath = pathOpts.packedPath.slice(posIndex + packedPosLength)
        const path = unpackPosList(packedPath)

        this.room.targetVisual(this.pos, path[0])

        // If we're on an exit and the next pos is in the other room, wait

        if (path[0].roomName !== this.room.name) {
            this.room.visual.text(path[0].roomName, this.pos.x, this.pos.y - 1, { font: 0.5 })
            /* this.room.visual.text(path[0].roomName, this.pos.x, this.pos.y + 1, { font: 0.5 }) */

            this.memory[CreepMemoryKeys.path] = packedPath
            this.moved = 'moved'
            return true
        }

        // If we have a remote, avoid abandoned remotes

        if (pathOpts.remoteName) {
            const roomNames: Set<string> = new Set()

            for (const pos of path) {
                roomNames.add(pos.roomName)
            }

            for (const roomName of roomNames) {
                const roomMemory = Memory.rooms[roomName]

                if (Memory.rooms[roomName][RoomMemoryKeys.type] !== RoomTypes.remote) continue
                if (!roomMemory[RoomMemoryKeys.abandon]) continue

                // The room is unsafe, don't use cached paths

                return this.createMoveRequest(opts)
            }
        }

        // Give the creep a sliced version of the path it is trying to use

        this.memory[CreepMemoryKeys.path] = packedPath
        this.assignMoveRequest(path[0])
        return true
    }

    if (isOnLastPos || this.memory[CreepMemoryKeys.usedPathForGoal]) {
        this.memory[CreepMemoryKeys.usedPathForGoal] = packPos(opts.goals[0].pos)
        return this.createMoveRequest(opts)
    }

    // If loose is enabled, don't try to get back on the cached path
    /*
    this.room.visual.text((pathOpts.loose || false).toString(), this.pos.x, this.pos.y + 0.5, { font: 0.4 })
 */
    if (pathOpts.loose) return this.createMoveRequest(opts)

    this.room.errorVisual(this.pos)

    // Try to get on the path

    opts.goals = []

    for (const pos of unpackPosList(pathOpts.packedPath))
        opts.goals.push({
            pos: pos,
            range: 0,
        })

    return this.createMoveRequest(opts)
}

PowerCreep.prototype.createMoveRequest = Creep.prototype.createMoveRequest = function (opts) {
    const { room } = this

    // Stop if the we know the creep won't move

    if (this.moveRequest) return false
    if (this.moved) return false
    if (this.fatigue > 0) return false
    if (this instanceof Creep && !this.getActiveBodyparts(MOVE)) {
        this.moved = 'moved'
        return false
    }
    /*
    if (this.spawning) return false
 */
    // Assign default opts

    if (!opts.origin) opts.origin = this.pos
    if (!opts.cacheAmount) opts.cacheAmount = internationalManager.defaultMinCacheAmount

    let path: RoomPosition[]
    if (this.spawning) path = []

    const creepMemory = Memory.creeps[this.name]

    // If there is a path in the creep's memory and it isn't spawning

    if (creepMemory[CreepMemoryKeys.path] && !this.spawning) {
        path = unpackPosList(creepMemory[CreepMemoryKeys.path])

        // So long as the creep isn't standing on the first position in the path, and the pos is worth going on

        while (path[0] && arePositionsEqual(this.pos, path[0])) {
            // Remove the first pos of the path

            path.shift()
        }
    }

    // See if the creep needs a new path

    if (this.needsNewPath(path, opts)) {
        // Assign the creep to the opts

        opts.creep = this

        // Inform opts to avoid impassible structures

        opts.avoidImpassibleStructures = true
        opts.avoidStationaryPositions = true

        // If there is no safemode

        if (!room.controller || !room.controller.safeMode) opts.avoidNotMyCreeps = true

        if (creepMemory[CreepMemoryKeys.preferRoads]) {
            if (!opts.plainCost) opts.plainCost = defaultPlainCost * 2
            if (!opts.swampCost) opts.swampCost = defaultCreepSwampCost * 2
        }

        // Generate a new path

        path = customFindPath(opts)
        if (!path.length) return 'unpathable'

        // Limit the path's length to the cacheAmount

        path.splice(opts.cacheAmount)

        // Set the lastCache to the current tick

        creepMemory[CreepMemoryKeys.lastCache] = Game.time
        creepMemory[CreepMemoryKeys.flee] = opts.flee

        // Show that a new path has been created

        if (Memory.roomVisuals)
            room.visual.text('NP', path[0], {
                align: 'center',
                color: customColors.lightBlue,
                opacity: 0.5,
                font: 0.5,
            })

        // So long as the creep isn't standing on the first position in the path

        while (path[0] && areCoordsEqual(this.pos, path[0])) {
            // Remove the first pos of the path

            path.shift()
        }
    }

    // Stop if there are no positions left in the path

    if (!path.length) return false

    // If visuals are enabled, visualize the path

    if (Memory.roomVisuals)
        path.length > 1
            ? room.pathVisual(path, 'lightBlue')
            : room.visual.line(this.pos, path[0], {
                  color: customColors.lightBlue,
                  opacity: 0.3,
              })

    if (path.length > 1) {
        if (Memory.roomVisuals) room.pathVisual(path, 'lightBlue')
    } else {
        if (Memory.roomVisuals)
            room.visual.line(this.pos, path[0], {
                color: customColors.lightBlue,
                opacity: 0.3,
            })
        delete creepMemory[CreepMemoryKeys.lastCache]
    }

    // Set the creep's pathOpts to reflect this moveRequest's opts

    this.pathOpts = opts

    // Assign the goal's pos to the creep's goalPos

    creepMemory[CreepMemoryKeys.goalPos] = packPos(opts.goals[0].pos)

    // Set the path in the creep's memory

    creepMemory[CreepMemoryKeys.path] = packPosList(path)

    if (this.spawning) {
        const spawn = findObjectWithID(this.spawnID)

        // Ensure we aren't using the default direction

        if (spawn.spawning.directions) return true

        const adjacentCoords: Coord[] = []

        for (let x = spawn.pos.x - 1; x <= spawn.pos.x + 1; x += 1) {
            for (let y = spawn.pos.y - 1; y <= spawn.pos.y + 1; y += 1) {
                if (spawn.pos.x === x && spawn.pos.y === y) continue

                const coord = { x, y }

                /* if (room.coordHasStructureTypes(coord, impassibleStructureTypesSet)) continue */

                // Otherwise ass the x and y to positions

                adjacentCoords.push(coord)
            }
        }

        // Sort by distance from the first pos in the path

        adjacentCoords.sort((a, b) => {
            return getRange(a, path[0]) - getRange(b, path[0])
        })

        const directions: DirectionConstant[] = []

        for (const coord of adjacentCoords) {
            directions.push(spawn.pos.getDirectionTo(coord.x, coord.y))
        }

        spawn.spawning.setDirections(directions)
        return true
    }

    if (path[0].roomName !== this.room.name) {
        this.moved = 'moved'
        return true
    }
    this.assignMoveRequest(path[0])

    // Inform success

    return true
}

PowerCreep.prototype.assignMoveRequest = Creep.prototype.assignMoveRequest = function (coord) {
    const { room } = this
    const packedCoord = packCoord(coord)

    this.moveRequest = packedCoord

    room.moveRequests[packedCoord]
        ? room.moveRequests[packedCoord].push(this.name)
        : (room.moveRequests[packedCoord] = [this.name])
}

PowerCreep.prototype.findShoveCoord = Creep.prototype.findShoveCoord = function (avoidPackedCoords, targetCoord) {
    const { room } = this

    const { x } = this.pos
    const { y } = this.pos

    const adjacentPackedCoords = [
        packXYAsCoord(x - 1, y - 1),
        packXYAsCoord(x - 1, y),
        packXYAsCoord(x - 1, y + 1),
        packXYAsCoord(x, y - 1),
        packXYAsCoord(x, y + 1),
        packXYAsCoord(x + 1, y - 1),
        packXYAsCoord(x + 1, y + 1),
        packXYAsCoord(x + 1, y - 1),
    ]

    let shoveCoord: Coord
    let lowestScore = Infinity

    const terrain = room.getTerrain()

    for (let index = 0; index < adjacentPackedCoords.length; index++) {
        const packedCoord = adjacentPackedCoords[index]

        const creepAtPosName = room.creepPositions[packedCoord]
        if (creepAtPosName) {
            const creepAtPos = Game.creeps[creepAtPosName]
            if (creepAtPos.fatigue > 0) continue
            if (creepAtPos.moved) continue
            if (!this.getActiveBodyparts(MOVE)) continue
        }

        /*
        if (room.creepPositions[packedCoord]) continue
        if (room.powerCreepPositions[packedCoord]) continue
 */
        if (avoidPackedCoords.has(packedCoord)) continue

        const coord = unpackCoord(packedCoord)
        if (isCoordExit(coord)) continue

        const terrainType = terrain.get(coord.x, coord.y)
        if (terrainType === TERRAIN_MASK_WALL) continue

        let score: number
        if (targetCoord) {
            score = getRangeEuc(coord, targetCoord)
            if (terrainType === TERRAIN_MASK_SWAMP) score += 1
            if (room.creepPositions[packedCoord] || room.powerCreepPositions[packedCoord]) score += 1

            if (Memory.roomVisuals) this.room.visual.text(score.toString(), coord.x, coord.y)
            if (score >= lowestScore) continue
        }

        // If the coord isn't safe to stand on

        if (room.enemyThreatCoords.has(packedCoord)) continue

        if (room.coordHasStructureTypes(coord, impassibleStructureTypesSet)) continue

        if (
            this.memory[CreepMemoryKeys.rampartOnlyShoving] &&
            !room.findStructureAtCoord(coord, structure => structure.structureType === STRUCTURE_RAMPART)
        )
            continue

        let hasImpassibleStructure

        for (const cSite of room.lookForAt(LOOK_CONSTRUCTION_SITES, coord.x, coord.y)) {
            if (!cSite.my && !Memory.allyPlayers.includes(cSite.owner.username)) continue

            if (impassibleStructureTypesSet.has(cSite.structureType)) {
                hasImpassibleStructure = true
                break
            }
        }

        if (hasImpassibleStructure) continue

        if (targetCoord) {
            lowestScore = score
            shoveCoord = coord
            continue
        }

        // There is no goalCoord, use this coord

        return shoveCoord
    }

    return shoveCoord
}

PowerCreep.prototype.shove = Creep.prototype.shove = function (avoidPackedCoords) {
    const { room } = this

    let targetCoord = this.actionCoord
    if (!targetCoord && this.memory[CreepMemoryKeys.goalPos])
        targetCoord = unpackPos(this.memory[CreepMemoryKeys.goalPos])

    avoidPackedCoords.add(packCoord(this.pos))

    const shoveCoord = this.findShoveCoord(avoidPackedCoords, targetCoord)
    if (!shoveCoord) return false

    const packedShoveCoord = packCoord(shoveCoord)
    const creepAtPosName = room.creepPositions[packedShoveCoord] || room.powerCreepPositions[packedShoveCoord]

    // If there is a creep make sure we aren't overlapping with other shoves

    if (creepAtPosName) {
        avoidPackedCoords.add(packCoord(this.pos))
        avoidPackedCoords.add(packedShoveCoord)

        if (!Game.creeps[creepAtPosName].shove(avoidPackedCoords)) return false
    }

    this.assignMoveRequest(shoveCoord)

    if (Memory.roomVisuals)
        room.visual.circle(this.pos, {
            fill: '',
            stroke: customColors.red,
            radius: 0.5,
            strokeWidth: 0.15,
        })

    if (!this.moveRequest) return false

    if (Memory.roomVisuals) {
        room.visual.circle(this.pos, {
            fill: '',
            stroke: customColors.yellow,
            radius: 0.5,
            strokeWidth: 0.15,
            opacity: 0.3,
        })

        room.visual.line(this.pos, unpackCoordAsPos(this.moveRequest, this.room.name), {
            color: customColors.yellow,
        })
    }

    this.runMoveRequest()
    return true
    /*
    this.recurseMoveRequest()
    if (this.moved) return true

    return false */
}

PowerCreep.prototype.runMoveRequest = Creep.prototype.runMoveRequest = function () {
    const { room } = this

    // If requests are not allowed for this pos, inform false

    if (!room.moveRequests[this.moveRequest]) return false

    if (this.move(this.pos.getDirectionTo(unpackCoordAsPos(this.moveRequest, room.name))) !== OK) return false

    if (Memory.roomVisuals)
        room.visual.rect(this.pos.x - 0.5, this.pos.y - 0.5, 1, 1, {
            fill: customColors.lightBlue,
            opacity: 0.2,
        })

    // Record where the creep is tying to move

    this.moved = this.moveRequest

    // Remove all moveRequests to the position

    delete room.moveRequests[this.moveRequest]
    delete this.moveRequest

    // Remove record of the creep being on its current position

    /* room.creepPositions[packAsNum(this.pos)] = undefined */

    // Record the creep at its new position

    /* room.creepPositions[this.moveRequest] = this.name */

    return true
}

PowerCreep.prototype.recurseMoveRequest = Creep.prototype.recurseMoveRequest = function (queue = []) {
    const { room } = this

    if (!this.moveRequest) return
    if (!room.moveRequests[this.moveRequest]) {
        this.moved = 'moved'
        return
    }

    queue.push(this.name)

    // Try to find the name of the creep at pos

    const creepNameAtPos = room.creepPositions[this.moveRequest] || room.powerCreepPositions[this.moveRequest]

    // If there is no creep at the pos

    if (!creepNameAtPos) {
        if (this.spawning) {
            this.moved = this.moveRequest
            delete room.moveRequests[this.moveRequest]

            if (Memory.roomVisuals) {
                const moved = unpackCoord(this.moved)

                room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                    fill: customColors.black,
                    opacity: 0.7,
                })
            }
            return
        }

        // loop through each index of the queue, drawing visuals

        if (Memory.roomVisuals) {
            const moveRequestPos = unpackCoordAsPos(this.moveRequest, room.name)

            room.visual.rect(moveRequestPos.x - 0.5, moveRequestPos.y - 0.5, 1, 1, {
                fill: customColors.green,
                opacity: 0.2,
            })

            for (let index = queue.length - 1; index >= 0; index--) {
                const creep = Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]

                room.visual.rect(creep.pos.x - 0.5, creep.pos.y - 0.5, 1, 1, {
                    fill: customColors.yellow,
                    opacity: 0.2,
                })
            }
        }

        // Otherwise, loop through each index of the queue

        for (let index = queue.length - 1; index >= 0; index--)
            // Have the creep run its moveRequesat

            (Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()

        return
    }

    const packedCoord = packCoord(this.pos)

    // Get the creepAtPos with the name

    const creepAtPos = Game.creeps[creepNameAtPos] || Game.powerCreeps[creepNameAtPos]

    // We're spawning, just get us space to move into

    if (this.spawning) {
        if (creepAtPos.shove(new Set([packedCoord]))) {
            this.moved = this.moveRequest
            delete room.moveRequests[this.moveRequest]
        }

        if (Memory.roomVisuals) {
            const moved = unpackCoord(this.moveRequest)

            room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                fill: customColors.pink,
                opacity: 0.7,
            })
        }

        return
    }

    if (creepAtPos.moved) {
        if (creepAtPos.moved === 'moved') {
            delete this.moveRequest
            this.moved = 'moved'
            return
        }

        if (creepAtPos.moved === 'wait') {
            if (creepAtPos instanceof PowerCreep) {
                delete this.moveRequest
                this.moved = 'wait'
                return
            }

            if (
                this.memory[CreepMemoryKeys.remote] !== creepAtPos.memory[CreepMemoryKeys.remote] ||
                this.memory[CreepMemoryKeys.sourceIndex] !== creepAtPos.memory[CreepMemoryKeys.sourceIndex] ||
                TrafficPriorities[this.role] + (this.freeStore() === 0 ? 0.1 : 0) >
                    TrafficPriorities[creepAtPos.role] + (creepAtPos.freeStore() === 0 ? 0.1 : 0)
            ) {
                // Have the creep move to its moveRequest

                this.runMoveRequest()

                // Have the creepAtPos move to the creep and inform true

                creepAtPos.moveRequest = packedCoord
                room.moveRequests[packedCoord] = [creepAtPos.name]
                creepAtPos.runMoveRequest()
                return
            }

            delete this.moveRequest
            this.moved = 'wait'
            return
        }

        // If the creep is where the creepAtPos is trying to move to
        /*
        if (packedCoord === creepAtPos.moved) {
            if (Memory.roomVisuals)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.purple,
                    opacity: 0.2,
                })

            this.runMoveRequest()
            return
        }
 */
        if (Memory.roomVisuals)
            room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                fill: customColors.white,
                opacity: 0.2,
            })

        // Otherwise, loop through each index of the queue

        for (let index = queue.length - 1; index >= 0; index--)
            // Have the creep run its moveRequest

            (Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()

        // loop through each index of the queue, drawing visuals

        if (Memory.roomVisuals)
            for (let index = queue.length - 1; index >= 0; index--)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.yellow,
                    opacity: 0.2,
                })
        return
    }

    // If the creepAtPos has a moveRequest

    if (creepAtPos.moveRequest) {
        // If it's not valid

        if (!room.moveRequests[creepAtPos.moveRequest]) {
            /*
            if (Memory.roomVisuals)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.teal,
                    opacity: 0.2,
                })

            // Have the creep move to its moveRequest

            this.runMoveRequest()

            // Have the creepAtPos move to the creep and inform true

            creepAtPos.moveRequest = packedCoord
            room.moveRequests.set(packedCoord, [creepAtPos.name])
            creepAtPos.runMoveRequest()
            */
            return
        }

        // If the creep's pos and the creepAtPos's moveRequests are aligned

        if (packedCoord === creepAtPos.moveRequest) {
            if (Memory.roomVisuals)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.teal,
                    opacity: 0.2,
                })

            // Have the creep move to its moveRequest

            this.runMoveRequest()
            creepAtPos.runMoveRequest()
            return
        }

        // If both creeps moveRequests are aligned

        if (this.moveRequest === creepAtPos.moveRequest) {
            if (Memory.roomVisuals)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.pink,
                    opacity: 0.2,
                })

            // Prefer the creep with the higher priority

            if (
                !(creepAtPos instanceof PowerCreep) &&
                TrafficPriorities[this.role] + (this.freeStore() === 0 ? 0.1 : 0) >
                    TrafficPriorities[creepAtPos.role] + (creepAtPos.freeStore() === 0 ? 0.1 : 0)
            ) {
                this.runMoveRequest()

                delete creepAtPos.moveRequest
                creepAtPos.moved = 'moved'

                return
            }

            delete this.moveRequest
            this.moved = 'moved'

            creepAtPos.runMoveRequest()
            return
        }

        if (
            !(creepAtPos instanceof PowerCreep) &&
            TrafficPriorities[this.role] + (this.freeStore() === 0 ? 0.1 : 0) >
                TrafficPriorities[creepAtPos.role] + (creepAtPos.freeStore() === 0 ? 0.1 : 0)
        ) {
            if (Memory.roomVisuals)
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.pink,
                    opacity: 0.2,
                })

            this.runMoveRequest()

            // Have the creepAtPos move to the creep and inform true

            creepAtPos.moveRequest = packedCoord
            room.moveRequests[packedCoord] = [creepAtPos.name]
            creepAtPos.runMoveRequest()
            return
        }

        // If the creepAtPos is in the queue

        if (queue.includes(creepAtPos.name)) {
            // loop through each index of the queue

            for (let index = queue.length - 1; index >= 0; index--)
                // Have the creep run its moveRequest

                (Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()

            // loop through each index of the queue, drawing visuals

            if (Memory.roomVisuals)
                for (let index = queue.length - 1; index >= 0; index--)
                    room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                        fill: customColors.yellow,
                        opacity: 0.2,
                    })

            return
        }

        creepAtPos.recurseMoveRequest(queue)
        return
    }

    // Otherwise if creepAtPos is fatigued, stop

    if (!(creepAtPos instanceof PowerCreep) && creepAtPos.fatigue > 0) return

    // Otherwise the creepAtPos has no moveRequest

    if (creepAtPos.shove(new Set([packedCoord]))) {
        this.room.visual.text('S', creepAtPos.pos)
        this.runMoveRequest()
        return
    }

    if (Memory.roomVisuals)
        room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
            fill: customColors.teal,
            opacity: 0.2,
        })

    // Have the creep move to its moveRequest

    this.runMoveRequest()

    // Have the creepAtPos move to the creep and inform true

    creepAtPos.moveRequest = packedCoord
    room.moveRequests[packedCoord] = [creepAtPos.name]
    creepAtPos.runMoveRequest()
}

PowerCreep.prototype.avoidEnemyThreatCoords = Creep.prototype.avoidEnemyThreatCoords = function () {
    if (!this.room.enemyThreatCoords.has(packCoord(this.pos))) return false

    this.createMoveRequest({
        origin: this.pos,
        goals: this.room.enemyThreatGoals,
        flee: true,
    })

    return true
}
