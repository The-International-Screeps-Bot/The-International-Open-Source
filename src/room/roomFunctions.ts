import {
    allStructureTypes,
    ClaimRequestData,
    CombatRequestData,
    defaultPlainCost,
    defaultSwampCost,
    impassibleStructureTypes,
    impassibleStructureTypesSet,
    maxRampartGroupSize,
    maxRemoteRoomDistance,
    minHarvestWorkRatio,
    customColors,
    numbersByStructureTypes,
    PlayerData,
    prefferedCommuneRange,
    RemoteData,
    roomDimensions,
    roomTypeProperties,
    roomTypes,
    constantRoomTypes,
    stamps,
    structureTypesByBuildPriority,
    RESULT_FAIL,
    RESULT_NO_ACTION,
} from 'international/constants'
import {
    advancedFindDistance,
    areCoordsEqual,
    createPosMap,
    customLog,
    findAdjacentCoordsToCoord,
    findClosestClaimType,
    findClosestCommuneName,
    findCoordsInsideRect,
    findObjectWithID,
    getRange,
    isNearRoomEdge,
    newID,
    packAsNum,
    packXYAsNum,
    randomRange,
    unpackNumAsCoord,
    unpackNumAsPos,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { packCoord, packXYAsCoord, unpackCoord, unpackCoordAsPos, unpackPos, unpackPosList } from 'other/codec'
import { basePlanner } from './communePlanner'
import { posix } from 'path'

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

/**
 * @param opts options
 * @returns An array of RoomPositions
 */
Room.prototype.advancedFindPath = function (opts: PathOpts): RoomPosition[] {
    const room = this

    opts.plainCost = opts.plainCost || defaultPlainCost
    opts.swampCost = opts.swampCost || defaultSwampCost

    const allowedRoomNames = new Set([opts.origin.roomName])

    // Construct route

    function generateRoute(): void {
        for (const goal of opts.goals) {
            // If the goal is in the same room as the origin

            if (opts.origin.roomName === goal.pos.roomName) continue

            function weightRoom(roomName: string) {
                const roomMemory = Memory.rooms[roomName]
                if (!roomMemory) {
                    if (roomName === goal.pos.roomName) return 1
                    return Infinity
                }
                /* console.log(roomName) */
                if (opts.avoidAbandonedRemotes && roomMemory.T === 'remote' && roomMemory.data[RemoteData.abandon])
                    return Infinity

                // If the goal is in the room

                if (roomName === goal.pos.roomName) return 1

                // If the type is in typeWeights, inform the weight for the type

                if (opts.typeWeights && opts.typeWeights[roomMemory.T]) return opts.typeWeights[roomMemory.T]

                return 1
            }

            // Construct route by searching through rooms

            const route = Game.map.findRoute(opts.origin.roomName, goal.pos.roomName, {
                // Essentially a costMatrix for the rooms, priority is for the lower values. Infinity is impassible

                routeCallback: weightRoom,
            })

            // If a route can't be found

            if (route === ERR_NO_PATH) continue

            for (const roomRoute of route) {
                allowedRoomNames.add(roomRoute.room)

                const exits = Game.map.describeExits(roomRoute.room)
                for (const exit in exits) {
                    const roomName = exits[exit as ExitKey]

                    if (weightRoom(roomName) > 1) continue

                    allowedRoomNames.add(roomName)
                }
            }
        }
    }

    generateRoute()

    if (opts.weightStructurePlans) {
        if (!opts.weightCoords) opts.weightCoords = {}

        for (const roomName of allowedRoomNames) {
            if (!opts.weightCoords[roomName]) opts.weightCoords[roomName] = {}
        }

        for (const roomName of allowedRoomNames) {
            const roomMemory = Memory.rooms[roomName]

            if (roomMemory.T === 'commune') {
                for (const stampType in stamps) {
                    const stamp = stamps[stampType as StampTypes]

                    for (const packedStampAnchor of roomMemory.stampAnchors[stampType as StampTypes]) {
                        const stampAnchor = unpackNumAsCoord(packedStampAnchor)

                        for (const key in stamp.structures) {
                            const structureType = key as BuildableStructureConstant | 'empty'
                            if (structureType === 'empty') continue

                            let weight = 0

                            if (impassibleStructureTypesSet.has(structureType)) weight = 255
                            else if (structureType === STRUCTURE_ROAD) weight = 1

                            for (const pos of stamp.structures[structureType]) {
                                const x = pos.x + stampAnchor.x - stamp.offset
                                const y = pos.y + stampAnchor.y - stamp.offset

                                const currentWeight = opts.weightCoords[roomName][packXYAsCoord(x, y)] || 0
                                opts.weightCoords[roomName][packXYAsCoord(x, y)] = Math.max(weight, currentWeight)
                            }
                        }
                    }
                }

                const room = Game.rooms[roomName]
                if (room.centerUpgradePos) opts.weightCoords[roomName][packCoord(room.centerUpgradePos)] = 255

                if (room._sourcePaths) {
                    for (const path of Game.rooms[roomName]._sourcePaths) {
                        for (const pos of path) {
                            if (!opts.weightCoords[pos.roomName]) opts.weightCoords[pos.roomName] = {}
                            opts.weightCoords[pos.roomName][packCoord(pos)] = 1
                        }
                    }
                }
            } else if (roomMemory.T === 'remote') {
                for (const packedPath of roomMemory.SPs) {
                    const path = unpackPosList(packedPath)

                    for (const pos of path) {
                        if (!opts.weightCoords[pos.roomName]) opts.weightCoords[pos.roomName] = {}
                        opts.weightCoords[pos.roomName][packCoord(pos)] = 1
                    }
                }
            }
        }
    }

    // Construct path

    function generatePath() {
        const pathFinderResult = PathFinder.search(opts.origin, opts.goals, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: opts.maxRooms ? Math.min(allowedRoomNames.size, opts.maxRooms) : allowedRoomNames.size,
            maxOps: 100000,
            heuristicWeight: 1,
            flee: opts.flee,

            // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

            roomCallback(roomName) {
                // If the room is not allowed

                if (!allowedRoomNames.has(roomName)) return false

                /* const roomMemory = Memory.rooms[roomName] */

                const room = Game.rooms[roomName]
                const cm =
                    room && opts.weightCostMatrix
                        ? (room[opts.weightCostMatrix as keyof Room] as CostMatrix)
                        : new PathFinder.CostMatrix()

                // If there is no route

                if (allowedRoomNames.size <= 1) {
                    // Configure y and loop through top exits

                    let x
                    let y = 0
                    for (x = 0; x < roomDimensions; x += 1) cm.set(x, y, 255)

                    // Configure x and loop through left exits

                    x = 0
                    for (y = 0; y < roomDimensions; y += 1) cm.set(x, y, 255)

                    // Configure y and loop through bottom exits

                    y = roomDimensions - 1
                    for (x = 0; x < roomDimensions; x += 1) cm.set(x, y, 255)

                    // Configure x and loop through right exits

                    x = roomDimensions - 1
                    for (y = 0; y < roomDimensions; y += 1) cm.set(x, y, 255)
                }

                if (opts.weightCostMatrix) return cm

                /* if (room) room.visualizeCostMatrix(cm) */

                // Weight positions

                if (opts.weightCoords && opts.weightCoords[roomName]) {
                    for (const packedCoord in opts.weightCoords[roomName]) {
                        const coord = unpackCoord(packedCoord)

                        cm.set(coord.x, coord.y, opts.weightCoords[roomName][packedCoord])
                    }
                }

                // Weight costMatrixes

                if (opts.weightCoordMaps) {
                    for (const coordMap of opts.weightCoordMaps) {
                        for (const index in coordMap) {
                            const packedCoord = parseInt(index)
                            if (coordMap[packedCoord] === 0) continue

                            const coord = unpackNumAsCoord(packedCoord)

                            cm.set(coord.x, coord.y, coordMap[packedCoord])
                        }
                    }
                }

                // If we have no vision in the room

                if (!room) return cm

                // The pather is a creep, it isn't in a quad, and it hasn't already weighted roads

                if (
                    opts.creep &&
                    (!opts.creep.memory.SMNs || opts.creep.memory.SMNs.length < 3) &&
                    (!opts.weightStructures || !opts.weightStructures.road)
                ) {
                    let roadCost = 1
                    if (!opts.creep.memory.R) roadCost = opts.plainCost

                    for (const road of room.structures.road) cm.set(road.pos.x, road.pos.y, roadCost)
                }

                // If avoidStationaryPositions is requested

                if (opts.avoidStationaryPositions) {
                    // Loop through them

                    for (const index in room.sources) {
                        // Loop through each position of harvestPositions, have creeps prefer to avoid

                        for (const pos of room.sourcePositions[index]) cm.set(pos.x, pos.y, 10)
                    }

                    if (room.anchor) {
                        // The last upgrade position should be the deliver pos, which we want to weight normal

                        const upgradePositions = room.upgradePositions.slice(0, room.upgradePositions.length - 1)
                        for (const pos of upgradePositions) cm.set(pos.x, pos.y, 10)

                        for (const pos of room.mineralPositions) cm.set(pos.x, pos.y, 10)
                    }

                    // Get the hubAnchor

                    const hubAnchor =
                        room.memory.stampAnchors && room.memory.stampAnchors.hub[0]
                            ? unpackNumAsPos(room.memory.stampAnchors.hub[0], roomName)
                            : undefined

                    // If the hubAnchor is defined

                    if (hubAnchor) cm.set(hubAnchor.x, hubAnchor.y, 10)

                    // Loop through each position of fastFillerPositions, have creeps prefer to avoid

                    for (const pos of room.fastFillerPositions) cm.set(pos.x, pos.y, 10)
                }

                // Weight structures

                for (const key in opts.weightStructures) {
                    // Get the numeric value of the weight

                    const structureType = key as StructureConstant

                    for (const structure of room.structures[structureType])
                        cm.set(structure.pos.x, structure.pos.y, opts.weightStructures[structureType])
                }

                for (const portal of room.structures.portal) cm.set(portal.pos.x, portal.pos.y, 255)

                // Loop trough each construction site belonging to an ally

                for (const cSite of room.allyCSites) cm.set(cSite.pos.x, cSite.pos.y, 255)

                // If there is a request to avoid enemy ranges

                avoidEnemyRanges()

                function avoidEnemyRanges() {
                    // Stop if avoidEnemyRanges isn't specified

                    if (!opts.avoidEnemyRanges) return
                    if (room.controller && room.controller.safeMode && room.controller.my) return

                    for (const packedCoord of room.enemyThreatCoords) {
                        const coord = unpackCoord(packedCoord)
                        cm.set(coord.x, coord.y, 255)
                    }
                }

                if (opts.avoidNotMyCreeps && (!room.controller || !room.controller.safeMode)) {
                    for (const creep of room.enemyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)
                    for (const creep of room.allyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)

                    for (const creep of room.find(FIND_HOSTILE_POWER_CREEPS)) cm.set(creep.pos.x, creep.pos.y, 255)
                }

                // If avoiding structures that can't be walked on is enabled

                if (opts.avoidImpassibleStructures) {
                    for (const rampart of room.structures.rampart) {
                        // If the rampart is mine

                        if (rampart.my) {
                            // If there is no weight for my ramparts, iterate

                            if (!opts.myRampartWeight) continue

                            // Otherwise, record rampart by the weight and iterate

                            cm.set(rampart.pos.x, rampart.pos.y, opts.myRampartWeight)
                            continue
                        }

                        // If the rampart is public and owned by an ally
                        // We don't want to try to walk through enemy public ramparts as it could trick our pathing

                        if (rampart.isPublic && Memory.allyPlayers.includes(rampart.owner.username)) continue

                        // Otherwise set the rampart's pos as impassible

                        cm.set(rampart.pos.x, rampart.pos.y, 255)
                    }

                    // Loop through structureTypes of impassibleStructureTypes

                    for (const structureType of impassibleStructureTypes) {
                        for (const structure of room.structures[structureType]) {
                            // Set pos as impassible

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }

                        for (const cSite of room.cSites[structureType]) {
                            // Set pos as impassible

                            cm.set(cSite.pos.x, cSite.pos.y, 255)
                        }
                    }
                }

                // Stop if there are no cost matrixes to weight

                if (opts.weightCostMatrixes) {
                    // Otherwise iterate through each x and y in the room

                    for (let x = 0; x < roomDimensions; x += 1) {
                        for (let y = 0; y < roomDimensions; y += 1) {
                            // Loop through each costMatrix

                            for (const weightCMName of opts.weightCostMatrixes) {
                                const weightCM = room[weightCMName as unknown as keyof Room]
                                if (!weightCM) continue

                                cm.set(x, y, (weightCM as CostMatrix).get(x, y))
                            }
                        }
                    }
                }

                // Inform the CostMatrix

                return cm
            },
        })

        // If the pathFindResult is incomplete, inform an empty array

        if (pathFinderResult.incomplete) {
            customLog('Incomplete Path', `${pathFinderResult.path}, ${JSON.stringify(opts.goals)}`, {
                textColor: customColors.white,
                bgColor: customColors.red,
            })

            room.pathVisual(pathFinderResult.path, 'red')
            room.errorVisual(opts.origin)

            let lastPos = opts.origin

            for (const goal of opts.goals) {
                // Ensure no visuals are generated outside of the origin room

                if (lastPos.roomName !== goal.pos.roomName) continue

                room.visual.line(lastPos, goal.pos, {
                    color: customColors.red,
                    width: 0.15,
                    opacity: 0.3,
                    lineStyle: 'solid',
                })

                lastPos = goal.pos
            }

            return []
        }

        // Otherwise inform the path from pathFinderResult

        return pathFinderResult.path
    }

    // Call path generation and inform the result

    return generatePath()
}

Room.prototype.scoutByRoomName = function () {
    // Find the numbers in the room's name

    const [EWstring, NSstring] = this.name.match(/\d+/g)

    // Convert he numbers from strings into actual numbers

    const EW = parseInt(EWstring)
    const NS = parseInt(NSstring)

    // Use the numbers to deduce some room types - cheaply!

    if (EW % 10 === 0 && NS % 10 === 0) return (this.memory.T = 'intersection')
    if (EW % 10 === 0 || NS % 10 === 0) return (this.memory.T = 'highway')
    if (EW % 5 === 0 && NS % 5 === 0) return (this.memory.T = 'keeperCenter')
    if (Math.abs(5 - (EW % 10)) <= 1 && Math.abs(5 - (NS % 10)) <= 1) return (this.memory.T = 'keeper')

    return false
}

Room.prototype.scoutRemote = function (scoutingRoom) {
    if (this.scoutEnemyReservedRemote()) return this.memory.T
    if (this.scoutEnemyUnreservedRemote()) return this.memory.T

    if (!scoutingRoom) return this.memory.T
    return this.scoutMyRemote(scoutingRoom)
}

Room.prototype.scoutEnemyReservedRemote = function () {
    const { controller } = this

    if (!controller.reservation) return false
    if (controller.reservation.username === Memory.me) return false
    if (controller.reservation.username === 'Invader') return false

    // If there are roads or containers or sources harvested, inform false

    if (
        !this.structures.road &&
        !this.structures.container &&
        !this.find(FIND_SOURCES, {
            filter: source => source.ticksToRegeneration > 0,
        })
    )
        return false

    // If the controller is not reserved by an ally

    if (!Memory.allyPlayers.includes(controller.reservation.username)) {
        this.memory.owner = controller.reservation.username
        return (this.memory.T = 'enemyRemote')
    }

    // Otherwise if the room is reserved by an ally

    this.memory.owner = controller.reservation.username
    return (this.memory.T = 'allyRemote')
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

                this.memory.owner = creep.owner.username
                return (this.memory.T = 'allyRemote')
            }

            // If the creep is not owned by an ally

            // Set type to enemyRemote and stop

            this.memory.owner = creep.owner.username

            /* room.createAttackCombatRequest() */
            this.createHarassCombatRequest()

            return (this.memory.T = 'enemyRemote')
        }
    }

    return false
}

Room.prototype.scoutMyRemote = function (scoutingRoom) {
    if (this.memory.T === 'remote' && !global.communes.has(this.memory.CN)) this.memory.T = 'neutral'

    let distance = Game.map.getRoomLinearDistance(scoutingRoom.name, this.name)

    if (distance > maxRemoteRoomDistance) return this.memory.T

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

    if (distance > maxRemoteRoomDistance) return this.memory.T

    // If the room is already a remote of the scoutingRoom

    if (this.memory.T === 'remote' && scoutingRoom.name === this.memory.CN) return this.memory.T

    // Get the anchor from the scoutingRoom, stopping if it's undefined

    if (!scoutingRoom.anchor) return this.memory.T

    const newSourceEfficacies = []
    let newSourceEfficaciesTotal = 0

    // Get base planning data

    // loop through sourceNames

    for (const index in this.sources) {
        const path = this.advancedFindPath({
            origin: this.sourcePositions[index][0],
            goals: [{ pos: scoutingRoom.anchor, range: 4 }],
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

        // Stop if there is a source inefficient enough

        if (path.length > 250) return this.memory.T

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

    const newReservationEfficacy = this.advancedFindPath({
        origin: this.controller.pos,
        goals: [{ pos: scoutingRoom.anchor, range: 4 }],
        typeWeights: {
            enemy: Infinity,
            ally: Infinity,
            keeper: Infinity,
            enemyRemote: Infinity,
            allyRemote: Infinity,
        },
    }).length

    // If the room isn't already a remote

    if (this.memory.T !== 'remote') {
        this.memory.T = 'remote'

        // Assign the room's commune as the scoutingRoom

        this.memory.CN = scoutingRoom.name

        // Generate new important positions

        delete this.memory.SP
        delete this._sourcePositions
        this.sourcePositions

        delete this.memory.SPs
        delete this._sourcePaths
        this.sourcePaths

        delete this.memory.CP
        delete this._controllerPositions
        this.controllerPositions

        // Add the room's name to the scoutingRoom's remotes list

        scoutingRoom.memory.remotes.push(this.name)

        this.memory.RE = newReservationEfficacy

        this.memory.data = []
        for (const key in RemoteData) this.memory.data[parseInt(key)] = 0

        return this.memory.T
    }

    const currentRemoteEfficacy =
        this.memory.SPs.reduce((sum, el) => sum + el.length, 0) / this.memory.SPs.length + this.memory.RE
    const newRemoteEfficacy = newSourceEfficaciesTotal / newSourceEfficacies.length + newReservationEfficacy

    // If the new average source efficacy is above the current, stop

    if (newRemoteEfficacy >= currentRemoteEfficacy) return this.memory.T

    // Assign the room's commune as the scoutingRoom

    this.memory.CN = scoutingRoom.name

    // Generate new important positions

    delete this.memory.SP
    delete this._sourcePositions
    this.sourcePositions

    delete this.memory.SPs
    delete this._sourcePaths
    this.sourcePaths

    delete this.memory.CP
    delete this._controllerPositions
    this.controllerPositions

    // Add the room's name to the scoutingRoom's remotes list

    scoutingRoom.memory.remotes.push(this.name)

    this.memory.RE = newReservationEfficacy

    this.memory.data = []
    for (const key in RemoteData) this.memory.data[parseInt(key)] = 0

    return this.memory.T
}

Room.prototype.scoutEnemyRoom = function () {
    const { controller } = this
    const playerName = controller.owner.username
    const roomMemory = this.memory

    roomMemory.T = 'enemy'

    let player = Memory.players[playerName]
    if (!player) {
        player = Memory.players[playerName] = {
            data: [0],
        }

        for (const key in PlayerData) player.data[parseInt(key)] = 0
    }

    // General

    const level = controller.level
    roomMemory.level = level

    roomMemory.powerEnabled = controller.isPowerEnabled

    // Offensive threat

    let threat = 0

    threat += Math.pow(level, 2)

    threat += this.structures.spawn.length * 50
    threat += this.structures.nuker.length * 300
    threat += Math.pow(this.structures.lab.length * 10000, 0.4)

    threat = Math.floor(threat)

    roomMemory.OS = threat
    Memory.players[playerName].data[PlayerData.offensiveStrength] = Math.max(
        threat,
        player.data[PlayerData.offensiveStrength],
    )

    // Defensive threat

    threat = 0

    const energy = this.resourcesInStoringStructures.energy

    roomMemory.energy = energy
    threat += Math.pow(energy, 0.5)

    const ramparts = this.structures.rampart
    const avgRampartHits = ramparts.reduce((total, rampart) => total + rampart.hits, 0) / ramparts.length

    threat += Math.pow(avgRampartHits, 0.5)
    threat += this.structures.spawn.length * 100
    threat += this.structures.tower.length * 300
    threat += Math.pow(this.structures.extension.length * 400, 0.8)

    const hasTerminal = this.terminal !== undefined

    if (hasTerminal) {
        threat += 800

        roomMemory.terminal = true
    }

    threat = Math.floor(threat)

    roomMemory.DS = threat
    Memory.players[playerName].data[PlayerData.defensiveStrength] = Math.max(
        threat,
        player.data[PlayerData.defensiveStrength],
    )

    // Combat request creation

    this.createAttackCombatRequest({
        maxTowerDamage: Math.ceil(this.structures.tower.length * TOWER_POWER_ATTACK * 1.1),
        minDamage: 50,
    })

    return roomMemory.T
}

Room.prototype.basicScout = function () {
    const { controller } = this

    // Record that the room was scouted this tick

    this.memory.LST = Game.time

    if (!controller) return this.memory.T

    // If the contoller is owned

    if (controller.owner) {
        // Stop if the controller is owned by me

        if (controller.my) return this.memory.T

        const owner = controller.owner.username
        this.memory.owner = owner

        // If the controller is owned by an ally

        if (Memory.allyPlayers.includes(owner)) return (this.memory.T = 'ally')

        return this.scoutEnemyRoom()
    }

    // No controller owner

    if (this.scoutRemote()) return this.memory.T

    this.createClaimRequest()
    return (this.memory.T = 'neutral')
}

Room.prototype.advancedScout = function (scoutingRoom: Room) {
    const { controller } = this

    // Record that the room was scouted this tick

    this.memory.LST = Game.time

    if (constantRoomTypes.has(this.memory.T)) return this.memory.T
    if (this.scoutByRoomName()) return this.memory.T

    // If there is a controller

    if (controller) {
        // If the contoller is owned

        if (controller.owner) {
            // Stop if the controller is owned by me

            if (controller.my) return this.memory.T

            const owner = controller.owner.username

            this.memory.owner = owner

            // If the controller is owned by an ally

            if (Memory.allyPlayers.includes(owner)) return (this.memory.T = 'ally')

            return this.scoutEnemyRoom()
        }

        // No controlller owner

        if (this.scoutRemote(scoutingRoom)) return this.memory.T

        this.createClaimRequest()
        return (this.memory.T = 'neutral')
    }

    return this.memory.T
}

Room.prototype.createAttackCombatRequest = function (opts) {
    if (!Memory.autoAttack) return
    if (this.controller && this.controller.safeMode) return

    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request.T !== 'attack') return

        if (!opts) return

        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }

        return
    }

    if (
        !this.enemyCreeps.length &&
        !this.find(FIND_HOSTILE_STRUCTURES).find(structure => structure.structureType !== STRUCTURE_CONTROLLER)
    )
        return
    if (Memory.nonAggressionPlayers.includes(this.memory.owner)) return

    request = Memory.combatRequests[this.name] = {
        T: 'attack',
        data: [0],
    }

    for (const key in CombatRequestData) request.data[key] = 0

    request.data[CombatRequestData.minDamage] = 10
    request.data[CombatRequestData.minMeleeHeal] = 10
    request.data[CombatRequestData.minRangedHeal] = 10
    request.data[CombatRequestData.quadQuota] = 1

    if (opts) {
        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }
        return
    }
}

Room.prototype.createHarassCombatRequest = function (opts) {
    if (!Memory.autoAttack) return

    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request.T !== 'harass') return

        if (!opts) return

        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }

        return
    }

    if (!this.enemyCreeps.length) return
    if (Memory.nonAggressionPlayers.includes(this.memory.owner)) return
    if (this.enemyAttackers.length > 0) return

    request = Memory.combatRequests[this.name] = {
        T: 'harass',
        data: [0],
    }

    for (const key in CombatRequestData) request.data[key] = 0

    request.data[CombatRequestData.minDamage] = 10
    request.data[CombatRequestData.minMeleeHeal] = 10
    request.data[CombatRequestData.minRangedHeal] = 10

    if (opts) {
        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }
        return
    }

    /*
    const structures = this.dismantleTargets

    let totalHits = 0
    for (const structure of structures) totalHits += structure.hits

    if (structures.length > 0)
        request.data[CombatRequestData.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
 */
}

Room.prototype.createDefendCombatRequest = function (opts) {
    let request = Memory.combatRequests[this.name]
    if (request) {
        if (request.T !== 'defend') return

        if (!opts) return

        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }

        return
    }

    request = Memory.combatRequests[this.name] = {
        T: 'defend',
        data: [0],
    }

    for (const key in CombatRequestData) request.data[key] = 0

    request.data[CombatRequestData.inactionTimer] = 0
    request.data[CombatRequestData.inactionTimerMax] = randomRange(5000, 5000 + Math.floor(Math.random() * 5000))

    if (opts) {
        for (const key in opts) {
            request.data[CombatRequestData[key as keyof typeof CombatRequestData]] =
                opts[key as keyof typeof CombatRequestData]
        }
        return
    }

    request.data[CombatRequestData.minDamage] = 40
    request.data[CombatRequestData.minMeleeHeal] = 10
    request.data[CombatRequestData.minRangedHeal] = 10
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

            for (const coord2 of findAdjacentCoordsToCoord(coord1)) {
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

    for (const structureType of structureTypesByBuildPriority) {
        // Get the structures with the relevant type

        const cSitesOfType = this.allyCSitesByType[structureType]

        // If there are no cSites of this type, iterate

        if (!cSitesOfType.length) continue

        // Ptherwise get the anchor, using the creep's pos if undefined, or using the center of the room if there is no creep

        const anchor = this.anchor || creep?.pos || new RoomPosition(25, 25, this.name)

        // Record the closest site to the anchor in the room's global and inform true

        this.memory.CSTID = anchor.findClosestByPath(cSitesOfType, {
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
                    // Iterate if adjacentPos is out of room bounds

                    if (
                        adjacentPos.x <= 0 ||
                        adjacentPos.x >= roomDimensions ||
                        adjacentPos.y <= 0 ||
                        adjacentPos.y >= roomDimensions
                    )
                        continue

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

Room.prototype.createClaimRequest = function () {
    if (this.sources.length !== 2) return false

    if (this.memory.NC) return false

    if (Memory.claimRequests[this.name]) return false

    if (basePlanner(this) !== true) return false

    const request = (Memory.claimRequests[this.name] = {
        data: [0],
    })

    let score = 0

    // Prefer communes not too close and not too far from the commune

    const closestClaimTypeName = findClosestClaimType(this.name)
    const closestCommuneRange = Game.map.getRoomLinearDistance(closestClaimTypeName, this.name)
    score += Math.abs(prefferedCommuneRange - closestCommuneRange)

    score += this.sourcePaths[0].length / 10
    score += this.sourcePaths[1].length / 10
    score += this.upgradePathLength / 10
    score += this.memory.stampAnchors.rampart.length / 10
    score += this.findSwampPlainsRatio() * 10

    request.data[ClaimRequestData.score] = score

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

Room.prototype.findStructureAtCoord = function (coord, structureType) {
    return this.findStructureAtXY(coord.x, coord.y, structureType)
}

Room.prototype.findStructureAtXY = function (x, y, structureType) {
    const structureIDs = this.structureCoords.get(packXYAsCoord(x, y))
    if (!structureIDs) return false

    for (const ID of structureIDs) {
        const structure = findObjectWithID(ID)
        if (structure.structureType !== structureType) continue

        return structure
    }

    return false
}

Room.prototype.findStructureInsideRect = function (x1, y1, x2, y2, condition) {
    let structureID: Id<Structure>

    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            const structureIDs = this.structureCoords.get(packXYAsCoord(x, y))
            if (!structureIDs) continue

            structureID = structureIDs.find(structureID => {
                return condition(findObjectWithID(structureID))
            })

            if (structureID) return findObjectWithID(structureID)
        }
    }

    return false
}
