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
    RESULT_NO_ACTION,
    RESULT_ACTION,
} from 'international/constants'
import {
    areCoordsEqual,
    createPosMap,
    customLog,
    findAdjacentCoordsToCoord,
    findAdjacentCoordsToXY,
    findAvgBetweenCoords,
    findClosestCoord,
    findClosestPos,
    findCoordsInRange,
    findCoordsInRangeXY,
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
import { off, openStdin } from 'process'
import { BasePlans } from './construction/basePlans'
import { RampartPlans } from './construction/rampartPlans'
import { length } from 'node-persist'

interface PlanStampsArgs {
    stampType: StampTypes
    count: number
    startCoords: Coord[]
    dynamic?: boolean
    weighted?: boolean
    diagonalDT?: boolean
    coordMap?: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
    /**
     * How to consider potential stampAnchors
     */
    conditions?(coord: Coord): boolean
    /**
     * What to do with the stampAnchor resulting from a successful individual plan
     * @param coord the stampAnchor
     */
    consequence(coord: Coord): void
}

interface FindDynamicStampAnchorArgs {
    stamp: Stamp
    startCoords: Coord[]
    minAvoid?: number
    conditions?(coord: Coord): boolean
}

interface FindDynamicStampAnchorWeightedArgs extends FindDynamicStampAnchorArgs {
    coordMap: CoordMap
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

    centerUpgradePos: RoomPosition
    input2Coord: Coord
    outputCoords: Coord[]
    sourceHarvestPositions: RoomPosition[][]
    sourcePaths: RoomPosition[][]

    terrainCoords: CoordMap
    packedExitCoords: Set<string>
    exitCoords: Coord[]
    /**
     * Coords adjacent to exits, including exit coords
     */
    byExitCoords: Uint8Array
    baseCoords: Uint8Array
    roadCoords: Uint8Array
    rampartCoords: Uint8Array
    diagonalCoords: Uint8Array
    gridCoords: Uint8Array
    /**
     * Coords adjacent to planned roads
     */
    byPlannedRoad: Uint8Array
    finishedGrid: boolean
    finishedFastFillerRoadPrune: boolean
    /**
     * Coords we should be protecting using ramparts
     */
    protectCoords: Set<string>
    /**
     * Coords protected by ramparts
     */
    protectedCoords: Uint8Array
    basePlans: BasePlans
    rampartPlans: RampartPlans
    stampAnchors: Partial<{ [key in StampTypes]: Coord[] }>
    score: number

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    _reverseExitFlood: Uint8Array
    get reverseExitFlood() {
        if (this._reverseExitFlood) return this._reverseExitFlood

        this._reverseExitFlood = new Uint8Array(2500)

        let visitedCoords = new Uint8Array(2500)
        for (const coord of this.exitCoords) visitedCoords[packAsNum(coord)] = 1

        let depth = 2
        let thisGeneration = this.exitCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []

            // Iterate through positions of this gen

            for (const coord1 of thisGeneration) {
                this._reverseExitFlood[packAsNum(coord1)] = 255 - Math.round(depth)

                // Add viable adjacent coords to the next generation

                for (const offset of adjacentOffsets) {
                    const coord2 = {
                        x: coord1.x + offset.x,
                        y: coord1.y + offset.y,
                    }

                    if (!isXYInRoom(coord2.x, coord2.y)) continue

                    if (visitedCoords[packAsNum(coord2)] === 1) continue
                    visitedCoords[packAsNum(coord2)] = 1

                    if (this.terrainCoords[packAsNum(coord2)] === 255) continue

                    nextGeneration.push(coord2)
                }
            }

            // Set up for next generation

            depth = Math.min(depth * 1.3, 255)
            thisGeneration = nextGeneration
        }

        return this._reverseExitFlood
    }

    preTickRun() {
        // Stop if there isn't sufficient CPU

        if (Game.cpu.bucket < CPUMaxPerTick) return RESULT_FAIL

        this.room = this.roomManager.room

        if (!this.terrainCoords) {
            this.terrainCoords = internationalManager.getTerrainCoords(this.room.name)

            this.baseCoords = new Uint8Array(this.terrainCoords)
            this.roadCoords = new Uint8Array(this.terrainCoords)
            this.rampartCoords = new Uint8Array(2500)
            this.byExitCoords = new Uint8Array(2500)
            this.packedExitCoords = new Set()
            this.exitCoords = []
            this.byPlannedRoad = new Uint8Array(2500)
            this.basePlans = new BasePlans()
            this.rampartPlans = new RampartPlans()
            this.stampAnchors = {}
            for (const stampType in stamps) this.stampAnchors[stampType as StampTypes] = []

            this.score = 0
            this.recordExits()
        }

        this.avoidSources()

        for (const coord of findCoordsInRange(this.room.controller.pos, 2)) {
            this.baseCoords[packAsNum(coord)] = 255
        }
        this.fastFiller()
        for (const coord of findCoordsInRange(this.room.controller.pos, 2)) {
            this.baseCoords[packAsNum(coord)] = 0
        }
        this.preGridSources()
        this.generateGrid()
        this.pruneFastFillerRoads()
        this.findCenterUpgradePos()
        this.preHubSources()
        this.hub()
        this.preLabSources()
        this.labs()
        this.gridExtensions()
        this.nuker()
        this.powerSpawn()
        this.observer()
        this.planGridCoords()
        this.planSourceStructures()
        this.visualize()

        return RESULT_SUCCESS
    }
    private visualizeGrid() {
        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.baseCoords[packedCoord] === 255) continue
                if (this.gridCoords[packedCoord] !== 1) continue

                this.room.visual.structure(x, y, STRUCTURE_ROAD)
            }
        }
    }
    private visualize() {
        for (const packedCoord in this.basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const basePlansCoord = this.basePlans.map[packedCoord]

            this.room.visual.structure(coord.x, coord.y, basePlansCoord.structureType)
        }

        /* this.room.visualizeCoordMap(this.reverseExitFlood) */
        /* this.room.visualizeCoordMap(this.byPlannedRoad, true, 100) */

        this.room.visual.connectRoads({
            opacity: 0.7,
        })

        this.room.visual.circle(this.stampAnchors.labs[0].x, this.stampAnchors.labs[0].y, { fill: customColors.red })
        this.room.visual.circle(this.input2Coord.x, this.input2Coord.y, { fill: customColors.red })
    }
    private recordExits() {
        let x
        let y = 0
        for (x = 0; x < roomDimensions; x += 1) this.recordExit(x, y)

        // Configure x and loop through left exits

        x = 0
        for (y = 0; y < roomDimensions; y += 1) this.recordExit(x, y)

        // Configure y and loop through bottom exits

        y = roomDimensions - 1
        for (x = 0; x < roomDimensions; x += 1) this.recordExit(x, y)

        // Configure x and loop through right exits

        x = roomDimensions - 1
        for (y = 0; y < roomDimensions; y += 1) this.recordExit(x, y)
    }
    private recordExit(x: number, y: number) {
        const packedCoord = packXYAsNum(x, y)
        if (this.terrainCoords[packedCoord] === 255) return

        this.packedExitCoords.add(packXYAsCoord(x, y))
        this.exitCoords.push({ x, y })

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
        if (this.finishedGrid) return

        delete this.gridCoords
        delete this.diagonalCoords

        const gridSize = 4
        const anchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y - 1,
            this.room.name,
        )

        const inset = 1

        this.diagonalCoords = new Uint8Array(2500)

        // Checkerboard

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                if (this.terrainCoords[packXYAsNum(x, y)] === 255) continue

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
                const packedCoord = packXYAsNum(x, y)
                if (this.baseCoords[packedCoord] === 255) continue
                /* if (this.terrainCoords[packedCoord] === 255) continue */
                if (this.byExitCoords[packedCoord] > 0) continue

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
            let nextGeneration: Coord[]
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

        for (const packedCoord of this.packedExitCoords) {
            const exitCoord = unpackCoord(packedCoord)
            if (visitedCoords.has(packedCoord)) continue

            visitedCoords.add(packedCoord)

            exitGroups[groupIndex] = [exitCoord]

            let thisGeneration = [exitCoord]
            let nextGeneration: Coord[]
            let groupSize = 0

            while (thisGeneration.length) {
                nextGeneration = []

                for (const coord of thisGeneration) {
                    for (const adjCoord of findAdjacentCoordsToCoord(coord)) {
                        if (!isXYExit(adjCoord.x, adjCoord.y)) continue
                        if (this.terrainCoords[packAsNum(adjCoord)] === 255) continue

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

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.gridCoords[packedCoord] !== 1) continue

                for (const adjCoord of findAdjacentCoordsToXY(x, y)) {
                    const packedAdjCoord = packAsNum(adjCoord)

                    if (this.gridCoords[packedAdjCoord] === 1) continue
                    if (this.terrainCoords[packedAdjCoord] === 255) continue

                    this.byPlannedRoad[packedAdjCoord] = 1
                }
            }
        }

        this.finishedGrid = true
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
    private pruneFastFillerRoads() {
        if (this.finishedFastFillerRoadPrune) return

        const anchor = this.stampAnchors.fastFiller[0]

        const rectCoords = findCoordsInsideRect(
            anchor.x - stamps.fastFiller.offset,
            anchor.y - stamps.fastFiller.offset,
            anchor.x + stamps.fastFiller.offset,
            anchor.y + stamps.fastFiller.offset,
        )

        for (const coord of rectCoords) {
            const packedCoordNum = packAsNum(coord)
            if (this.roadCoords[packedCoordNum] !== 1) continue

            if (this.fastFillerPruneRoadCoord(coord) === RESULT_ACTION) {
                this.roadCoords[packedCoordNum] = 0
                continue
            }

            this.basePlans.set(packCoord(coord), STRUCTURE_ROAD, 3)
            this.roadCoords[packedCoordNum] = 1
            this.byPlannedRoad[packedCoordNum] = 0
        }

        this.finishedFastFillerRoadPrune = true
    }
    private avoidSources() {
        if (this.sourceHarvestPositions) return

        const sourceHarvestPositions: RoomPosition[][] = []

        let i = -1
        for (const source of this.room.sources) {
            i += 1
            sourceHarvestPositions.push([])

            for (const offset of adjacentOffsets) {
                const adjPos = new RoomPosition(offset.x + source.pos.x, offset.y + source.pos.y, this.room.name)

                const packedCoord = packAsNum(adjPos)
                if (this.terrainCoords[packedCoord] === 255) continue

                this.baseCoords[packedCoord] = 255
                sourceHarvestPositions[i].push(adjPos)
            }
        }

        this.sourceHarvestPositions = sourceHarvestPositions
    }
    private preGridSources() {
        for (let i = 0; i < this.sourceHarvestPositions.length; i++) {
            for (const pos of this.sourceHarvestPositions[i]) {
                this.baseCoords[packAsNum(pos)] = 0
            }
        }
    }
    private preHubSources() {
        if (this.sourcePaths) return

        const fastFillerAnchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )
        const sourcePaths: RoomPosition[][] = []

        for (let i = 0; i < this.sourceHarvestPositions.length; i++) {
            // Remove source harvest positions overlapping with upgrade positions or other source harvest positions
            // Loop through each pos index

            for (let j = this.sourceHarvestPositions.length - 1; j >= 0; j -= 1) {
                if (this.baseCoords[packAsNum(this.sourceHarvestPositions[i][j])] !== 255) continue

                this.sourceHarvestPositions.splice(j, 1)
            }

            this.sourceHarvestPositions[i].sort((a, b) => {
                return (
                    this.room.advancedFindPath({
                        origin: a,
                        goals: [
                            {
                                pos: fastFillerAnchor,
                                range: 3,
                            },
                        ],
                        weightCoordMaps: [this.gridCoords, this.roadCoords],
                        plainCost: defaultRoadPlanningPlainCost,
                    }).length -
                    this.room.advancedFindPath({
                        origin: b,
                        goals: [
                            {
                                pos: fastFillerAnchor,
                                range: 3,
                            },
                        ],
                        weightCoordMaps: [this.gridCoords, this.roadCoords],
                        plainCost: defaultRoadPlanningPlainCost,
                    }).length
                )
            })

            const closestHarvestPos = this.sourceHarvestPositions[i][0]

            this.basePlans.set(packCoord(closestHarvestPos), STRUCTURE_CONTAINER, 3)
            const packedCoord = packAsNum(closestHarvestPos)
            this.baseCoords[packedCoord] = 255
            this.gridCoords[packedCoord] = 0

            const path = this.room.advancedFindPath({
                origin: closestHarvestPos,
                goals: [
                    {
                        pos: fastFillerAnchor,
                        range: 3,
                    },
                ],
                weightCoordMaps: [this.gridCoords, this.roadCoords],
                plainCost: defaultRoadPlanningPlainCost,
            })
            sourcePaths.push(path)

            for (const pos of path) {
                this.basePlans.set(packCoord(pos), STRUCTURE_ROAD, 3)
                this.roadCoords[packAsNum(pos)] = 1
            }
        }

        this.sourcePaths = sourcePaths
    }
    private preLabSources() {
        if (this.stampAnchors.sourceLink.length) return

        const hubAnchor = this.stampAnchors.hub[0]
        const sourceLinkCoords: Coord[] = []
        const sourceExtensionCoords: Coord[] = []

        for (let i = 0; i < this.sourceHarvestPositions.length; i++) {
            const closestHarvestPos = this.sourceHarvestPositions[i][0]
            const packedAdjCoords: Set<string> = new Set([])
            let closestAdjCoord: Coord
            let closestRange = Infinity

            for (const offset of adjacentOffsets) {
                const adjCoord = {
                    x: closestHarvestPos.x + offset.x,
                    y: closestHarvestPos.y + offset.y,
                }

                const packedCoord = packAsNum(adjCoord)
                if (this.baseCoords[packedCoord] === 255) continue
                if (this.gridCoords[packedCoord] === 1) continue

                packedAdjCoords.add(packCoord(adjCoord))

                const range = getRangeOfCoords(hubAnchor, adjCoord)
                if (range >= closestRange) continue

                closestAdjCoord = adjCoord
                closestRange = range
            }

            const packedClosestAdjCoord = packCoord(closestAdjCoord)
            packedAdjCoords.delete(packedClosestAdjCoord)

            sourceLinkCoords.push(closestAdjCoord)
            this.baseCoords[packAsNum(closestAdjCoord)] = 255

            for (const packedAdjCoord of packedAdjCoords) {
                const coord = unpackCoord(packedAdjCoord)

                sourceExtensionCoords.push(unpackCoord(packedAdjCoord))
                this.baseCoords[packAsNum(coord)] = 255
            }
        }

        this.stampAnchors.sourceLink = sourceLinkCoords
        this.stampAnchors.sourceExtension = sourceExtensionCoords
    }
    private planSourceStructures() {
        if (this.basePlans.getXY(this.stampAnchors.sourceLink[0].x, this.stampAnchors.sourceLink[0].y)) return

        for (const coord of this.stampAnchors.sourceLink) {
            this.basePlans.set(packCoord(coord), STRUCTURE_LINK, 6)
        }

        for (const coord of this.stampAnchors.sourceExtension) {
            this.basePlans.set(packCoord(coord), STRUCTURE_EXTENSION, 7)
        }
    }
    private findCenterUpgradePos() {
        if (this.centerUpgradePos) return false
        const controllerPos = this.room.controller.pos

        // Get the open areas in a range of 3 to the controller

        const distanceCoords = this.room.distanceTransform(
            this.roadCoords,
            false,
            1,
            controllerPos.x - 2,
            controllerPos.y - 2,
            controllerPos.x + 2,
            controllerPos.y + 2,
        )

        // Find the closest value greater than two to the centerUpgradePos and inform it

        const pos = this.room.findClosestPosOfValue({
            coordMap: distanceCoords,
            startCoords: [this.stampAnchors.fastFiller[0]],
            requiredValue: 2,
            reduceIterations: 1,
            visuals: false,
            cardinalFlood: true,
        })
        if (!pos) return false

        const packedCoord = packAsNum(pos)
        this.baseCoords[packedCoord] = 255
        this.gridCoords[packedCoord] = 0
        this.basePlans.set(packCoord(pos), STRUCTURE_CONTAINER, 2)
        this.basePlans.set(packCoord(pos), STRUCTURE_LINK, 5)

        for (const offset of adjacentOffsets) {
            const adjCoord = {
                x: offset.x + pos.x,
                y: offset.y + pos.y,
            }

            const packedAdjCoord = packAsNum(adjCoord)
            this.baseCoords[packedAdjCoord] = 255
            this.gridCoords[packedAdjCoord] = 0
        }

        const path = this.room.advancedFindPath({
            origin: pos,
            goals: [
                {
                    pos: new RoomPosition(
                        this.stampAnchors.fastFiller[0].x,
                        this.stampAnchors.fastFiller[0].y,
                        this.room.name,
                    ),
                    range: 3,
                },
            ],
            weightCoordMaps: [this.gridCoords, this.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        for (const pos of path) {
            const packedPathCoord = packAsNum(pos)
            this.roadCoords[packedPathCoord] = 1
            this.basePlans.set(packCoord(pos), STRUCTURE_ROAD, 3)
        }

        return (this.centerUpgradePos = pos)
    }
    /**
     *
     * @param coord
     * @returns RESULT_ACTION if the road should be removed
     */
    private fastFillerPruneRoadCoord(coord: Coord) {
        let adjSpawn: boolean

        for (const offset of adjacentOffsets) {
            const adjCoord = {
                x: offset.x + coord.x,
                y: offset.y + coord.y,
            }

            const packedAdjCoord = packAsNum(adjCoord)
            if (this.terrainCoords[packedAdjCoord] === 255) continue
            if (this.roadCoords[packedAdjCoord] !== 1 && this.gridCoords[packedAdjCoord] !== 1)
                this.byPlannedRoad[packedAdjCoord] = 1

            if (this.basePlans.get(packCoord(adjCoord))?.structureType === STRUCTURE_SPAWN) adjSpawn = true
        }

        if (adjSpawn) return RESULT_NO_ACTION

        let cardinalRoads = 0

        for (const offset of cardinalOffsets) {
            const adjCoord = {
                x: offset.x + coord.x,
                y: offset.y + coord.y,
            }

            const packedAdjCoord = packAsNum(adjCoord)
            if (this.roadCoords[packedAdjCoord] !== 1 && this.gridCoords[packedAdjCoord] !== 1) continue

            cardinalRoads += 1
        }

        if (cardinalRoads >= 3) return RESULT_ACTION
        return RESULT_NO_ACTION
    }
    private planGridCoords() {
        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.gridCoords[packedCoord] !== 1) continue
                if (this.roadCoords[packedCoord] === 1) continue

                let hasNeed

                for (const offset of adjacentOffsets) {
                    const adjCoord = {
                        x: offset.x + x,
                        y: offset.y + y,
                    }

                    const plan = this.basePlans.get(packCoord(adjCoord))
                    if (!plan) continue
                    if (plan.structureType === STRUCTURE_ROAD) continue

                    hasNeed = true
                    break
                }

                if (!hasNeed) continue

                this.basePlans.setXY(x, y, STRUCTURE_ROAD, 3)
                this.roadCoords[packedCoord] = 1
            }
        }
    }
    private flipStructuresVertical(stamp: Stamp) {
        const flippedStructures: Partial<{ [key in StructureConstant]: Coord[] }> = {}

        for (const structureType in stamp.structures) {
            const coords = stamp.structures[structureType]
            flippedStructures[structureType as StructureConstant] = coords.map(coord => ({
                x: coord.x,
                y: stamp.size + stamp.offset - coord.y - 1,
            }))
        }

        return flippedStructures
    }

    private flipStructuresHorizontal(stamp: Stamp) {
        const flippedStructures: Partial<{ [key in StructureConstant]: Coord[] }> = {}

        for (const structureType in stamp.structures) {
            const coords = stamp.structures[structureType]
            flippedStructures[structureType as StructureConstant] = coords.map(coord => ({
                x: stamp.size + stamp.offset - coord.x - 1,
                y: coord.y,
            }))
        }

        return flippedStructures
    }
    private planStamps(args: PlanStampsArgs) {
        if (!args.coordMap) args.coordMap = this.baseCoords

        const stamp = stamps[args.stampType]

        args.count -= this.stampAnchors[args.stampType].length

        for (; args.count > 0; args.count -= 1) {
            let stampAnchor: Coord | false

            if (args.dynamic) {
                if (args.weighted) {
                    stampAnchor = this.findDynamicStampAnchorWeighted({
                        stamp,
                        startCoords: args.startCoords,
                        conditions: args.conditions,
                        coordMap: args.coordMap,
                    })
                    if (!stampAnchor) continue

                    args.consequence(stampAnchor)
                    this.stampAnchors[args.stampType].push(stampAnchor)

                    continue
                }
                stampAnchor = this.findDynamicStampAnchor({
                    stamp,
                    startCoords: args.startCoords,
                    conditions: args.conditions,
                })
                if (!stampAnchor) continue

                args.consequence(stampAnchor)
                this.stampAnchors[args.stampType].push(stampAnchor)

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
                cardinalFlood: args.cardinalFlood,
                coordMap: distanceCoords,
            })
            if (!stampAnchor) continue

            args.consequence(stampAnchor)
            this.stampAnchors[args.stampType].push(stampAnchor)
        }
    }
    private recordStamp(stampType: StampTypes, stampAnchor: Coord) {
        const stamp = stamps[stampType]

        for (const key in stamp.structures) {
            const structureType = key as StructureConstant
            if (!stamp.structures[structureType]) continue

            for (const coordOffset of stamp.structures[structureType]) {
                const coord = {
                    x: coordOffset.x + stampAnchor.x - stamp.offset,
                    y: coordOffset.y + stampAnchor.y - stamp.offset,
                }

                this.basePlans.set(packCoord(coord), structureType, 8)

                const packedCoord = packAsNum(coord)

                if (structureType === STRUCTURE_ROAD) {
                    this.roadCoords[packedCoord] = 1
                    continue
                }

                this.baseCoords[packedCoord] = 255
                this.roadCoords[packedCoord] = 255
            }
        }
    }
    private findStampAnchor(args: FindStampAnchorArgs) {
        let visitedCoords = new Uint8Array(2500)
        for (const coord of args.startCoords) visitedCoords[packAsNum(coord)] = 1

        let thisGeneration = args.startCoords
        let nextGeneration: Coord[]

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

            // Flood all adjacent positions

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
        if (this.isCloseToExit(coord1, args.stamp.protectionOffset)) return false
        return true
    }
    private findDynamicStampAnchor(args: FindDynamicStampAnchorArgs) {
        let visitedCoords = new Uint8Array(2500)
        for (const coord of args.startCoords) visitedCoords[packAsNum(coord)] = 1

        let thisGeneration = args.startCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood all adjacent positions

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

                        if (this.baseCoords[packAsNum(coord2)] === 255) continue

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
    private findDynamicStampAnchorWeighted(args: FindDynamicStampAnchorWeightedArgs) {
        let visitedCoords = new Uint8Array(2500)
        for (const coord of args.startCoords) visitedCoords[packAsNum(coord)] = 1

        let thisGeneration = args.startCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood all adjacent positions

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    const coord1Weight = args.coordMap[packAsNum(coord1)]
                    if (coord1Weight > 0) {
                        if (coord1Weight === 255) continue

                        args.coordMap[packAsNum(coord1)] -= 1
                        nextGeneration.push(coord1)
                        continue
                    }

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

                        if (this.baseCoords[packAsNum(coord2)] === 255) continue

                        nextGeneration.push(coord2)
                    }
                }
            }

            // Flood all adjacent positions, including diagonals

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    const coord1Weight = args.coordMap[packAsNum(coord1)]
                    if (coord1Weight > 0 && coord1Weight !== 255) {
                        args.coordMap[packAsNum(coord1)] -= 1
                        nextGeneration.push(coord1)
                    }

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
        /* this.room.visual.rect(coord1.x - 0.5, coord1.y - 0.5, 1, 1, { fill: customColors.red }) */
        if (this.baseCoords[packAsNum(coord1)] === 255) return false
        if (this.roadCoords[packAsNum(coord1)] === 1) return false
        if (this.isCloseToExit(coord1, args.stamp.protectionOffset + 2)) return false
        if (!args.conditions(coord1)) return false

        return true
    }
    /**
     * Finds wether the coord is in a specified range to an exit, flooding while avoiding walls
     * @param startCoord The string coordinate
     * @param range The max number of generations to do
     */
    private isCloseToExit(startCoord: Coord, range: number) {
        let visitedCoords = new Uint8Array(2500)
        visitedCoords[packAsNum(startCoord)] = 1

        let generations = 0
        let thisGeneration = [startCoord]
        let nextGeneration: Coord[]

        while (thisGeneration.length && generations < range) {
            nextGeneration = []

            // Iterate through positions of this gen

            for (const coord1 of thisGeneration) {
                // Add viable adjacent coords to the next generation

                for (const offset of adjacentOffsets) {
                    const coord2 = {
                        x: coord1.x + offset.x,
                        y: coord1.y + offset.y,
                    }

                    if (visitedCoords[packAsNum(coord2)] === 1) continue
                    visitedCoords[packAsNum(coord2)] = 1

                    if (this.packedExitCoords.has(packCoord(coord2))) return true

                    if (this.terrainCoords[packAsNum(coord2)] === 255) continue

                    nextGeneration.push(coord2)
                }
            }

            // Set up for next generation

            generations += 1
            thisGeneration = nextGeneration
        }

        return false
    }
    private fastFiller() {
        this.planStamps({
            stampType: 'fastFiller',
            count: 1,
            startCoords: [this.room.controller.pos],
            cardinalFlood: true,
            consequence: stampAnchor => {
                this.recordStamp('fastFiller', stampAnchor)

                const stamp = stamps.fastFiller
                const structures = stamps.fastFiller.structures

                for (const key in structures) {
                    const structureType = key as StructureConstant
                    if (!structures[structureType]) continue

                    for (const offset of structures[structureType]) {
                        const coord = {
                            x: offset.x + stampAnchor.x - stamp.offset,
                            y: offset.y + stampAnchor.y - stamp.offset,
                        }

                        this.basePlans.set(packCoord(coord), structureType, 8)

                        const packedCoord = packAsNum(coord)

                        if (structureType === STRUCTURE_ROAD) {
                            this.roadCoords[packedCoord] = 1
                            continue
                        }

                        this.baseCoords[packedCoord] = 255
                        this.roadCoords[packedCoord] = 255
                    }
                }
            },
        })
    }
    private hub() {
        const fastFillerPos = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )

        let closestSource: Source
        let closestSourceDistance = Infinity

        for (const source of this.room.sources) {
            const range = this.room.advancedFindPath({
                origin: source.pos,
                goals: [
                    {
                        pos: fastFillerPos,
                        range: 3,
                    },
                ],
                plainCost: defaultRoadPlanningPlainCost,
            }).length
            if (range > closestSourceDistance) continue

            closestSourceDistance = range
            closestSource = source
        }

        let origin: RoomPosition
        if (getRangeOfCoords(fastFillerPos, this.centerUpgradePos) >= 10) {
            origin = this.centerUpgradePos
        } else {
            origin = closestSource.pos
        }

        const path = this.room.advancedFindPath({
            origin,
            goals: [{ pos: fastFillerPos, range: 3 }],
            weightCoordMaps: [this.room.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })

        this.planStamps({
            stampType: 'hub',
            count: 1,
            startCoords: [path[path.length - 1]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure cardinal directions aren't gridCoords but are each adjacent to one
             */
            conditions: coord => {
                if (this.gridCoords[packAsNum(coord)] === 1) return false

                for (const offsets of cardinalOffsets) {
                    const packedCoord = packXYAsNum(coord.x + offsets.x, coord.y + offsets.y)
                    if (this.byPlannedRoad[packedCoord] !== 1) return false
                }

                return true
            },
            consequence: stampAnchor => {
                this.room.errorVisual(stampAnchor)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 20

                const structureCoords: Coord[] = []

                for (const offset of cardinalOffsets) {
                    structureCoords.push({
                        x: stampAnchor.x + offset.x,
                        y: stampAnchor.y + offset.y,
                    })
                }

                let [coord, i] = findClosestCoord(fastFillerPos, structureCoords)
                structureCoords.splice(i, 1)
                this.basePlans.set(packCoord(coord), STRUCTURE_STORAGE, 4)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                if (stampAnchor.y === coord.y)
                    coord = {
                        x: stampAnchor.x - coord.x + stampAnchor.x,
                        y: coord.y,
                    }
                else
                    coord = {
                        x: coord.x,
                        y: stampAnchor.y - coord.y + stampAnchor.y,
                    }

                for (i = 0; i, structureCoords.length; i++) {
                    if (areCoordsEqual(coord, structureCoords[i])) break
                }

                structureCoords.splice(i, 1)
                this.basePlans.set(packCoord(coord), STRUCTURE_TERMINAL, 6)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                //
                ;[coord, i] = findClosestCoord(this.room.controller.pos, structureCoords)
                structureCoords.splice(i, 1)
                this.basePlans.set(packCoord(coord), STRUCTURE_LINK, 5)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                coord = structureCoords[0]
                this.basePlans.set(packCoord(coord), STRUCTURE_FACTORY, 7)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255
            },
        })
    }
    private labs() {
        this.planStamps({
            stampType: 'labs',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Ensure we can place all 10 labs where they are in range 2 of the 2 inputs, so can all be utilized for reactions
             */
            conditions: coord1 => {
                if (this.byPlannedRoad[packAsNum(coord1)] !== 1) return false

                let outputCoords: Coord[]

                // Record

                const packedAdjCoords1: Set<string> = new Set()
                const range = 2
                for (let x = coord1.x - range; x <= coord1.x + range; x += 1) {
                    for (let y = coord1.y - range; y <= coord1.y + range; y += 1) {
                        const packedCoordNum = packXYAsNum(x, y)
                        if (this.byPlannedRoad[packedCoordNum] !== 1) continue
                        if (this.baseCoords[packedCoordNum] === 255) continue

                        packedAdjCoords1.add(packXYAsCoord(x, y))
                    }
                }

                const packedCoord1 = packCoord(coord1)

                for (const coord2 of findCoordsInRangeXY(coord1.x, coord1.y, range)) {
                    const packedCoord2Num = packAsNum(coord2)
                    if (this.byPlannedRoad[packedCoord2Num] !== 1) continue
                    if (this.baseCoords[packedCoord2Num] === 255) continue

                    const packedCoord2 = packCoord(coord2)
                    if (packedCoord1 === packedCoord2) continue

                    outputCoords = []

                    for (const adjCoord2 of findCoordsInRangeXY(coord2.x, coord2.y, range)) {
                        const packedAdjCoord2 = packCoord(adjCoord2)
                        if (packedCoord1 === packedAdjCoord2) continue
                        if (packedCoord2 === packedAdjCoord2) continue
                        if (!packedAdjCoords1.has(packedAdjCoord2)) continue

                        outputCoords.push(adjCoord2)
                        if (outputCoords.length >= 8) {
                            this.input2Coord = coord2
                            this.outputCoords = outputCoords
                            return true
                        }
                    }
                }

                return false
            },
            consequence: stampAnchor => {
                this.basePlans.set(packCoord(stampAnchor), STRUCTURE_LAB, 6)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255

                this.basePlans.set(packCoord(this.input2Coord), STRUCTURE_LAB, 6)
                this.baseCoords[packAsNum(this.input2Coord)] = 255
                this.roadCoords[packAsNum(this.input2Coord)] = 255

                for (const coord of this.outputCoords) {
                    this.basePlans.set(packCoord(coord), STRUCTURE_LAB, 8)
                    this.baseCoords[packAsNum(coord)] = 255
                    this.roadCoords[packAsNum(coord)] = 255
                }
            },
        })
    }
    private gridExtensions() {
        this.planStamps({
            stampType: 'gridExtension',
            count:
                CONTROLLER_STRUCTURES.extension[8] -
                stamps.fastFiller.structures[STRUCTURE_EXTENSION].length -
                this.stampAnchors.sourceExtension.length,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                return this.byPlannedRoad[packAsNum(coord)] === 1
            },
            consequence: stampAnchor => {
                this.basePlans.set(packCoord(stampAnchor), STRUCTURE_EXTENSION, 8)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
    private towers() {}
    private observer() {
        this.planStamps({
            stampType: 'observer',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                if (this.gridCoords[packAsNum(coord)] === 1) return false

                return this.baseCoords[packAsNum(coord)] === 0
            },
            consequence: stampAnchor => {
                this.basePlans.set(packCoord(stampAnchor), STRUCTURE_OBSERVER, 8)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
    private nuker() {
        this.planStamps({
            stampType: 'nuker',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                return this.byPlannedRoad[packAsNum(coord)] === 1
            },
            consequence: stampAnchor => {
                this.basePlans.set(packCoord(stampAnchor), STRUCTURE_NUKER, 8)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
    private powerSpawn() {
        this.planStamps({
            stampType: 'powerSpawn',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            coordMap: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                return this.byPlannedRoad[packAsNum(coord)] === 1
            },
            consequence: stampAnchor => {
                this.basePlans.set(packCoord(stampAnchor), STRUCTURE_POWER_SPAWN, 8)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
}

// Old basePlanner

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
            stampType: 'gridExtension',
            count: 6,
            startCoords: [hubAnchor],
        })
    )
        return 'failed'

    // Plan the stamp x times

    for (const extensionsAnchor of room.memory.stampAnchors.gridExtension) {
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
        room.memory.stampAnchors.gridExtension.length * stamps.gridExtension.structures.extension.length -
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
            stampType: 'gridExtension',
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
