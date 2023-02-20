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
    RESULT_SUCCESS,
    RESULT_FAIL,
    cardinalOffsets,
    adjacentOffsets,
} from 'international/constants'
import {
    areCoordsEqual,
    createPosMap,
    customLog,
    findAdjacentCoordsToCoord,
    findAdjacentCoordsToXY,
    findAvgBetweenCoords,
    findClosestPos,
    findCoordsInsideRect,
    getRange,
    getRangeOfCoords,
    isXYExit,
    isXYInBorder,
    isXYInRoom,
    packAsNum,
    packXYAsNum,
    unpackNumAsCoord,
    unpackNumAsPos,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { packCoord, packPosList, packXYAsCoord, unpackCoord } from 'other/codec'
import 'other/RoomVisual'
import { toASCII } from 'punycode'
import { CommuneManager } from 'room/commune/commune'
import { rampartPlanner } from './construction/rampartPlanner'
import { RoomManager } from './room'
import { openStdin } from 'process'

interface PlanStampsArgs {
    stampType: StampTypes
    count: number
    startCoords: Coord[]
    dynamic?: boolean
    diagonalDT?: boolean
    coordMap?: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
    conditions?(coord: Coord): boolean
}

interface FindDynamicStampAnchorArgs {
    stamp: Stamp
    startCoords: Coord[]
    coordMap: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
    conditions?(coord: Coord): boolean
}

interface FindStampAnchorArgs {
    stamp: Stamp
    startCoords: Coord[]
    coordMap: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
    conditions?(coord: Coord): boolean
}

/**
 *
 */
export class CommunePlanner {
    roomManager: RoomManager
    room: Room

    terrainCoords: CoordMap
    exitCoords: Set<string>
    byExitCoords: Uint8Array
    baseCoords: Uint8Array
    roadCoords: Uint8Array
    rampartCoords: Uint8Array
    diagonalCoords: Uint8Array
    gridCoords: Uint8Array

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    _planAttempt: BasePlanAttempt
    get planAttempt() {
        if (this._planAttempt) return this._planAttempt

        const roomMemory = Memory.rooms[this.room.name]
        return (this._planAttempt = roomMemory.BPAs[roomMemory.BPAs.length - 1])
    }

    preTickRun() {
        // Stop if there isn't sufficient CPU

        if (Game.cpu.bucket < CPUMaxPerTick) return RESULT_FAIL

        this.room = this.roomManager.room
        delete this._planAttempt
        if (!this.room.memory.BPAs)
            this.room.memory.BPAs = [
                {
                    score: 0,
                    stampAnchors: {},
                    basePlans: {},
                    rampartPlans: {},
                },
            ]

        this.terrainCoords = internationalManager.getTerrainCoords(this.room.name)

        this.baseCoords = new Uint8Array(this.terrainCoords)
        this.roadCoords = new Uint8Array(2500)
        this.rampartCoords = new Uint8Array(2500)
        this.byExitCoords = new Uint8Array(2500)
        this.exitCoords = new Set()

        let x
        let y = 0
        for (x = 0; x < roomDimensions; x += 1) this.recordExits(x, y)

        // Configure x and loop through left exits

        x = 0
        for (y = 0; y < roomDimensions; y += 1) this.recordExits(x, y)

        // Configure y and loop through bottom exits

        y = roomDimensions - 1
        for (x = 0; x < roomDimensions; x += 1) this.recordExits(x, y)

        // Configure x and loop through right exits

        x = roomDimensions - 1
        for (y = 0; y < roomDimensions; y += 1) this.recordExits(x, y)

        this.fastFiller()
        this.generateGrid()
        this.visualize()

        return RESULT_SUCCESS
    }
    private visualize() {

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.gridCoords[packedCoord] !== 1) continue

                this.room.visual.structure(x, y, STRUCTURE_ROAD)
            }
        }

        for (let key in this.planAttempt.stampAnchors) {
            const stampType = key as StampTypes
            const anchor = this.planAttempt.stampAnchors.fastFiller[0]
            const stamp = stamps[stampType]

            for (key in stamps) {
                const structureType = key as StructureConstant

                if (!stamp.structures[structureType]) continue

                for (const coordOffset of stamp.structures[structureType]) {
                    const coord = {
                        x: coordOffset.x + anchor.x - stamp.offset,
                        y: coordOffset.y + anchor.y - stamp.offset,
                    }

                    this.room.visual.structure(coord.x, coord.y, structureType)
                }
            }
        }

        this.room.visual.connectRoads({
            opacity: 0.7,
        })
    }
    private recordExits(x: number, y: number) {
        const packedCoord = packXYAsNum(x, y)
        if (this.terrainCoords[packedCoord] === 255) return

        this.exitCoords.add(packXYAsCoord(x, y))

        // Loop through adjacent positions

        for (const offset of adjacentOffsets) {
            const adjX = x + offset.x
            const adjY = y + offset.y

            const packedCoord = packXYAsNum(adjX, adjY)
            if (this.terrainCoords[packedCoord] === 255) continue

            this.byExitCoords[packedCoord] = 255
            this.baseCoords[packedCoord] = 255
        }
    }
    private generateGrid() {
        const gridSize = 4
        const anchor = new RoomPosition(
            this.planAttempt.stampAnchors.fastFiller[0].x,
            this.planAttempt.stampAnchors.fastFiller[0].y,
            this.room.name,
        )
        const terrain = this.room.getTerrain()
        const inset = 1

        this.diagonalCoords = new Uint8Array(2500)

        // Checkerboard

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue

                // Calculate the position of the cell relative to the anchor

                const relX = x - anchor.x
                const relY = y - anchor.y

                // Check if the cell is part of a diagonal line
                if (
                    Math.abs(relX - 3 * relY) % (gridSize / 2) !== 0 &&
                    Math.abs(relX + 3 * relY) % (gridSize / 2) !== 0
                )
                    continue

                this.diagonalCoords[packXYAsNum(x, y)] = 4
            }
        }

        this.gridCoords = new Uint8Array(2500)
        const gridCoordsArray: Coord[] = []

        // Grid

        for (let x = inset; x < roomDimensions - inset; x++) {
            for (let y = inset; y < roomDimensions - inset; y++) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue
                if (this.byExitCoords[packXYAsNum(x, y)] > 0) continue

                // Calculate the position of the cell relative to the anchor

                const relX = x - anchor.x
                const relY = y - anchor.y

                // Check if the cell is part of a diagonal line
                if (Math.abs(relX - 3 * relY) % gridSize !== 0 && Math.abs(relX + 3 * relY) % gridSize !== 0) continue

                gridCoordsArray.push({ x, y })
                this.gridCoords[packXYAsNum(x, y)] = 1
            }
        }

        // Group grid coords

        const gridGroups: Coord[][] = []
        let visitedCoords: Set<string> = new Set()
        let groupIndex = 0

        for (const gridCoord of gridCoordsArray) {
            const packedCoord = packCoord(gridCoord)
            if (visitedCoords.has(packedCoord)) continue

            visitedCoords.add(packedCoord)

            gridGroups[groupIndex] = [gridCoord]

            let thisGeneration = [gridCoord]
            let nextGeneration: Coord[] = []
            let groupSize = 0

            while (thisGeneration.length) {
                nextGeneration = []

                for (const coord of thisGeneration) {
                    for (const adjCoord of findAdjacentCoordsToCoord(coord)) {
                        const packedAdjCoord = packCoord(adjCoord)
                        if (visitedCoords.has(packedAdjCoord)) continue

                        visitedCoords.add(packedAdjCoord)

                        if (!this.gridCoords[packAsNum(adjCoord)]) continue

                        // Calculate the position of the cell relative to the anchor

                        const relX = adjCoord.x - anchor.x
                        const relY = adjCoord.y - anchor.y

                        // Check if the cell is part of a diagonal line
                        if (Math.abs(relX - 3 * relY) % gridSize !== 0 && Math.abs(relX + 3 * relY) % gridSize !== 0)
                            continue

                        groupSize += 1
                        gridGroups[groupIndex].push(adjCoord)
                        nextGeneration.push(adjCoord)
                    }
                }

                if (groupSize > 20) break
                thisGeneration = nextGeneration
            }

            groupIndex += 1
        }

        // Get group leaders

        interface SpecialCoord extends Coord {
            index: number
        }

        const groupLeaders: SpecialCoord[] = []

        for (let i = 0; i < gridGroups.length; i++) {
            const coord = gridGroups[i][0] as SpecialCoord

            coord.index = i
            groupLeaders.push(coord)
        }

        // Sort by closer to anchor

        groupLeaders.sort((a, b) => {
            return getRangeOfCoords(a, anchor) - getRangeOfCoords(b, anchor)
        })

        // Paths for grid groups

        for (const leaderCoord of groupLeaders) {
            const path = this.room.advancedFindPath({
                origin: new RoomPosition(leaderCoord.x, leaderCoord.y, this.room.name),
                goals: [{ pos: anchor, range: 3 }],
                weightCoordMaps: [this.diagonalCoords, this.gridCoords, this.baseCoords],
                plainCost: defaultRoadPlanningPlainCost * 4,
            })

            // If the path failed, delete all members of the group

            if (!path.length) {
                for (const coord of gridGroups[leaderCoord.index]) {
                    this.gridCoords[packAsNum(coord)] = 0
                }
                continue
            }

            for (const coord of path) {
                this.gridCoords[packAsNum(coord)] = 1
            }
        }

        // Group exits

        const exitGroups: Coord[][] = []
        visitedCoords = new Set()
        groupIndex = 0

        for (const packedCoord of this.exitCoords) {
            const exitCoord = unpackCoord(packedCoord)
            if (visitedCoords.has(packedCoord)) continue

            visitedCoords.add(packedCoord)

            exitGroups[groupIndex] = [exitCoord]

            let thisGeneration = [exitCoord]
            let nextGeneration: Coord[] = []
            let groupSize = 0

            while (thisGeneration.length) {
                nextGeneration = []

                for (const coord of thisGeneration) {
                    for (const adjCoord of findAdjacentCoordsToCoord(coord)) {
                        if (!isXYExit(adjCoord.x, adjCoord.y)) continue
                        if (terrain.get(adjCoord.x, adjCoord.y) === TERRAIN_MASK_WALL) continue

                        const packedAdjCoord = packCoord(adjCoord)
                        if (visitedCoords.has(packedAdjCoord)) continue

                        visitedCoords.add(packedAdjCoord)

                        groupSize += 1
                        exitGroups[groupIndex].push(adjCoord)
                        nextGeneration.push(adjCoord)
                    }
                }

                if (groupSize > 10) break
                thisGeneration = nextGeneration
            }

            groupIndex += 1
        }

        // Paths for exit groups

        for (const group of exitGroups) {
            const path = this.room.advancedFindPath({
                origin: new RoomPosition(group[0].x, group[0].y, this.room.name),
                goals: [{ pos: anchor, range: 3 }],
                weightCoordMaps: [this.diagonalCoords, this.gridCoords],
                plainCost: defaultRoadPlanningPlainCost * 4,
            })

            for (const coord of path) {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) continue

                this.gridCoords[packedCoord] = 1
            }
        }

        this.pruneGridCoords()
    }
    private pruneGridCoords() {
        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                this.pruneGridXY(x, y)
            }
        }
    }
    private pruneGridXY(x: number, y: number) {
        const packedCoord = packXYAsNum(x, y)
        if (this.gridCoords[packedCoord] !== 1) return

        let adjNonGridCoords: Coord[] = []
        let adjGridCoords = 0

        for (const adjCoord of findAdjacentCoordsToXY(x, y)) {
            const packedAdjCoord = packAsNum(adjCoord)

            if (this.gridCoords[packedAdjCoord] === 1) {
                adjGridCoords += 1
                continue
            }

            if (this.terrainCoords[packedAdjCoord] === 255) continue

            adjNonGridCoords.push(adjCoord)
        }

        if (adjGridCoords > 1) return

        // No reason to keep a coord that does nothing

        if (adjNonGridCoords.length <= 1) {
            this.gridCoords[packedCoord] = 0
            return
        }

        let noAltNonGridCoord: boolean

        for (const adjNonGridCoord of adjNonGridCoords) {
            adjGridCoords = 0

            for (const adjCoord of findAdjacentCoordsToCoord(adjNonGridCoord)) {
                if (this.gridCoords[packAsNum(adjCoord)] !== 1) continue

                adjGridCoords += 1
            }

            if (adjGridCoords > 1) continue
            if (noAltNonGridCoord) return

            noAltNonGridCoord = true
        }

        this.gridCoords[packedCoord] = 0
    }
    private flipStampVertical() {}
    private flipStampHorizontal() {}
    private planStamps(args: PlanStampsArgs) {
        if (!args.coordMap) args.coordMap = this.baseCoords

        const stamp = stamps[args.stampType]
        const stampAnchors: Coord[] = []

        if (this.planAttempt.stampAnchors[args.stampType])
            args.count -= this.planAttempt.stampAnchors[args.stampType].length
        else this.planAttempt.stampAnchors[args.stampType] = stampAnchors

        for (; args.count > 0; args.count -= 1) {
            let stampAnchor: Coord | false

            if (args.dynamic) {
                stampAnchor = this.findDynamicStampAnchor({
                    stamp,
                    startCoords: args.startCoords,
                    coordMap: args.coordMap,
                })
                if (!stampAnchor) continue

                stampAnchors.push(stampAnchor)
                continue
            }

            // Not dynamic

            // Run distance transform with the baseCM

            const distanceCoords = args.diagonalDT
                ? this.room.diagonalDistanceTransform(args.coordMap, false, args.minAvoid)
                : this.room.distanceTransform(args.coordMap, false, args.minAvoid)

            stampAnchor = this.findStampAnchor({
                stamp,
                startCoords: args.startCoords,
                coordMap: distanceCoords,
            })
            if (!stampAnchor) continue

            stampAnchors.push(stampAnchor)
        }

        return stampAnchors
    }
    private findStampAnchor(args: FindStampAnchorArgs) {
        let visitedCoords = new Uint8Array(2500)
        for (const coord of args.startCoords) visitedCoords[packAsNum(coord)] = 1

        let thisGeneration = args.startCoords
        let nextGeneration: Coord[] = []

        while (thisGeneration.length) {
            nextGeneration = []

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood cardinal directions, excluding impassibles

            if (args.cardinalFlood) {
                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of cardinalOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (args.coordMap[packAsNum(coord2)] === 0) continue

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions excluding diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (args.coordMap[packAsNum(coord2)] === 0) continue

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions, including diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Set this gen to next gen

            visitedCoords = new Uint8Array(localVisitedCoords)
            thisGeneration = nextGeneration
        }

        // No stampAnchor was found

        return false
    }
    private isViableStampAnchor(args: FindStampAnchorArgs, coord1: Coord) {
        // Get the value of the pos

        const posValue = args.coordMap[packAsNum(coord1)]
        if (posValue === 255) return false
        if (posValue === 0) return false
        if (posValue < args.stamp.size) return false

        // Ensure we aren't too close to an exit

        const rectCoords = findCoordsInsideRect(
            coord1.x - args.stamp.protectionOffset,
            coord1.y - args.stamp.protectionOffset,
            coord1.x + args.stamp.protectionOffset,
            coord1.y + args.stamp.protectionOffset,
        )

        for (const coord2 of rectCoords) {
            if (!isXYInRoom(coord2.x, coord2.y)) continue
            if (this.exitCoords.has(packCoord(coord1))) return false
        }

        return true
    }
    private findDynamicStampAnchor(args: FindDynamicStampAnchorArgs) {
        let visitedCoords = new Uint8Array(2500)
        for (const coord of args.startCoords) visitedCoords[packAsNum(coord)] = 1

        let thisGeneration = args.startCoords
        let nextGeneration: Coord[] = []

        while (thisGeneration.length) {
            nextGeneration = []

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood cardinal directions, excluding impassibles

            if (args.cardinalFlood) {
                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableDynamicStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of cardinalOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (args.coordMap[packAsNum(coord2)] === 0) continue

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions excluding diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableDynamicStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        if (args.coordMap[packAsNum(coord2)] === 0) continue

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions, including diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    if (this.isViableDynamicStampAnchor(args, coord1)) return coord1

                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const coord2 = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }

                        if (!isXYInRoom(coord2.x, coord2.y)) continue

                        if (localVisitedCoords[packAsNum(coord2)] === 1) continue
                        localVisitedCoords[packAsNum(coord2)] = 1

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Set this gen to next gen

            visitedCoords = new Uint8Array(localVisitedCoords)
            thisGeneration = nextGeneration
        }

        // No stampAnchor was found

        return false
    }
    private isViableDynamicStampAnchor(args: FindDynamicStampAnchorArgs, coord1: Coord) {
        // Get the value of the pos

        const posValue = args.coordMap[packAsNum(coord1)]
        if (posValue === 255) return false
        /* if (posValue === 0) return false */

        if (!args.conditions(coord1)) return false

        // Ensure we aren't too close to an exit

        const rectCoords = findCoordsInsideRect(
            coord1.x - args.stamp.protectionOffset,
            coord1.y - args.stamp.protectionOffset,
            coord1.x + args.stamp.protectionOffset,
            coord1.y + args.stamp.protectionOffset,
        )

        for (const coord2 of rectCoords) {
            if (!isXYInRoom(coord2.x, coord2.y)) continue
            if (this.exitCoords.has(packCoord(coord1))) return false
        }

        return true
    }
    private fastFiller() {
        const stampAnchors = this.planStamps({
            stampType: 'fastFiller',
            count: 1,
            startCoords: [this.room.controller.pos],
            cardinalFlood: true,
        })

        /* this.room.errorVisual(stampAnchors[0], true) */
    }
    private hub() {
        this.planStamps({
            stampType: 'hub',
            count: 1,
            startCoords: [this.planAttempt.stampAnchors.fastFiller[0]],
            dynamic: true,
            /**
             * Don't place on a gridCoord and ensure cardinal directions aren't gridCoords
             */
            conditions: coord => {
                if (this.gridCoords[packAsNum(coord)] === 1) return false

                for (const offsets of cardinalOffsets) {
                    const x = coord.x + offsets.x
                    const y = coord.y + offsets.y

                    if (this.gridCoords[packXYAsNum(x, y)] === 1) return false
                }

                return true
            },
        })
    }
    private labs() {}
    private gridExtensions() {
        this.planStamps({
            stampType: /* 'gridExtension' */ 'extension',
            count: 40,
            startCoords: [this.planAttempt.stampAnchors.fastFiller[0]],
            dynamic: true,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                if (this.gridCoords[packAsNum(coord)] === 1) return false

                for (const offsets of adjacentOffsets) {
                    const x = coord.x + offsets.x
                    const y = coord.y + offsets.y

                    if (this.gridCoords[packXYAsNum(x, y)] === 1) return true
                }

                return false
            },
        })
    }
    private towers() {}
    private planSourceStructures() {}
    private observer() {}
    private nuker() {}
    private powerSpawn() {}
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

    let origin: RoomPosition
    if (getRangeOfCoords(room.anchor, centerUpgadePos) >= 10) {
        origin = centerUpgadePos
    } else {
        if (getRangeOfCoords(room.anchor, avgControllerSourcePos) <= 3) {
            origin = closestSourceToController.pos
        } else {
            origin = avgControllerSourcePos
        }
    }

    // Try to plan the stamp

    path = room.advancedFindPath({
        origin,
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
