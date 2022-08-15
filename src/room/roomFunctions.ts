import {
    allStructureTypes,
    allyList,
    impassibleStructureTypes,
    maxRampartGroupSize,
    minHarvestWorkRatio,
    myColors,
    numbersByStructureTypes,
    prefferedCommuneRange,
    remoteNeedsIndex,
    roomDimensions,
    roomTypeProperties,
    roomTypes,
    stamps,
    structureTypesByBuildPriority,
} from 'international/constants'
import {
    advancedFindDistance,
    arePositionsEqual,
    createPosMap,
    customLog,
    findClosestClaimType,
    findClosestCommuneName,
    findCoordsInsideRect,
    getRange,
    pack,
    packXY,
    unpackAsPos,
    unpackAsRoomPos,
} from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'
import { packCoord, unpackCoordAsPos, unpackPos } from 'other/packrat'
import { basePlanner } from './construction/basePlanner'
import { RoomCacheObject } from './roomObject'

Room.prototype.get = function (roomObjectName) {
    const room = this

    // Resources

    // Harvest positions

    /**
     * Finds positions adjacent to a source that a creep can harvest
     * @param source source of which to find harvestPositions for
     * @returns source's harvestPositions, a list of positions
     */
    function findHarvestPositions(source: Source | Mineral) {
        // Stop and inform empty array if there is no source

        if (!source) return []

        // Construct harvestPositions

        const harvestPositions = []

        // Find terrain in room

        const terrain = Game.map.getRoomTerrain(room.name)

        // Find positions adjacent to source

        const adjacentPositions = findCoordsInsideRect(
            source.pos.x - 1,
            source.pos.y - 1,
            source.pos.x + 1,
            source.pos.y + 1,
        )

        // Loop through each pos

        for (const pos of adjacentPositions) {
            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

            // Add pos to harvestPositions

            harvestPositions.push(new RoomPosition(pos.x, pos.y, room.name))
        }

        // Inform harvestPositions

        return harvestPositions
    }

    /**
     * @param harvestPositions array of RoomPositions to filter
     * @returns the closest harvestPosition to the room's anchor
     */
    function findClosestHarvestPos(harvestPositions: RoomPosition[]): void | RoomPosition {
        // Get the room anchor, stopping if it's undefined

        if (!room.anchor) return

        // Filter harvestPositions by closest one to anchor

        return room.anchor.findClosestByPath(harvestPositions, {
            ignoreCreeps: true,
            ignoreDestructibleStructures: true,
            ignoreRoads: true,
        })
    }

    new RoomCacheObject({
        name: 'mineralHarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() {
            return findHarvestPositions(room.mineral)
        },
    })

    new RoomCacheObject({
        name: 'closestMineralHarvestPos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() {
            return findClosestHarvestPos(room.roomObjects.mineralHarvestPositions.getValue())
        },
    })

    // Upgrade positions

    function findCenterUpgradePos() {
        // Get the anchor, informing false if it's undefined

        if (!room.anchor) return false

        // Get the open areas in a range of 3 to the controller

        const distanceCoords = room.distanceTransform(
            undefined,
            false,
            room.controller.pos.x - 2,
            room.controller.pos.y - 2,
            room.controller.pos.x + 2,
            room.controller.pos.y + 2,
        )

        // Find the closest value greater than two to the centerUpgradePos and inform it

        return room.findClosestPosOfValue({
            coordMap: distanceCoords,
            startCoords: [room.anchor],
            requiredValue: 2,
            reduceIterations: 1,
        })
    }

    new RoomCacheObject({
        name: 'centerUpgradePos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findCenterUpgradePos,
    })

    function findUpgradePositions() {
        // Get the center upgrade pos, stopping if it's undefined

        const centerUpgradePos = room.roomObjects.centerUpgradePos.getValue()
        if (!centerUpgradePos) return []

        if (!room.anchor) return []

        // Construct harvestPositions

        const upgradePositions = []

        // Find terrain in room

        const terrain = Game.map.getRoomTerrain(room.name)

        // Find positions adjacent to source

        const adjacentPositions = findCoordsInsideRect(
            centerUpgradePos.x - 1,
            centerUpgradePos.y - 1,
            centerUpgradePos.x + 1,
            centerUpgradePos.y + 1,
        )

        // Loop through each pos

        for (const pos of adjacentPositions) {
            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

            // Add pos to harvestPositions

            upgradePositions.push(new RoomPosition(pos.x, pos.y, room.name))
        }

        upgradePositions.sort(function (a, b) {
            return getRange(a.x, room.anchor.x, a.y, room.anchor.y) - getRange(b.x, room.anchor.x, b.y, room.anchor.y)
        })

        // Inform harvestPositions

        return upgradePositions
    }

    new RoomCacheObject({
        name: 'upgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findUpgradePositions,
    })

    function findFastFillerPositions() {
        if (!room.anchor) return []

        // Construct fastFillerPositions from the top / bottom and left, right adjacent positions

        const fastFillerPositions = [
            {
                x: room.anchor.x - 1,
                y: room.anchor.y - 1,
            },
            {
                x: room.anchor.x + 1,
                y: room.anchor.y - 1,
            },
            {
                x: room.anchor.x - 1,
                y: room.anchor.y + 1,
            },
            {
                x: room.anchor.x + 1,
                y: room.anchor.y + 1,
            },
        ]

        let adjacentStructures
        let adjacentStructuresByType: Partial<Record<StructureConstant, number>>

        // Loop through each fastFillerPos

        for (let index = fastFillerPositions.length - 1; index >= 0; index -= 1) {
            // Get the pos using the index

            const pos = fastFillerPositions[index]

            // Get adjacent structures

            adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true)

            // Construct organized adjacent structures

            adjacentStructuresByType = {
                spawn: 0,
                extension: 0,
                container: 0,
                link: 0,
            }

            // For each structure of adjacentStructures

            for (const adjacentPosData of adjacentStructures) {
                // Get the structureType at the adjacentPos

                const { structureType } = adjacentPosData.structure

                if (adjacentStructuresByType[structureType] === undefined) continue

                // Increase structure amount for this structureType on the adjacentPos

                adjacentStructuresByType[structureType] += 1
            }

            // If there is more than one adjacent extension and container, iterate

            if (
                adjacentStructuresByType[STRUCTURE_CONTAINER] + adjacentStructuresByType[STRUCTURE_LINK] > 0 &&
                (adjacentStructuresByType[STRUCTURE_SPAWN] > 0 || adjacentStructuresByType[STRUCTURE_EXTENSION] > 1)
            )
                continue

            // Otherwise, remove the pos from fastFillePositions

            fastFillerPositions.splice(index, 1)
        }

        // Inform fastFillerPositions

        return fastFillerPositions
    }

    new RoomCacheObject({
        name: 'fastFillerPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findFastFillerPositions,
    })

    // usedMineralHarvestPositions

    function findUsedMineralHarvestPositions() {
        // Construct usedHarvestPositions

        const usedHarvestPositions: Set<number> = new Set()

        // Loop through each sourceHarvester's name in the room

        for (const creepName of room.creepsFromRoom.mineralHarvester) {
            // Get the creep using its name

            const creep = Game.creeps[creepName]

            // If the creep is dying, iterate

            if (creep.isDying()) continue

            // If the creep has a packedHarvestPos, record it in usedHarvestPositions

            if (creep.memory.packedPos) usedHarvestPositions.add(creep.memory.packedPos)
        }

        // Inform usedHarvestPositions

        return usedHarvestPositions
    }

    new RoomCacheObject({
        name: 'usedMineralHarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedMineralHarvestPositions,
    })

    // usedUpgradePositions

    function findUsedUpgradePositions() {
        // Construct usedUpgradePositions

        const usedUpgradePositions: Set<number> = new Set()

        // Get the controllerContainer

        const controllerContainer: StructureContainer = room.controllerContainer

        // If there is no controllerContainer

        if (!controllerContainer) {
            // Get the centerUpgradePos and set it as avoid in usedUpgradePositions

            const centerUpgadePos = room.roomObjects.centerUpgradePos.getValue()
            usedUpgradePositions.add(pack(centerUpgadePos))
        }

        // Get the hubAnchor, informing false if it's not defined

        const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name)
        if (!hubAnchor) return false

        // Get the upgradePositions, informing false if they're undefined

        const upgradePositions: RoomPosition[] = room.roomObjects.upgradePositions.getValue()
        if (!upgradePositions.length) return false

        // Assign closestUpgradePos in usedUpgradePositions

        usedUpgradePositions.add(
            pack(
                hubAnchor.findClosestByPath(upgradePositions, {
                    ignoreCreeps: true,
                    ignoreDestructibleStructures: true,
                    ignoreRoads: true,
                }),
            ),
        )

        // Loop through each controllerUpgrader's name in the room

        for (const creepName of room.myCreeps.controllerUpgrader) {
            // Get the creep using its name

            const creep = Game.creeps[creepName]

            // If the creep is dying, iterate

            if (creep.isDying()) continue

            // If the creep has a packedUpgradePos, record it in usedUpgradePositions

            if (creep.memory.packedPos) usedUpgradePositions.add(creep.memory.packedPos)
        }

        // Inform usedUpgradePositions

        return usedUpgradePositions
    }

    new RoomCacheObject({
        name: 'usedUpgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedUpgradePositions,
    })

    function findUsedFastFillerPositions() {
        // Construct usedFastFillerPositions

        const usedFastFillerPositions: Set<number> = new Set()

        // Loop through each sourceHarvester's name in the room

        for (const creepName of room.creepsFromRoom.fastFiller) {
            // Get the creep using its name

            const creep = Game.creeps[creepName]

            // If the creep is dying, iterate

            if (creep.isDying()) continue

            // If the creep has a packedFastFillerPos, record it in usedFastFillerPositions

            if (creep.memory.packedPos) usedFastFillerPositions.add(creep.memory.packedPos)
        }

        // Inform usedFastFillerPositions

        return usedFastFillerPositions
    }

    new RoomCacheObject({
        name: 'usedFastFillerPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedFastFillerPositions,
    })

    new RoomCacheObject({
        name: 'labContainer',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor() {},
    })

    new RoomCacheObject({
        name: 'remoteNamesByEfficacy',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor() {
            // Filter rooms that have some sourceEfficacies recorded

            const remotesWithEfficacies = room.memory.remotes.filter(function (roomName) {
                return Memory.rooms[roomName].sourceEfficacies.length
            })

            // Sort the remotes based on the average source efficacy

            return remotesWithEfficacies.sort(function (a1, b1) {
                return (
                    Memory.rooms[a1].sourceEfficacies.reduce((a2, b2) => a2 + b2) /
                        Memory.rooms[a1].sourceEfficacies.length -
                    Memory.rooms[b1].sourceEfficacies.reduce((a2, b2) => a2 + b2) /
                        Memory.rooms[b1].sourceEfficacies.length
                )
            })
        },
    })

    // Get the roomObject using it's name

    const roomObject = room.roomObjects[roomObjectName]

    // Inform the roomObject's value

    return roomObject.getValue()
}

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
        success: myColors.lightBlue,
        fail: myColors.red,
    }

    // If no type, type is success. Construct type from color

    if (!type) type = 'success'
    const color: string = colorsForTypes[type]

    // Create visuals

    room.visual.circle(pos2.x, pos2.y, { stroke: color })
    room.visual.line(pos1, pos2, { color })
}

interface RoutePart {
    exit: ExitConstant
    room: string
}

type Route = RoutePart[]

/**
 * @param opts options
 * @returns An array of RoomPositions
 */
Room.prototype.advancedFindPath = function (opts: PathOpts): RoomPosition[] {
    const room = this

    // Construct route

    function generateRoute(): Route | undefined {
        // If the goal is in the same room as the origin, inform that no route is needed

        if (opts.origin.roomName === opts.goal.pos.roomName) return undefined

        // Construct route by searching through rooms

        const route = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {
            // Essentially a costMatrix for the rooms, priority is for the lower values. Infinity is impassible

            routeCallback(roomName: string) {
                // If the goal is in the room, inform 1

                if (roomName === opts.goal.pos.roomName) return 1

                // Get the room's memory

                const roomMemory = Memory.rooms[roomName]

                // If there is no memory for the room, inform impassible

                if (!roomMemory) return Infinity

                // If the type is in typeWeights, inform the weight for the type

                if (opts.typeWeights && opts.typeWeights[roomMemory.type]) return opts.typeWeights[roomMemory.type]

                // Inform to consider this room

                return 2
            },
        })

        // If route doesn't work inform undefined

        if (route === ERR_NO_PATH) return undefined

        // Otherwise inform the route

        return route
    }

    // Construct path

    function generatePath() {
        const route = generateRoute()

        const pathFinderResult = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost || 2,
            swampCost: opts.swampCost || 8,
            maxRooms: route ? 100 : 1,
            maxOps: 100000,
            flee: opts.flee,

            // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

            roomCallback(roomName) {
                // Get the room using the roomName

                const room = Game.rooms[roomName]

                // If the type is in typeWeights, inform the weight for the type

                if (
                    opts.typeWeights &&
                    Memory.rooms[roomName] &&
                    opts.typeWeights[Memory.rooms[roomName].type] === Infinity
                )
                    return false

                // Create a costMatrix for the room

                const cm = new PathFinder.CostMatrix()

                // If there is no route

                if (!route) {
                    let x

                    // Configure y and loop through top exits

                    let y = 0
                    for (x = 0; x < 50; x += 1) cm.set(x, y, 255)

                    // Configure x and loop through left exits

                    x = 0
                    for (y = 0; y < 50; y += 1) cm.set(x, y, 255)

                    // Configure y and loop through bottom exits

                    y = 49
                    for (x = 0; x < 50; x += 1) cm.set(x, y, 255)

                    // Configure x and loop through right exits

                    x = 49
                    for (y = 0; y < 50; y += 1) cm.set(x, y, 255)
                }

                // Weight positions

                for (const weight in opts.weightPositions) {
                    // Use the weight to get the positions

                    const positions = opts.weightPositions[weight]

                    // Get the numeric value of the weight

                    const weightNum = parseInt(weight)

                    // Loop through each gameObject and set their pos to the weight in the cm

                    for (const pos of positions) cm.set(pos.x, pos.y, weightNum)
                }

                // Weight costMatrixes

                // Stop if there are no cost matrixes to weight

                if (opts.weightCostMatrixes) {
                    // Otherwise iterate through each x and y in the room

                    for (let x = 0; x < roomDimensions; x += 1) {
                        for (let y = 0; y < roomDimensions; y += 1) {
                            // Loop through each costMatrix

                            for (const weightCM of opts.weightCostMatrixes)
                                if (weightCM) cm.set(x, y, weightCM.get(x, y))
                        }
                    }
                }

                if (opts.weightCoordMaps) {
                    for (const coordMap of opts.weightCoordMaps) {
                        for (const index in coordMap) {
                            const packedCoord = parseInt(index)
                            if (coordMap[packedCoord] === 0) continue

                            const coord = unpackAsPos(packedCoord)

                            cm.set(coord.x, coord.y, coordMap[packedCoord])
                        }
                    }
                }

                if (opts.weightStampAnchors) {
                    if (room.memory.type === 'commune') {
                    } else if (room.memory.type === 'remote') {
                    }
                }

                // If there is no vision in the room, inform the costMatrix

                if (!room) return cm

                if (opts.creep && opts.creep.memory.roads)
                    for (const road of room.structures.road) cm.set(road.pos.x, road.pos.y, 1)

                // Weight structures

                for (const weight in opts.weightStructures) {
                    // Get the numeric value of the weight

                    const weightNum = parseInt(weight)

                    for (const structureType of opts.weightStructures[weight]) {
                        for (const structure of room.structures[structureType])
                            cm.set(structure.pos.x, structure.pos.y, weightNum)
                    }
                }

                for (const portal of room.structures.portal) cm.set(portal.pos.x, portal.pos.y, 255)

                // Loop trough each construction site belonging to an ally

                for (const cSite of room.allyCSites) cm.set(cSite.pos.x, cSite.pos.y, 255)

                // If there is a request to avoid enemy ranges

                avoidEnemyRanges()

                function avoidEnemyRanges() {
                    // Stop if avoidEnemyRanges isn't specified

                    if (!opts.avoidEnemyRanges) return

                    // Stop if the is a controller, it's mine, and it's in safemode

                    if (room.controller && room.controller.my && room.controller.safeMode) return

                    // Get enemies and loop through them

                    const enemyAttackers: Creep[] = []
                    const enemyRangedAttackers: Creep[] = []

                    for (const enemyCreep of room.enemyCreeps) {
                        if (enemyCreep.parts.ranged_attack > 0) {
                            enemyRangedAttackers.push(enemyCreep)
                            return
                        }

                        if (enemyCreep.parts.attack > 0) enemyAttackers.push(enemyCreep)
                    }

                    for (const enemyAttacker of enemyAttackers) {
                        // Construct rect and get positions inside

                        const positions = findCoordsInsideRect(
                            enemyAttacker.pos.x - 2,
                            enemyAttacker.pos.y - 2,
                            enemyAttacker.pos.x + 2,
                            enemyAttacker.pos.y + 2,
                        )

                        // Loop through positions and set them as impassible

                        for (const pos of positions) cm.set(pos.x, pos.y, 255)
                    }

                    for (const enemyAttacker of enemyRangedAttackers) {
                        // Construct rect and get positions inside

                        const positions = findCoordsInsideRect(
                            enemyAttacker.pos.x - 3,
                            enemyAttacker.pos.y - 3,
                            enemyAttacker.pos.x + 3,
                            enemyAttacker.pos.y + 3,
                        )

                        // Loop through positions and set them as impassible

                        for (const pos of positions) cm.set(pos.x, pos.y, 255)
                    }
                }

                if (opts.avoidNotMyCreeps) {
                    for (const creep of room.enemyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)

                    for (const creep of room.find(FIND_HOSTILE_POWER_CREEPS)) cm.set(creep.pos.x, creep.pos.y, 255)
                }

                // If avoiding structures that can't be walked on is enabled

                if (opts.avoidImpassibleStructures) {
                    // Get and loop through ramparts

                    const ramparts = room.structures.rampart

                    for (const rampart of ramparts) {
                        // If the rampart is mine

                        if (rampart.my) {
                            // If there is no weight for my ramparts, iterate

                            if (!opts.myRampartWeight) continue

                            // Otherwise, record rampart by the weight and iterate

                            cm.set(rampart.pos.x, rampart.pos.y, opts.myRampartWeight)
                            continue
                        }

                        // Otherwise if the rampart is owned by an ally, iterate

                        if (rampart.isPublic) continue

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

                // If avoidStationaryPositions is requested

                if (opts.avoidStationaryPositions) {
                    // Loop through them

                    for (const index in room.sources) {
                        // Find harvestPositions for sourceNames, iterating if there are none

                        const sourcePositions = room.sourcePositions[index]
                        if (!sourcePositions) continue

                        // Loop through each position of harvestPositions, have creeps prefer to avoid

                        for (const pos of sourcePositions) cm.set(pos.x, pos.y, 10)
                    }

                    // If the anchor is defined

                    if (room.anchor) {
                        // Get the upgradePositions, and use the anchor to find the closest upgradePosition to the anchor

                        const upgradePositions: RoomPosition[] = room.get('upgradePositions')
                        const deliverUpgradePos = room.anchor.findClosestByPath(upgradePositions, {
                            ignoreCreeps: true,
                            ignoreDestructibleStructures: true,
                            ignoreRoads: true,
                        })

                        // Loop through each pos of upgradePositions, assigning them as prefer to avoid in the cost matrix

                        for (const pos of upgradePositions) {
                            // If the pos and deliverUpgradePos are the same, iterate

                            if (arePositionsEqual(pos, deliverUpgradePos)) continue

                            // Otherwise have the creep prefer to avoid the pos

                            cm.set(pos.x, pos.y, 10)
                        }
                    }

                    // Get the hubAnchor

                    const hubAnchor =
                        room.memory.stampAnchors && room.memory.stampAnchors.hub[0]
                            ? unpackAsRoomPos(room.memory.stampAnchors.hub[0], roomName)
                            : undefined

                    // If the hubAnchor is defined

                    if (hubAnchor) cm.set(hubAnchor.x, hubAnchor.y, 10)

                    // Get fastFillerPositions

                    const fastFillerPositions: Coord[] = room.get('fastFillerPositions')

                    // If there are fastFillerPositions

                    if (fastFillerPositions.length) {
                        // Loop through each position of fastFillerPositions, have creeps prefer to avoid

                        for (const pos of fastFillerPositions) cm.set(pos.x, pos.y, 10)
                    }
                }

                // Inform the CostMatrix

                return cm
            },
        })

        // If the pathFindResult is incomplete, inform an empty array

        if (pathFinderResult.incomplete) {
            customLog(
                'Incomplete Path',
                `${pathFinderResult.path}, ${JSON.stringify(opts.goal.pos)}`,
                myColors.white,
                myColors.red,
            )

            room.pathVisual(pathFinderResult.path, 'red')
            room.visual.line(opts.origin, opts.goal.pos, {
                color: myColors.red,
                width: 0.15,
                opacity: 0.3,
                lineStyle: 'solid',
            })

            return []
        }

        // Otherwise inform the path from pathFinderResult

        return pathFinderResult.path
    }

    // Call path generation and inform the result

    return generatePath()
}

Room.prototype.findType = function (scoutingRoom: Room) {
    const room = this
    const { controller } = room

    // Record that the room was scouted this tick

    room.memory.lastScout = Game.time

    // Find the numbers in the room's name

    const [EWstring, NSstring] = room.name.match(/\d+/g)

    // Convert he numbers from strings into actual numbers

    const EW = parseInt(EWstring)
    const NS = parseInt(NSstring)

    // Use the numbers to deduce some room types - quickly!

    if (EW % 10 === 0 && NS % 10 === 0) {
        room.memory.type = 'intersection'
        return
    }

    if (EW % 10 === 0 || NS % 10 === 0) {
        room.memory.type = 'highway'
        return
    }

    if (EW % 5 === 0 && NS % 5 === 0) {
        room.memory.type = 'keeperCenter'
        return
    }

    if (Math.abs(5 - (EW % 10)) <= 1 && Math.abs(5 - (NS % 10)) <= 1) {
        room.memory.type = 'keeper'
        return
    }

    // If there is a controller

    if (controller) {
        // If the contoller is owned

        if (controller.owner) {
            // Stop if the controller is owned by me

            if (controller.my) return

            const owner = controller.owner.username

            room.memory.owner = owner

            // If the controller is owned by an ally

            if (Memory.allyList.includes(owner)) {
                room.memory.type = 'ally'
                return
            }

            room.memory.type = 'enemy'

            // If the controller is not owned by an ally

            const playerInfo = Memory.players[owner]

            if (!playerInfo) Memory.players[owner] = {}

            const level = controller.level

            if (level) Memory.players[owner].GRCL = Math.max(level, playerInfo.GRCL)
            room.memory.level = level

            // Offensive threat

            let threat = 0

            threat += Math.pow(level, 2)

            threat += room.structures.spawn.length * 50

            threat += room.structures.nuker.length * 300

            threat += Math.pow(room.structures.lab.length * 10000, 0.4)

            room.memory.OT = threat
            Memory.players[owner].OT = Math.max(threat, playerInfo.OT)

            // Defensive threat

            threat = 0

            const energy = room.findStoredResourceAmount(RESOURCE_ENERGY)

            room.memory.energy = energy
            threat += Math.pow(energy, 0.5)

            const ramparts = room.structures.rampart
            const avgRampartHits = ramparts.reduce((total, rampart) => total + rampart.hits, 0) / ramparts.length

            threat += Math.pow(avgRampartHits, 0.5)

            threat += room.structures.spawn.length * 100

            threat += room.structures.tower.length * 300

            threat += Math.pow(room.structures.extension.length * 400, 0.8)

            const hasTerminal = room.terminal !== undefined

            if (hasTerminal) {
                threat += 800

                room.memory.terminal = true
            }

            room.memory.powerEnabled = controller.isPowerEnabled

            room.memory.DT = threat
            Memory.players[owner].DT = Math.max(threat, playerInfo.DT)

            return
        }

        // Filter sources that have been harvested

        const harvestedSources = room.find(FIND_SOURCES).filter(source => source.ticksToRegeneration > 0)

        if (isReservedRemote()) return

        function isReservedRemote(): boolean {
            // If there is no reservation inform false

            if (!controller.reservation) return false

            // If I am the reserver, inform false

            if (controller.reservation.username === Memory.me) return false

            // If the reserver is an Invader, inform false

            if (controller.reservation.username === 'Invader') return false

            // Get roads

            const roads = room.structures.road

            // Get containers

            const containers = room.structures.container

            // If there are roads or containers or sources harvested, inform false

            if (roads.length === 0 && containers.length === 0 && !harvestedSources) return false

            // If the controller is not reserved by an ally

            if (!Memory.allyList.includes(controller.reservation.username)) {
                // Set type to enemyRemote and inform true

                room.memory.type = 'enemyRemote'
                room.memory.owner = controller.reservation.username
                return true
            }

            // Otherwise if the room is reserved by an ally

            // Set type to allyRemote and inform true

            room.memory.type = 'allyRemote'
            room.memory.owner = controller.reservation.username
            return true
        }

        if (isUnReservedRemote()) return

        function isUnReservedRemote() {
            if (controller.reservation) {
                // If I am the reserver, inform false

                if (controller.reservation.username === Memory.me) return false

                // If the reserver is an Invader, inform false

                if (controller.reservation.username === 'Invader') return false
            }

            // If there are no sources harvested

            if (harvestedSources.length === 0) return false

            // Find creeps that I don't own that aren't invaders

            const creepsNotMine = room.enemyCreeps.concat(room.allyCreeps)

            // Iterate through them

            for (const creep of creepsNotMine) {
                // If the creep is an invdader, iterate

                if (creep.owner.username === 'Invader') continue

                // If the creep has work parts

                if (creep.parts.work > 0) {
                    // If the creep is owned by an ally

                    if (Memory.allyList.includes(creep.owner.username)) {
                        // Set type to allyRemote and stop

                        room.memory.type = 'allyRemote'
                        room.memory.owner = creep.owner.username
                        return true
                    }

                    // If the creep is not owned by an ally

                    // Set type to enemyRemote and stop

                    room.memory.type = 'enemyRemote'
                    room.memory.owner = creep.owner.username
                    return true
                }
            }

            return false
        }

        if (room.makeRemote(scoutingRoom)) return

        room.memory.type = 'neutral'

        room.createClaimRequest()
    }
}

Room.prototype.makeRemote = function (scoutingRoom) {
    const room = this

    let distance = Game.map.getRoomLinearDistance(scoutingRoom.name, room.name)

    // Find distance from scoutingRoom

    if (distance < 4)
        distance = advancedFindDistance(scoutingRoom.name, room.name, {
            keeper: Infinity,
            enemy: Infinity,
            enemyRemote: Infinity,
            ally: Infinity,
            allyRemote: Infinity,
            highway: Infinity,
        })

    if (distance < 4) {
        // If the room is already a remote of the scoutingRoom

        if (room.memory.type === 'remote' && scoutingRoom.name === room.memory.commune) return true

        // Get the anchor from the scoutingRoom, stopping if it's undefined

        if (!scoutingRoom.anchor) return true

        const newSourceEfficacies = []

        // Get base planning data

        // loop through sourceNames

        for (const source of room.sources) {
            const path = room.advancedFindPath({
                origin: source.pos,
                goal: { pos: scoutingRoom.anchor, range: 3 },
                /* weightCostMatrixes: [roadCM] */
            })

            // Record the length of the path in the room's memory

            newSourceEfficacies.push(path.length)

            /*
            // Loop through positions of the path

            for (const pos of path) {

                // Record the pos in roadCM

                roadCM.set(pos.x, pos.y, 1)

                // Plan for a road at this position

                structurePlans.set(pos.x, pos.y, structureTypesByNumber[STRUCTURE_ROAD])
            }
            */
        }

        // If the room isn't already a remote

        if (room.memory.type !== 'remote' || !Memory.communes.includes(room.memory.commune)) {
            room.memory.type = 'remote'

            // Assign the room's commune as the scoutingRoom

            room.memory.commune = scoutingRoom.name

            // Query source positions

            delete room.memory.SP
            delete room._sourcePositions

            room.sourcePositions

            // Add the room's name to the scoutingRoom's remotes list

            scoutingRoom.memory.remotes.push(room.name)

            room.memory.sourceEfficacies = newSourceEfficacies

            room.memory.needs = []
            for (const key in remoteNeedsIndex) room.memory.needs[parseInt(key)] = 0

            return true
        }

        const currentAvgSourceEfficacy =
            room.memory.sourceEfficacies.reduce((sum, el) => sum + el) / room.memory.sourceEfficacies.length
        const newAvgSourceEfficacy = newSourceEfficacies.reduce((sum, el) => sum + el) / newSourceEfficacies.length

        // If the new average source efficacy is above the current, stop

        if (newAvgSourceEfficacy >= currentAvgSourceEfficacy) return true

        room.memory.type = 'remote'

        // Assign the room's commune as the scoutingRoom

        room.memory.commune = scoutingRoom.name

        // Query source positions

        delete room.memory.SP
        delete room._sourcePositions

        room.sourcePositions

        // Add the room's name to the scoutingRoom's remotes list

        scoutingRoom.memory.remotes.push(room.name)

        room.memory.sourceEfficacies = newSourceEfficacies

        room.memory.needs = []
        for (const key in remoteNeedsIndex) room.memory.needs[parseInt(key)] = 0

        return true
    }

    if (room.memory.type !== 'remote') return false

    if (!Memory.communes.includes(room.memory.commune)) return false

    return true
}

Room.prototype.cleanMemory = function () {
    const room = this

    // Stop if the room doesn't have a type

    if (!room.memory.type) return

    // Loop through keys in the room's memory

    for (const key in room.memory) {
        // Iterate if key is not part of roomTypeProperties

        if (!roomTypeProperties[key]) continue

        // Iterate if key part of this roomType's properties

        if (roomTypes[room.memory.type][key]) continue

        // Delete the property

        delete room.memory[key as keyof RoomMemory]
    }
}

Room.prototype.findStoredResourceAmount = function (resourceType) {
    const room = this

    // If room.storedResources doesn't exist, construct it

    if (!room.storedResources) room.storedResources = {}
    // Otherwise if there is already data about the storedResources, inform it
    else if (room.storedResources[resourceType]) return room.storedResources[resourceType]

    // Otherwise construct the number for this stored resource

    room.storedResources[resourceType] = 0

    // Create array of room and terminal

    const storageStructures = [room.storage, room.terminal]

    // Iterate through storageStructures

    for (const storageStructure of storageStructures) {
        // Iterate if storageStructure isn't defined

        if (!storageStructure) continue

        // Add the amount of resources in the storageStructure to the rooms storedResources of resourceType

        room.storedResources[resourceType] += storageStructure.store.getUsedCapacity(resourceType)
    }

    // Inform room's storedResources of resourceType

    return room.storedResources[resourceType]
}

Room.prototype.distanceTransform = function (
    initialCoords,
    visuals,
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

    for (x = Math.max(x1 - 1, 0); x < Math.min(x2 + 1, roomDimensions - 1); x += 1) {
        for (y = Math.max(y1 - 1, 0); y < Math.min(y2 + 1, roomDimensions - 1); y += 1) {
            packedCoord = packXY(x, y)
            distanceCoords[packedCoord] = initialCoords[packedCoord] === 255 ? 0 : 255
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
            top = distanceCoords[packXY(x, y - 1)] || 0
            left = distanceCoords[packXY(x - 1, y)] || 0
            topLeft = distanceCoords[packXY(x - 1, y - 1)] || 0
            topRight = distanceCoords[packXY(x + 1, y - 1)] || 0
            bottomLeft = distanceCoords[packXY(x - 1, y + 1)] || 0

            packedCoord = packXY(x, y)

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
            bottom = distanceCoords[packXY(x, y + 1)] || 0
            right = distanceCoords[packXY(x + 1, y)] || 0
            bottomRight = distanceCoords[packXY(x + 1, y + 1)] || 0
            topRight = distanceCoords[packXY(x + 1, y - 1)] || 0
            bottomLeft = distanceCoords[packXY(x - 1, y + 1)] || 0

            packedCoord = packXY(x, y)

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
                    fill: `hsl(${200}${distanceCoords[packXY(x, y)] * 10}, 100%, 60%)`,
                    opacity: 0.4,
                })
                this.visual.text(distanceCoords[packXY(x, y)].toString(), x, y)
            }
        }
    }

    return distanceCoords
}

Room.prototype.diagonalDistanceTransform = function (
    initialCoords,
    visuals,
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
            packedCoord = packXY(x, y)
            distanceCoords[packedCoord] = initialCoords[packedCoord] === 255 ? 0 : 255
        }
    }

    let top
    let left

    // Loop through the xs and ys inside the bounds

    for (x = x1; x <= x2; x += 1) {
        for (y = y1; y <= y2; y += 1) {
            top = distanceCoords[packXY(x, y - 1)] || 0
            left = distanceCoords[packXY(x - 1, y)] || 0

            packedCoord = packXY(x, y)

            distanceCoords[packedCoord] = Math.min(Math.min(top, left) + 1, distanceCoords[packedCoord])
        }
    }

    let bottom
    let right

    // Loop through the xs and ys inside the bounds

    for (x = x2; x >= x1; x -= 1) {
        for (y = y2; y >= y1; y -= 1) {
            bottom = distanceCoords[packXY(x, y + 1)] || 0
            right = distanceCoords[packXY(x + 1, y)] || 0

            packedCoord = packXY(x, y)

            distanceCoords[packedCoord] = Math.min(Math.min(bottom, right) + 1, distanceCoords[packedCoord])
        }
    }

    if (visuals) {
        // Loop through the xs and ys inside the bounds

        for (x = x1; x <= x2; x += 1) {
            for (y = y1; y <= y2; y += 1) {
                this.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                    fill: `hsl(${200}${distanceCoords[packXY(x, y)] * 10}, 100%, 60%)`,
                    opacity: 0.4,
                })
                this.visual.text(distanceCoords[packXY(x, y)].toString(), x, y)
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

    for (const coord of seeds) visitedCoords[pack(coord)] = 1

    // So long as there are positions in this gen

    while (thisGeneration.length) {
        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const coord1 of thisGeneration) {
            // If the depth isn't 0

            if (depth > 0) {
                const packedCoord1 = pack(coord1)

                // Iterate if the terrain is a wall

                if (terrainCoords[packedCoord1] === 255) continue

                if (coordMap && coordMap[pack(coord1)] > 0) continue

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

            for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
                const packedCoord2 = pack(coord2)

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
    console.log(room.name)

    if (opts.visuals) {
        for (const coord of opts.startCoords)
            this.visual.circle(coord.x, coord.y, {
                stroke: myColors.yellow,
            })
    }

    /**
     *
     */
    function isViableAnchor(coord1: Coord): boolean {
        // Get the value of the pos4271

        const posValue = opts.coordMap[pack(coord1)]
        if (posValue === 255) return false
        if (posValue === 0) return false

        // If the posValue is less than the requiredValue, inform false

        if (posValue < opts.requiredValue) return false

        // If adjacentToRoads is a requirement

        if (!opts.adjacentToRoads) return true

        if (opts.roadCoords[pack(coord1)] > 0) return false

        // Loop through adjacent positions

        for (const coord2 of findCoordsInsideRect(coord1.x - 1, coord1.y - 1, coord1.x + 1, coord1.y + 1)) {
            // If the adjacentPos isn't a roadPosition, iterate

            if (opts.roadCoords[pack(coord2)] !== 1) continue

            // Otherwise set nearbyRoad to true and stop the loop

            return true
        }

        return false
    }

    while (opts.reduceIterations >= 0) {
        // Construct a cost matrix for visited tiles and add seeds to it

        let visitedCoords = new Uint8Array(2500)

        // Record startPos as visited

        for (const coord of opts.startCoords) visitedCoords[pack(coord)] = 1

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

                    if (localVisitedCoords[pack(coord2)] === 1) continue

                    // Otherwise record that it has been visited

                    localVisitedCoords[pack(coord2)] = 1

                    if (opts.coordMap[pack(coord2)] === 0) continue

                    // Add it tofastFillerSide the next gen

                    nextGeneration.push(coord2)
                }
            }

            // Try without using impassibles

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

                        if (localVisitedCoords[pack(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[pack(coord2)] = 1

                        if (opts.coordMap[pack(coord2)] === 0) continue

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            // If no positions are found, try again using impassibles

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

                        if (localVisitedCoords[pack(coord2)] === 1) continue

                        // Otherwise record that it has been visited

                        localVisitedCoords[pack(coord2)] = 1

                        // Add it tofastFillerSide the next gen

                        nextGeneration.push(coord2)
                    }
                }
            }

            if (opts.visuals) {
                for (const coord of nextGeneration)
                    this.visual.text(opts.coordMap[pack(coord)].toString(), coord.x, coord.y, {
                        font: 0.5,
                        color: myColors.yellow,
                    })
            }

            console.log(i, JSON.stringify(nextGeneration))

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

Room.prototype.pathVisual = function (path, color) {
    const room = this

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

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

    room.visual.poly(path, {
        stroke: myColors[color],
        strokeWidth: 0.15,
        opacity: 0.3,
        lineStyle: 'solid',
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

        this.memory.cSiteTargetID = anchor.findClosestByPath(cSitesOfType, {
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

    for (const coord of thisGeneration) visitedCoords[pack(coord)] = 1

    // So long as there are positions in this gen

    while (thisGeneration.length) {
        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const coord1 of thisGeneration) {
            // If the depth isn't 0

            if (depth > 0) {
                const packedCoord1 = pack(coord1)

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
                const packedCoord2 = pack(coord2)

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

    return this.unprotectedCoords
}

Room.prototype.groupRampartPositions = function (rampartPositions) {
    const room = this

    // Construct a costMatrix to store visited positions

    const visitedCoords = new Uint8Array(2500)

    const groupedPositions = []
    let groupIndex = 0

    // Loop through each pos of positions

    for (const packedPos of rampartPositions) {
        const pos = unpackAsPos(packedPos)

        // If the pos has already been visited, iterate

        if (visitedCoords[pack(pos)] === 1) continue

        // Record that this pos has been visited

        visitedCoords[pack(pos)] = 1

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
                // Construct a rect and get the positions in a range of 1 (not diagonals)

                const adjacentPositions = findCoordsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1)

                // Loop through adjacent positions

                for (const adjacentPos of adjacentPositions) {
                    // Iterate if adjacentPos is out of room bounds

                    if (
                        adjacentPos.x <= 0 ||
                        adjacentPos.x >= roomDimensions ||
                        adjacentPos.y <= 0 ||
                        adjacentPos.y >= roomDimensions
                    )
                        continue

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (visitedCoords[pack(adjacentPos)] === 1) continue

                    // Otherwise record that it has been visited

                    visitedCoords[pack(adjacentPos)] = 1

                    // If a rampart is not planned for this position, iterate

                    if (this.rampartCoords[pack(adjacentPos)] !== 1) continue

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

Room.prototype.createPullTask = function (creator) {
    const room = this
}

Room.prototype.createPickupTasks = function (creator) {
    const room = this
}

Room.prototype.createOfferTasks = function (creator) {
    const room = this
}

Room.prototype.createTransferTasks = function (creator) {
    const room = this
}

Room.prototype.createWithdrawTasks = function (creator) {
    const room = this
}

Room.prototype.estimateIncome = function () {
    const harvesterNames = this.creepsFromRoom.source1Harvester
        .concat(this.creepsFromRoom.source2Harvester)
        .concat(this.creepsFromRoom.source1RemoteHarvester)
        .concat(this.creepsFromRoom.source2RemoteHarvester)

    // Construct income starting at 0

    let income = 0

    for (const creepName of harvesterNames) {
        // Get the creep using creepName

        const creep = Game.creeps[creepName]

        // Add the number of work parts owned by the creep at a max of 5, times harvest power

        income += Math.min(6, creep.parts.work) * minHarvestWorkRatio
    }

    // Inform income

    return income
}

Room.prototype.findRoomPositionsInsideRect = function (x1, y1, x2, y2) {
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

Room.prototype.getPartsOfRoleAmount = function (role, type) {
    // Intilaize the partsAmount

    let partsAmount = 0
    let creep

    // Loop through every creepName in the creepsFromRoom of the specified role

    for (const creepName of this.creepsFromRoom[role]) {
        // Get the creep using creepName

        creep = Game.creeps[creepName]

        // If there is no specified type

        if (!type) {
            // Increase partsAmount by the creep's body size, and iterate

            partsAmount += creep.body.length
            continue
        }

        // Otherwise increase partsAmount by the creep's parts count of the specified type

        partsAmount += creep.body.filter(part => part.type === type).length
    }

    // Inform partsAmount

    return partsAmount
}

Room.prototype.createClaimRequest = function () {
    if (this.sources.length !== 2) return false

    if (this.memory.notClaimable) return false

    if (Memory.claimRequests[this.name]) return false

    if (basePlanner(this) === 'failed') return false

    let score = 0

    // Prefer communes not too close and not too far from the commune

    const closestClaimTypeName = findClosestClaimType(this.name)
    const closestCommuneRange = Game.map.getRoomLinearDistance(closestClaimTypeName, this.name)

    score += Math.abs(prefferedCommuneRange - closestCommuneRange)

    score += this.sourcePaths[0].length / 10
    score += this.sourcePaths[1].length / 10

    score += this.upgradePathLength / 10

    score += this.findSwampPlainsRatio() * 10

    Memory.claimRequests[this.name] = {
        needs: [1, 20, 0],
        score,
    }

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

Room.prototype.visualizeCoordMap = function (coordMap) {
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            this.visual.text(coordMap[packXY(x, y)].toString(), x, y, {
                font: 0.5,
            })
        }
    }
}
