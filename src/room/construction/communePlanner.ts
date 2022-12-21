import { link } from 'fs'
import {
    CPUMaxPerTick,
    defaultRoadPlanningPlainCost,
    EXIT,
    maxRampartGroupSize,
    customColors,
    NORMAL,
    PROTECTED,
    roadUpkeepCost,
    roomDimensions,
    stamps,
    TO_EXIT,
    UNWALKABLE,
} from 'international/constants'
import {
    areCoordsEqual,
    createPosMap,
    customLog,
    findAvgBetweenCoords,
    findClosestPos,
    findCoordsInsideRect,
    getRange,
    getRangeOfCoords,
    packAsNum,
    packXYAsNum,
    unpackNumAsCoord,
    unpackNumAsPos,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { packPosList } from 'other/packrat'
import 'other/RoomVisual'
import { toASCII } from 'punycode'
import { CommuneManager } from 'room/commune/commune'
import { rampartPlanner } from './rampartPlanner'

interface PlanStampOpts {
    stampType: StampTypes
    count: number
    startCoords: Coord[]
    initialWeight?: number
    adjacentToRoads?: boolean
    diagonalDT?: boolean
    coordMap?: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
}

/**
 *
 */
export class CommunePlanner {
    communeManager: CommuneManager
    room: Room

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
        this.room = communeManager.room
    }
    public run() {}
    private flipStampVertical() {}
    private flipStampHorizontal() {}
    private planStamps(opts: PlanStampOpts) {}
    private planStamp(startPos: Coord) {}
    private planSourceStructures() {}
}

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room) {
    // Stop if there isn't sufficient CPU

    if (Game.cpu.bucket < CPUMaxPerTick) return false
    const terrainCoords = internationalManager.getTerrainCoords(room.name)

    room.baseCoords = new Uint8Array(terrainCoords)

    // Loop through each exit of exits

    for (const pos of room.find(FIND_EXIT)) {
        // Record the exit as a pos to avoid

        room.baseCoords[packAsNum(pos)] = 255

        // Loop through adjacent positions

        for (const coord of findCoordsInsideRect(pos.x - 2, pos.y - 2, pos.x + 2, pos.y + 2))
            room.baseCoords[packAsNum(coord)] = 255
    }

    room.roadCoords = new Uint8Array(terrainCoords)
    room.rampartCoords = new Uint8Array(terrainCoords)

    if (!room.memory.stampAnchors) {
        room.memory.stampAnchors = {}

        for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
    }

    function recordAdjacentPositions(x: number, y: number, range: number, weight?: number) {
        // Loop through adjacent positions

        for (const coord of findCoordsInsideRect(x - range, y - range, x + range, y + range)) {
            // Otherwise record the position in the base cost matrix as avoid

            room.baseCoords[packAsNum(coord)] = Math.max(weight || 255, room.baseCoords[packAsNum(coord)])
        }
    }

    // Get the controller and set positions nearby to avoid

    recordAdjacentPositions(room.controller.pos.x, room.controller.pos.y, 2)

    // Get and record the mineralHarvestPos as avoid

    for (const coord of room.mineralPositions) room.baseCoords[packAsNum(coord)] = 255

    // Record the positions around sources as unusable

    const sources = room.sources

    // Loop through each source, marking nearby positions as avoid

    for (const sourceIndex in sources) {
        const sourcePositions = room.sourcePositions[sourceIndex]

        recordAdjacentPositions(sourcePositions[0].x, sourcePositions[0].y, 1)

        for (const pos of sourcePositions) room.baseCoords[packAsNum(pos)] = 255
    }

    let closestSourceToController: Source
    let closestSourceToControllerRange = Infinity

    for (const source of sources) {
        const range = room.advancedFindPath({
            origin: source.pos,
            goals: [{ pos: room.controller.pos, range: 1 }],
            plainCost: defaultRoadPlanningPlainCost,
        }).length
        if (range > closestSourceToControllerRange) continue

        closestSourceToControllerRange = range
        closestSourceToController = source
    }

    let path: RoomPosition[]

    let avgControllerSourcePos: RoomPosition
    if (closestSourceToControllerRange <= 1) {
        avgControllerSourcePos = closestSourceToController.pos
    } else {
        path = room.advancedFindPath({
            origin: closestSourceToController.pos,
            goals: [{ pos: room.controller.pos, range: 1 }],
            weightCoordMaps: [room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        avgControllerSourcePos = path[Math.floor(path.length / 2)]
    }

    const controllerAdjacentCoords = findCoordsInsideRect(
        room.controller.pos.x - 3,
        room.controller.pos.y - 3,
        room.controller.pos.x + 3,
        room.controller.pos.y + 3,
    )

    for (const coord of controllerAdjacentCoords) room.baseCoords[packAsNum(coord)] = 255

    interface PlanStampOpts {
        stampType: StampTypes
        count: number
        startCoords: Coord[]
        initialWeight?: number
        adjacentToRoads?: boolean
        normalDT?: boolean
        coordMap?: CoordMap
        minAvoid?: number
        cardinalFlood?: boolean
    }

    let stamp
    let packedStampAnchor
    let stampAnchor
    let structureType
    let pos
    let x
    let y

    /**
     * Tries to plan a stamp's placement in a room around an orient. Will inform the achor of the stamp if successful
     */
    function planStamp(opts: PlanStampOpts): false | RoomPosition[] {
        if (!opts.coordMap) opts.coordMap = room.baseCoords
        else {
            opts.coordMap = new Uint8Array(opts.coordMap)

            // Loop through each exit of exits

            for (const pos of room.find(FIND_EXIT)) {
                // Record the exit as a pos to avoid

                opts.coordMap[packAsNum(pos)] = 255

                // Loop through adjacent positions

                for (const coord of findCoordsInsideRect(pos.x - 2, pos.y - 2, pos.x + 2, pos.y + 2))
                    opts.coordMap[packAsNum(coord)] = 255
            }
        }

        // Define the stamp using the stampType

        stamp = stamps[opts.stampType]

        const newStampAnchors: RoomPosition[] = []
        const newStampAnchorsPacked: number[] = []

        // So long as the count is more than 0

        while (opts.count > 0) {
            opts.count -= 1

            // If an anchor already exists with this index

            if (room.memory.stampAnchors[opts.stampType][opts.count]) {
                for (packedStampAnchor of room.memory.stampAnchors[opts.stampType]) {
                    stampAnchor = unpackNumAsCoord(packedStampAnchor)

                    for (structureType in stamp.structures) {
                        for (pos of stamp.structures[structureType]) {
                            // Re-assign the pos's x and y to align with the offset

                            x = pos.x + stampAnchor.x - stamp.offset
                            y = pos.y + stampAnchor.y - stamp.offset

                            // If the structureType is a road

                            if (structureType === STRUCTURE_ROAD) {
                                // Record the position in roadCM and iterate

                                room.roadCoords[packXYAsNum(x, y)] = 1
                                continue
                            }

                            room.baseCoords[packXYAsNum(x, y)] = 255
                            room.roadCoords[packXYAsNum(x, y)] = 255
                        }
                    }
                }

                continue
            }

            // Run distance transform with the baseCM

            const distanceCoords = opts.normalDT
                ? room.distanceTransform(opts.coordMap, false, opts.minAvoid)
                : room.diagonalDistanceTransform(opts.coordMap, false, opts.minAvoid)

            // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

            stampAnchor = stamp.asymmetry
                ? room.findClosestPosOfValueAsym({
                      coordMap: distanceCoords,
                      startCoords: opts.startCoords,
                      requiredValue: stamp.size,
                      reduceIterations: 0,
                      initialWeight: opts.initialWeight || 0,
                      adjacentToRoads: opts.adjacentToRoads,
                      roadCoords: opts.adjacentToRoads ? room.roadCoords : undefined,
                      offset: stamp.offset,
                      asymOffset: stamp.asymmetry,
                      cardinalFlood: opts.cardinalFlood,
                      protectionOffset: stamp.protectionOffset,
                      /* visuals: opts.stampType === 'labs', */
                  })
                : room.findClosestPosOfValue({
                      coordMap: distanceCoords,
                      startCoords: opts.startCoords,
                      requiredValue: stamp.size,
                      reduceIterations: 0,
                      initialWeight: opts.initialWeight || 0,
                      adjacentToRoads: opts.adjacentToRoads,
                      roadCoords: opts.adjacentToRoads ? room.roadCoords : undefined,
                      cardinalFlood: opts.cardinalFlood,
                      protectionOffset: stamp.protectionOffset,
                      /* visuals: opts.stampType === 'extension' */
                  })

            // Inform false if no anchor was generated

            if (!stampAnchor) return false

            // Add the anchor to stampAnchors based on its type

            newStampAnchors.push(stampAnchor)
            newStampAnchorsPacked.push(packAsNum(stampAnchor))

            for (structureType in stamp.structures) {
                // Loop through positions

                for (pos of stamp.structures[structureType]) {
                    // Re-assign the pos's x and y to align with the offset

                    x = pos.x + stampAnchor.x - stamp.offset
                    y = pos.y + stampAnchor.y - stamp.offset

                    // If the structureType is a road

                    if (structureType === STRUCTURE_ROAD) {
                        // Record the position in roadCM and iterate

                        room.roadCoords[packXYAsNum(x, y)] = 1
                        continue
                    }

                    room.baseCoords[packXYAsNum(x, y)] = 255
                    room.roadCoords[packXYAsNum(x, y)] = 255
                }
            }
        }

        room.memory.stampAnchors[opts.stampType] =
            room.memory.stampAnchors[opts.stampType].concat(newStampAnchorsPacked)
        return newStampAnchors
    }

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'fastFiller',
            count: 1,
            startCoords: [avgControllerSourcePos],
            normalDT: true,
            cardinalFlood: true,
        })
    )
        return 'failed'

    // If the stamp failed to be planned

    if (!room.memory.stampAnchors.fastFiller.length) {
        // Record that the room is not claimable and stop

        room.memory.NC = true
        return 'failed'
    }

    for (const coord of controllerAdjacentCoords) {
        if (room.roadCoords[packAsNum(coord)] > 0) continue

        room.baseCoords[packAsNum(coord)] = 0
    }

    const centerUpgadePos = room.centerUpgradePos
    if (!centerUpgadePos) return 'failed'

    const upgradePositions = room.upgradePositions

    // Loop through each upgradePos

    for (const pos of upgradePositions) {
        // Mark as avoid in road and base cost matrixes

        room.baseCoords[packAsNum(pos)] = 255
        room.roadCoords[packAsNum(pos)] = 20
    }

    /* room.visualizeCoordMap(room.baseCoords) */

    // Try to plan the stamp

    path = room.advancedFindPath({
        origin:
            getRangeOfCoords(room.anchor, avgControllerSourcePos) <= 3
                ? closestSourceToController.pos
                : avgControllerSourcePos,
        goals: [{ pos: room.anchor, range: 3 }],
        weightCoordMaps: [room.roadCoords],
        plainCost: defaultRoadPlanningPlainCost,
    })

    if (
        !planStamp({
            stampType: 'hub',
            count: 1,
            startCoords: [path[path.length - 1]],
            normalDT: true,
            cardinalFlood: true,
        })
    )
        return 'failed'

    const hubAnchor = unpackNumAsPos(room.memory.stampAnchors.hub[0], room.name)

    const fastFillerHubAnchor = findAvgBetweenCoords(room.anchor, hubAnchor)

    // Get the closest upgrade pos

    const closestUpgradePos = upgradePositions[upgradePositions.length - 1]
    if (!closestUpgradePos) return 'failed'

    for (const index in sources) {
        // get the closestHarvestPos using the sourceName, iterating if undefined

        const closestSourcePos = room.sourcePositions[index][0]

        if (!room.memory.stampAnchors.container.includes(packAsNum(closestSourcePos))) {
            room.memory.stampAnchors.container.push(packAsNum(closestSourcePos))
        }

        for (const index2 in room.sources) {
            if (index === index2) continue

            for (const pos of room.sourcePositions[index2]) room.roadCoords[packAsNum(pos)] = 50

            const closestSourcePos = room.sourcePositions[index2][0]

            const adjacentCoords = findCoordsInsideRect(
                closestSourcePos.x - 1,
                closestSourcePos.y - 1,
                closestSourcePos.x + 1,
                closestSourcePos.y + 1,
            )

            for (const coord of adjacentCoords) {
                if (room.roadCoords[packAsNum(coord)] > 0) continue

                room.roadCoords[packAsNum(coord)] = 50
            }

            room.roadCoords[packAsNum(closestSourcePos)] = 150
        }

        // Path from the fastFillerAnchor to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestSourcePos,
            goals: [{ pos: room.anchor, range: 3 }],
            weightCoordMaps: [room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        // Record the path positions in roadCM

        for (const pos of path) room.roadCoords[packAsNum(pos)] = 1

        // Path from the centerUpgradePos to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestSourcePos,
            goals: [{ pos: closestUpgradePos, range: 1 }],
            weightCoordMaps: [room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        // Loop through positions of the path

        // Record the pos in roadCM

        for (const pos of path) room.roadCoords[packAsNum(pos)] = 1
    }

    room.roadCoords[packAsNum(closestUpgradePos)] = 1

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'labs',
            count: 1,
            startCoords: [hubAnchor],
            normalDT: true,
            coordMap: room.roadCoords,
            cardinalFlood: true,
        })
    )
        return 'failed'

    // Plan roads

    // Path from the fastFillerAnchor to the hubAnchor

    path = room.advancedFindPath({
        origin: hubAnchor,
        goals: [{ pos: room.anchor, range: 4 }],
        weightCoordMaps: [room.roadCoords],
        plainCost: defaultRoadPlanningPlainCost,
    })

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'extensions',
            count: 6,
            startCoords: [hubAnchor],
        })
    )
        return 'failed'

    // Plan the stamp x times

    for (const extensionsAnchor of room.memory.stampAnchors.extensions) {
        // Path from the extensionsAnchor to the hubAnchor

        path = room.advancedFindPath({
            origin: unpackNumAsPos(extensionsAnchor, room.name),
            goals: [{ pos: hubAnchor, range: 2 }],
            weightCoordMaps: [room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        // Loop through positions of the path

        for (const pos of path) room.roadCoords[packAsNum(pos)] = 1
    }

    // Loop through positions of the path

    for (const pos of path) {
        // Record the pos in roadCM

        room.roadCoords[packAsNum(pos)] = 1
    }

    // Plan for a container at the pos

    /* structurePlans.set(centerUpgadePos.x, centerUpgadePos.y, structureTypesByNumber[STRUCTURE_CONTAINER]) */

    // Path from the hubAnchor to the closestUpgradePos

    path = room.advancedFindPath({
        origin: centerUpgadePos,
        goals: [{ pos: hubAnchor, range: 2 }],
        weightCoordMaps: [room.roadCoords],
        plainCost: defaultRoadPlanningPlainCost,
    })

    // Loop through positions of the path

    for (const pos of path) room.roadCoords[packAsNum(pos)] = 1

    // loop through sourceNames

    for (const index in sources) {
        // Get the closestHarvestPos using the sourceName, iterating if undefined

        const closestSourcePos = room.sourcePositions[index][0]

        // Record the pos in roadCM

        room.roadCoords[packAsNum(closestSourcePos)] = 255
    }

    // Path from the hubAnchor to the labsAnchor

    path = room.advancedFindPath({
        origin: unpackNumAsPos(room.memory.stampAnchors.labs[0], room.name),
        goals: [{ pos: hubAnchor, range: 1 }],
        weightCoordMaps: [room.roadCoords],
        plainCost: defaultRoadPlanningPlainCost,
    })

    // Loop through positions of the path

    // Record the pos in roadCM

    for (const pos of path) room.roadCoords[packAsNum(pos)] = 1

    const closestMineralHarvestPos = room.mineralPositions[0]
    if (closestMineralHarvestPos) room.roadCoords[packAsNum(closestMineralHarvestPos)] = 255

    if (!room.memory.stampAnchors.container.includes(packAsNum(closestMineralHarvestPos))) {
        room.memory.stampAnchors.container.push(packAsNum(closestMineralHarvestPos))
    }

    // Path from the hubAnchor to the mineralHarvestPos

    path = room.advancedFindPath({
        origin: closestMineralHarvestPos,
        goals: [{ pos: hubAnchor, range: 1 }],
        weightCoordMaps: [room.roadCoords],
        plainCost: defaultRoadPlanningPlainCost,
    })

    // Loop through positions of the path

    // Record the pos in roadCM

    for (const pos of path) room.roadCoords[packAsNum(pos)] = 1

    // Plan for a road at the mineral's pos

    if (!room.memory.stampAnchors.extractor.length) room.memory.stampAnchors.extractor.push(packAsNum(room.mineral.pos))

    // Record road plans in the baseCM

    // Iterate through each x and y in the room
    /*
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            // If there is road at the pos, assign it as avoid in baseCM

            if (room.roadCoords[packAsNum(pos)] === 1) room.baseCoords[packAsNum(pos)] = 255
        }
    }
 */
    // Mark the closestUpgradePos as avoid in the CM

    room.baseCoords[packAsNum(closestUpgradePos)] = 255

    // Construct extraExtensions count

    let extraExtensionsAmount =
        CONTROLLER_STRUCTURES.extension[8] -
        stamps.fastFiller.structures.extension.length -
        /* stamps.hub.structures.extension.length - */
        room.memory.stampAnchors.extensions.length * stamps.extensions.structures.extension.length -
        room.memory.stampAnchors.extension.length -
        room.memory.stampAnchors.sourceExtension.length

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'tower',
            count: 6,
            startCoords: [fastFillerHubAnchor],
            adjacentToRoads: true,
            coordMap: room.roadCoords,
            minAvoid: 255,
        })
    )
        return 'failed'

    rampartPlanner(room)

    // Iterate through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            const packedCoord = packXYAsNum(x, y)
            // If there is road at the pos, assign it as avoid in baseCM

            if (room.roadCoords[packedCoord] === 1) room.baseCoords[packedCoord] = 255
        }
    }

    if (room.memory.stampAnchors.sourceLink.length + room.memory.stampAnchors.sourceExtension.length === 0) {
        // loop through sourceNames

        for (const sourceIndex in sources) {
            // Record that the source has no link

            let sourceHasLink = false

            // Get the closestHarvestPos of this sourceName

            const closestSourcePos = room.sourcePositions[sourceIndex][0]

            const OGCoords: Map<number, number> = new Map()

            for (let posIndex = 1; posIndex < room.sourcePositions[sourceIndex].length; posIndex += 1) {
                const packedCoord = packAsNum(room.sourcePositions[sourceIndex][posIndex])

                OGCoords.set(packedCoord, room.roadCoords[packedCoord])
                room.roadCoords[packedCoord] = 0
            }

            let adjacentCoords = findCoordsInsideRect(
                closestSourcePos.x - 3,
                closestSourcePos.y - 3,
                closestSourcePos.x + 3,
                closestSourcePos.y + 3,
            )

            for (const coord of adjacentCoords) {
                // If the coord is probably not protected

                if (room.unprotectedCoords[packAsNum(coord)] === 0) continue

                room.rampartCoords[packAsNum(closestSourcePos)] = 1
                break
            }

            // Find positions adjacent to source

            adjacentCoords = findCoordsInsideRect(
                closestSourcePos.x - 1,
                closestSourcePos.y - 1,
                closestSourcePos.x + 1,
                closestSourcePos.y + 1,
            )

            // Sort adjacentPositions by range from the anchor

            adjacentCoords.sort(function (a, b) {
                return getRange(a.x, hubAnchor.x, a.y, hubAnchor.y) - getRange(b.x, hubAnchor.x, b.y, hubAnchor.y)
            })

            // Loop through each pos

            for (const coord1 of adjacentCoords) {
                const packedCoord1 = packAsNum(coord1)

                const roadCoordsValue = room.roadCoords[packedCoord1]

                // Iterate if plan for pos is in use

                if (roadCoordsValue === 1) continue
                if (roadCoordsValue === 255) continue

                if (room.rampartCoords[packedCoord1] > 0) continue

                if (coord1.x < 2 || coord1.x >= roomDimensions - 2 || coord1.y < 2 || coord1.y >= roomDimensions - 2)
                    continue

                // Otherwise

                // Assign 255 to this pos in baseCM

                room.baseCoords[packedCoord1] = 255
                room.roadCoords[packedCoord1] = 255
                OGCoords.set(packedCoord1, 255)

                // If there is no planned link for this source, plan one

                if (!sourceHasLink) {
                    sourceHasLink = true
                    room.memory.stampAnchors.sourceLink.push(packedCoord1)

                    const adjacentCoords = findCoordsInsideRect(coord1.x - 3, coord1.y - 3, coord1.x + 3, coord1.y + 3)

                    for (const coord2 of adjacentCoords) {
                        // If the coord is probably not protected

                        if (room.unprotectedCoords[packAsNum(coord2)] === 0) continue

                        room.rampartCoords[packedCoord1] = 1
                        break
                    }

                    continue
                }

                // Otherwise plan for an extension

                room.memory.stampAnchors.sourceExtension.push(packedCoord1)

                // Decrease the extraExtensionsAmount and iterate

                extraExtensionsAmount -= 1
                continue
            }

            for (const [coord, value] of OGCoords) room.roadCoords[coord] = value
        }
    }

    /*
    if (!room.memory.stampAnchors.rampart.length) {
        for (let x = 0; x < roomDimensions; x += 1) {
            for (let y = 0; y < roomDimensions; y += 1) {
                if (room.rampartCoords[packXYAsNum(x, y)] === 1) room.memory.stampAnchors.rampart.push(packAsNum({ x, y }))
            }
        }
    }
 */
    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'extension',
            count: extraExtensionsAmount,
            startCoords: [hubAnchor],
            adjacentToRoads: true,
            coordMap: room.roadCoords,
            minAvoid: 255,
        })
    )
        return 'failed'

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'observer',
            count: 1,
            startCoords: [fastFillerHubAnchor],
            coordMap: room.roadCoords,
        })
    )
        return 'failed'

    const observerAnchor = unpackNumAsPos(room.memory.stampAnchors.observer[0], room.name)

    let adjacentCoords = findCoordsInsideRect(
        observerAnchor.x - 3,
        observerAnchor.y - 3,
        observerAnchor.x + 3,
        observerAnchor.y + 3,
    )

    if (!room.unprotectedCoords) room.findUnprotectedCoords()

    for (const coord of adjacentCoords) {
        // If the coord is probably not protected

        if (room.unprotectedCoords[packAsNum(coord)] === 0) continue

        room.rampartCoords[packAsNum(observerAnchor)] = 1
        break
    }

    // Iterate through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            const packedPos = packXYAsNum(x, y)

            if (room.rampartCoords[packedPos] === 1) room.memory.stampAnchors.rampart.push(packedPos)

            if (!room.memory.stampAnchors.road.includes(packedPos) && room.roadCoords[packedPos] === 1)
                room.memory.stampAnchors.road.push(packedPos)
        }
    }

    // Record planning results in the room's global and inform true

    room.memory.PC = true
    return true
}
