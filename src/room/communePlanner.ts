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
    defaultMinCutDepth,
    minOnboardingRamparts,
    defaultSwampCost,
    allStructureTypes,
    buildableStructureTypes,
    structureTypesToProtectSet,
    RoomMemoryKeys,
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
    forAdjacentCoords,
    forCoordsInRange,
    getRangeXY,
    getRange,
    isXYExit,
    isXYInBorder,
    isXYInRoom,
    packAsNum,
    packXYAsNum,
    unpackNumAsCoord,
    unpackNumAsPos,
    forCoordsAroundRange,
    randomIntRange,
    estimateTowerDamage,
    sortBy,
} from 'international/utils'
import { internationalManager } from 'international/international'
import {
    packCoord,
    packPos,
    packPosList,
    packStampAnchors,
    packXYAsCoord,
    reversePosList,
    unpackCoord,
    unpackPosList,
    unpackStampAnchors,
} from 'other/codec'
import 'other/RoomVisual'
import { CommuneManager } from 'room/commune/commune'
import { RoomManager } from './room'
import { BasePlans } from './construction/basePlans'
import { RampartPlans } from './construction/rampartPlans'
import { minCutToExit } from './construction/minCut'
import { customFindPath } from 'international/customPathFinder'

const unprotectedCoordWeight = defaultRoadPlanningPlainCost * 16
const dynamicDistanceWeight = 8

interface PlanStampsArgs {
    stampType: StampTypes
    count: number
    startCoords: Coord[]
    dynamic?: boolean
    weighted?: boolean
    diagonalDT?: boolean
    coordMap?: CoordMap
    dynamicWeight?: Uint32Array
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
    dynamicWeight?: Uint32Array
}

interface FindStampAnchorArgs {
    stamp: Stamp
    startCoords: Coord[]
    coordMap: CoordMap
    minAvoid?: number
    cardinalFlood?: boolean
    conditions?(coord: Coord): boolean
}

interface TowerDamageCoord extends Coord {
    minDamage: number
}

/**
 *
 */
export class CommunePlanner {
    roomManager: RoomManager
    room: Room

    // Holistic

    planAttempts: BasePlanAttempt[]
    planVisualizeIndex: number
    terrainCoords: CoordMap

    //

    centerUpgradePos: RoomPosition
    upgradePath: RoomPosition[]

    inputLab2Coord: Coord
    outputLabCoords: Coord[]

    sourceHarvestPositions: RoomPosition[][]
    sourcePaths: RoomPosition[][]
    sourceStructureCoords: Coord[][]
    communeSources: Source[]

    mineralPath: RoomPosition[]
    mineralHarvestPositions: RoomPosition[]

    unprotectedSources: number
    isControllerProtected: boolean

    // Action checks

    plannedGridCoords: boolean
    finishedGrid: boolean
    generalShielded: boolean
    finishedFastFillerRoadPrune: boolean
    /**
     * If the planner is in the process of recording a plan attempt
     */
    recording: boolean
    markSourcesAvoid: boolean
    finishedTowerPaths: boolean

    //

    basePlans: BasePlans
    rampartPlans: RampartPlans
    baseCoords: Uint8Array
    roadCoords: Uint8Array
    rampartCoords: Uint8Array
    weightedDiagonalCoords: Uint8Array
    diagonalCoords: Uint8Array
    gridCoords: Uint8Array
    exitCoords: Coord[]
    /**
     * Coords adjacent to exits, including exit coords
     */
    byExitCoords: Uint8Array
    /**
     * Coords adjacent to planned roads
     */
    byPlannedRoad: Uint8Array

    /**
     * Coords we should be protecting using ramparts
     */
    protectCoords: Set<string>
    /**
     * Coords protected by ramparts
     */
    protectedCoords: Uint8Array
    /**
     * Coords outside of rampart protection or in range of defensive combat areas
     */
    unprotectedCoords: Uint8Array
    insideMinCut: Set<number>
    outsideMinCut: Set<number>
    bestTowerScore: number
    bestTowerCoords: TowerDamageCoord[]
    towerAttemptIndex: number
    stampAnchors: Partial<{ [key in StampTypes]: Coord[] }>
    fastFillerStartCoords: Coord[]
    minCutCoords: Set<number>
    groupedMinCutCoords: Coord[][]
    RCLPlannedStructureTypes: Partial<{ [key in BuildableStructureConstant]: RCLPlannedStructureType }>
    /**
     * The preference towards a plan attempt. Lower score is better
     */
    score: number

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    _reverseExitFlood: Uint32Array
    get reverseExitFlood() {
        if (this._reverseExitFlood) return this._reverseExitFlood

        this._reverseExitFlood = new Uint32Array(2500)

        let visitedCoords = new Uint8Array(2500)
        for (const coord of this.exitCoords) visitedCoords[packAsNum(coord)] = 1

        let depth = -1
        let thisGeneration = this.exitCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []

            // Iterate through positions of this gen

            for (const coord1 of thisGeneration) {
                this._reverseExitFlood[packAsNum(coord1)] = depth

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

            depth -= 1
            thisGeneration = nextGeneration
        }

        return this._reverseExitFlood
    }

    get isFirstRoom() {
        return this.room.controller.my && this.room.controller.safeMode && global.communes.size <= 1
    }

    preTickRun() {
        this.room = this.roomManager.room

        if (this.room.memory[RoomMemoryKeys.communePlanned] !== undefined) return RESULT_NO_ACTION

        // Stop if there isn't sufficient CPU

        if (Game.cpu.bucket < CPUMaxPerTick) return RESULT_NO_ACTION

        if (this.recording) this.record()

        // Planning is complete, choose the best one

        if (this.fastFillerStartCoords && this.planAttempts.length === this.fastFillerStartCoords.length) {
            /* this.visualizeBestPlan() */
            this.choosePlan()
            return RESULT_SUCCESS
        }

        // Initial configuration

        if (!this.terrainCoords) {
            this.terrainCoords = internationalManager.getTerrainCoords(this.room.name)
            this.planAttempts = []
        }

        // Plan attempt / configuration

        if (!this.baseCoords) {
            this.baseCoords = new Uint8Array(this.terrainCoords)
            this.roadCoords = new Uint8Array(this.terrainCoords)
            this.rampartCoords = new Uint8Array(2500)
            this.byPlannedRoad = new Uint8Array(2500)

            this.byExitCoords = new Uint8Array(2500)
            this.exitCoords = []
            this.recordExits()

            this.basePlans = new BasePlans()
            this.rampartPlans = new RampartPlans()
            this.stampAnchors = {}
            this.RCLPlannedStructureTypes = {}
            for (const stampType in stamps) {
                this.stampAnchors[stampType as StampTypes] = []
            }
            for (const structureType of buildableStructureTypes) {
                this.RCLPlannedStructureTypes[structureType] = {
                    structures: 0,
                    minRCL: 1,
                }
            }
            this.score = 0
        }
        /*
        this.setBasePlansXY(24, 24, STRUCTURE_CONTAINER, 2)
        this.setBasePlansXY(25, 25, STRUCTURE_CONTAINER, 2)
        this.setBasePlansXY(25, 25, STRUCTURE_LINK, 5)
        customLog('PLAN 1', JSON.stringify(this.basePlans.map))

        const packedPlans = this.basePlans.pack()
        customLog('PACKED', packedPlans)

        const unpacked = BasePlans.unpack(packedPlans)
        customLog('UNPACKED', JSON.stringify(unpacked.map))
        delete this.baseCoords
        return RESULT_NO_ACTION
 */
        this.avoidSources()
        this.avoidMineral()
        if (this.fastFiller() === RESULT_FAIL) return RESULT_FAIL
        this.postFastFillerConfig()
        this.generateGrid()
        /* this.pruneFastFillerRoads() */
        if (this.findCenterUpgradePos() === RESULT_FAIL) return RESULT_FAIL
        this.findSourceHarvestPositions()
        this.hub()
        this.labs()
        this.sourceStructures()
        this.gridExtensions()
        this.gridExtensionSourcePaths()
        this.nuker()
        this.powerSpawn()
        this.observer()
        this.planGridCoords()
        this.runMinCut()
        this.groupMinCutCoords()
        this.findUnprotectedCoords()
        this.planSourceStructures()
        // Run for a second time to account for any failed source structures
        this.planGridCoords()
        this.onboardingRamparts()
        this.findOutsideMinCut()
        this.findInsideMinCut()
        this.towers()
        this.towerPaths()
        this.mineral()
        this.generalShield()
        this.visualizeCurrentPlan()
        /* this.visualizeCurrentPlan()
        return RESULT_SUCCESS */
        this.findScore()
        this.record()

        return RESULT_ACTION
    }
    /**
     *
     * @returns the minRCL
     */
    private setBasePlansXY(x: number, y: number, structureType: BuildableStructureConstant, minRCL?: number) {
        this.RCLPlannedStructureTypes[structureType].structures += 1

        if (minRCL === undefined) {
            while (
                this.RCLPlannedStructureTypes[structureType].structures >
                CONTROLLER_STRUCTURES[structureType][this.RCLPlannedStructureTypes[structureType].minRCL]
            ) {
                this.RCLPlannedStructureTypes[structureType].minRCL += 1
            }

            minRCL = this.RCLPlannedStructureTypes[structureType].minRCL
        }

        const packedCoord = packXYAsCoord(x, y)
        const coordData = this.basePlans.map[packedCoord]
        if (!coordData) {
            this.basePlans.map[packedCoord] = [
                {
                    structureType,
                    minRCL,
                },
            ]

            return minRCL
        }

        if (structureType === STRUCTURE_ROAD) {
            coordData[0].minRCL = Math.min(coordData[0].minRCL, minRCL)
            return minRCL
        }

        // Place in order of minRCL, ascending

        let i = 0
        for (; i < coordData.length; i++) {
            const data = coordData[i]
            if (minRCL > data.minRCL) break
        }

        coordData.splice(i, 0, {
            structureType,
            minRCL,
        })

        return minRCL

        /*
        const planCoord = this.basePlans.map[packedCoord]
        if (!planCoord) {
            this.basePlans.map[packedCoord] = [{
                structureType,
                minRCL,
            }]
            return
        }

        if (planCoord.structureType !== structureType) {

            planCoord.structureType = structureType
            planCoord.minRCL = minRCL
            return
        }

        // The structureTypes are the same

        planCoord.minRCL = Math.min(planCoord.minRCL, minRCL)
        */
    }
    private setRampartPlansXY(
        x: number,
        y: number,
        minRCL: number,
        coversStructure: boolean,
        buildForNuke: boolean,
        buildForThreat: boolean,
    ) {
        const packedCoord = packXYAsCoord(x, y)

        const coordData = this.rampartPlans.map[packedCoord]
        if (coordData) {
            this.rampartPlans.map[packedCoord] = {
                minRCL: Math.min(coordData.minRCL, minRCL),
                coversStructure: +coordData.coversStructure /* || +coversStructure */,
                buildForNuke: +coordData.buildForNuke /* || +buildForNuke */,
                buildForThreat: +coordData.buildForThreat /* || +buildForThreat */,
            }
        }

        this.rampartPlans.map[packedCoord] = {
            minRCL,
            coversStructure: +coversStructure,
            buildForNuke: +buildForNuke,
            buildForThreat: +buildForThreat,
        }
    }
    private recordExits() {
        for (const packedCoord of this.room.exitCoords) {
            const coord = unpackCoord(packedCoord)
            this.exitCoords.push(coord)
            forAdjacentCoords(coord, adjCoord => {
                const packedAdjCoord = packAsNum(adjCoord)
                if (this.terrainCoords[packedAdjCoord] === 255) return

                this.byExitCoords[packedAdjCoord] = 255
                this.baseCoords[packedAdjCoord] = 255
            })
        }
    }
    private generateGrid() {
        if (this.finishedGrid) return

        delete this.gridCoords
        delete this.diagonalCoords
        delete this.weightedDiagonalCoords

        const terrain = this.room.getTerrain()
        const gridSize = 4
        const anchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y - 1,
            this.room.name,
        )

        const inset = 1

        this.diagonalCoords = new Uint8Array(2500)
        this.weightedDiagonalCoords = new Uint8Array(2500)

        // Checkerboard

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue

                // Calculate the position of the cell relative to the anchor

                const relX = x - anchor.x
                const relY = y - anchor.y

                // Check if the cell is part of a diagonal line
                if (Math.abs(relX - 3 * relY) % 2 !== 0 && Math.abs(relX + 3 * relY) % 2 !== 0) continue

                const packedCoord = packXYAsNum(x, y)

                if (terrain.get(x, y) === TERRAIN_MASK_SWAMP) {
                    this.diagonalCoords[packedCoord] = 3 * defaultSwampCost
                    this.weightedDiagonalCoords[packedCoord] = 8 * defaultSwampCost
                    continue
                }
                this.diagonalCoords[packedCoord] = 4
                this.weightedDiagonalCoords[packedCoord] = 8
            }
        }

        this.gridCoords = new Uint8Array(2500)
        const gridCoordsArray: Coord[] = []

        // Grid

        for (let x = inset; x < roomDimensions - inset; x++) {
            for (let y = inset; y < roomDimensions - inset; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.baseCoords[packedCoord] === 255) continue
                if (this.byExitCoords[packedCoord] > 0) continue

                // Calculate the position of the cell relative to the anchor

                const relX = x - anchor.x
                const relY = y - anchor.y

                // Check if the cell is part of a diagonal line
                if (Math.abs(relX - 3 * relY) % gridSize !== 0 && Math.abs(relX + 3 * relY) % gridSize !== 0) continue

                gridCoordsArray.push({ x, y })

                if (terrain.get(x, y) === TERRAIN_MASK_SWAMP) {
                    this.gridCoords[packedCoord] = 2 * defaultSwampCost
                    continue
                }
                this.gridCoords[packedCoord] = 2
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

                        if (this.gridCoords[packAsNum(adjCoord)] === 0) continue

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
            return getRange(a, anchor) - getRange(b, anchor)
        })

        // Paths for grid groups

        for (const leaderCoord of groupLeaders) {
            const path = customFindPath({
                origin: new RoomPosition(leaderCoord.x, leaderCoord.y, this.room.name),
                goals: [{ pos: anchor, range: 3 }],
                weightCoordMaps: [this.weightedDiagonalCoords, this.gridCoords, this.baseCoords],
                plainCost: defaultRoadPlanningPlainCost * 6,
                swampCost: defaultSwampCost * 6,
            })

            // If the path failed, delete all members of the group

            if (!path.length && !gridGroups[leaderCoord.index].find(coord => getRange(coord, anchor) <= 3)) {
                for (const coord of gridGroups[leaderCoord.index]) {
                    this.gridCoords[packAsNum(coord)] = 0
                }
                continue
            }

            for (const coord of path) {
                if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_SWAMP) {
                    this.gridCoords[packAsNum(coord)] = 2 * defaultSwampCost
                    continue
                }
                this.gridCoords[packAsNum(coord)] = 2
            }
        }

        // Group exits

        const exitGroups: Coord[][] = []
        visitedCoords = new Set()
        groupIndex = 0

        for (const packedCoord of this.room.exitCoords) {
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
            const path = customFindPath({
                origin: new RoomPosition(group[0].x, group[0].y, this.room.name),
                goals: [{ pos: anchor, range: 3 }],
                weightCoordMaps: [this.weightedDiagonalCoords, this.gridCoords],
                plainCost: defaultRoadPlanningPlainCost * 6,
                swampCost: defaultSwampCost * 6,
            })

            for (const coord of path) {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) continue

                if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_SWAMP) {
                    this.gridCoords[packAsNum(coord)] = 2 * defaultSwampCost
                    continue
                }
                this.gridCoords[packAsNum(coord)] = 2
            }
        }

        this.pruneGridCoords()

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.gridCoords[packedCoord] === 0) continue

                for (const adjCoord of findAdjacentCoordsToXY(x, y)) {
                    const packedAdjCoord = packAsNum(adjCoord)

                    if (this.gridCoords[packedAdjCoord] > 0) continue
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
        if (this.gridCoords[packedCoord] === 0) return

        let adjNonGridCoords: Coord[] = []
        let adjGridCoords = 0

        for (const adjCoord of findAdjacentCoordsToXY(x, y)) {
            const packedAdjCoord = packAsNum(adjCoord)

            if (this.gridCoords[packedAdjCoord] > 0) {
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
                if (this.gridCoords[packAsNum(adjCoord)] === 0) continue

                adjGridCoords += 1
            }

            if (adjGridCoords > 1) continue
            if (noAltNonGridCoord) return

            noAltNonGridCoord = true
        }

        this.gridCoords[packedCoord] = 0
    }
    /**
     *
     * @param coord
     * @returns RESULT_ACTION if the road should be removed
     */
    private fastFillerPruneRoadCoord(coord: Coord) {
        let adjSpawn: boolean

        forAdjacentCoords(coord, adjCoord => {
            const packedAdjCoord = packAsNum(adjCoord)
            if (this.terrainCoords[packedAdjCoord] === 255) return
            if (this.roadCoords[packedAdjCoord] !== 1 && this.gridCoords[packedAdjCoord] === 0)
                this.byPlannedRoad[packedAdjCoord] = 1

            const coordData = this.basePlans.get(packCoord(adjCoord))
            if (!coordData) return

            if (coordData[0].structureType === STRUCTURE_SPAWN) adjSpawn = true
        })

        if (adjSpawn) return RESULT_NO_ACTION

        let cardinalRoads = 0

        for (const offset of cardinalOffsets) {
            const adjCoord = {
                x: offset.x + coord.x,
                y: offset.y + coord.y,
            }

            const packedAdjCoord = packAsNum(adjCoord)
            if (this.roadCoords[packedAdjCoord] !== 1 && this.gridCoords[packedAdjCoord] === 0) continue

            cardinalRoads += 1
        }

        if (cardinalRoads >= 3) return RESULT_ACTION
        return RESULT_NO_ACTION
    }
    /**
     * Has some issues, is disabled
     */
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
            const packedCoord = packAsNum(coord)
            if (this.roadCoords[packedCoord] !== 1) continue

            if (this.fastFillerPruneRoadCoord(coord) === RESULT_ACTION) {
                this.roadCoords[packedCoord] = 0
                continue
            }

            this.setBasePlansXY(coord.x, coord.y, STRUCTURE_ROAD, 3)
            this.roadCoords[packedCoord] = 1
            this.byPlannedRoad[packedCoord] = 0
        }

        this.finishedFastFillerRoadPrune = true
    }
    private avoidSources() {
        if (this.markSourcesAvoid) return

        for (const source of this.room.find(FIND_SOURCES)) {
            forAdjacentCoords(source.pos, adjCoord => {
                const packedCoord = packAsNum(adjCoord)
                if (this.terrainCoords[packedCoord] === 255) return

                this.baseCoords[packedCoord] = 255
            })
        }

        this.markSourcesAvoid = true
    }
    private avoidMineral() {
        if (this.mineralHarvestPositions) return

        const mineralHarvestPositions: RoomPosition[] = []
        const mineralPos = this.room.roomManager.mineral.pos

        for (const offset of adjacentOffsets) {
            const adjPos = new RoomPosition(offset.x + mineralPos.x, offset.y + mineralPos.y, this.room.name)

            const packedCoord = packAsNum(adjPos)
            if (this.terrainCoords[packedCoord] === 255) continue

            this.baseCoords[packedCoord] = 255
            mineralHarvestPositions.push(adjPos)
        }

        this.mineralHarvestPositions = mineralHarvestPositions
    }
    private postFastFillerConfig() {
        if (this.communeSources) return

        const fastFillerPos = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )
        const sources = this.room.find(FIND_SOURCES)
        sortBy(
            sources,
            ({ pos }) =>
                customFindPath({
                    origin: pos,
                    goals: [
                        {
                            pos: fastFillerPos,
                            range: 3,
                        },
                    ],
                    weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                    plainCost: defaultRoadPlanningPlainCost,
                }).length,
        )

        for (const coord of findCoordsInRange(this.room.controller.pos, 2)) {
            const packedCoord = packAsNum(coord)
            this.baseCoords[packedCoord] = this.terrainCoords[packedCoord]
        }

        this.communeSources = sources
    }
    private findSourceHarvestPositions() {
        if (this.sourceHarvestPositions) return

        const fastFillerAnchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )

        const sourceHarvestPositions: RoomPosition[][] = []

        for (const i in this.communeSources) {
            sourceHarvestPositions.push([])

            const sourcePos = this.communeSources[i].pos
            for (const offset of adjacentOffsets) {
                const adjPos = new RoomPosition(offset.x + sourcePos.x, offset.y + sourcePos.y, this.room.name)
                const packedCoord = packAsNum(adjPos)

                if (this.terrainCoords[packedCoord] === 255) continue
                if (this.baseCoords[packedCoord] !== 255) continue

                this.baseCoords[packedCoord] = 0
                sourceHarvestPositions[i].push(adjPos)
            }
            /*
            // Remove source harvest positions overlapping with upgrade positions or other source harvest positions
            // Loop through each pos index

            for (let j = sourceHarvestPositions[i].length - 1; j >= 0; j -= 1) {
                if (this.baseCoords[packAsNum(sourceHarvestPositions[i][j])] !== 255) continue

                sourceHarvestPositions.splice(j, 1)
            }
 */
            sortBy(
                sourceHarvestPositions[i],
                origin =>
                    customFindPath({
                        origin,
                        goals: [
                            {
                                pos: fastFillerAnchor,
                                range: 3,
                            },
                        ],
                        weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                        plainCost: defaultRoadPlanningPlainCost,
                    }).length,
            )

            const closestHarvestPos = sourceHarvestPositions[i][0]

            if (!closestHarvestPos) {
                throw Error('no closest harvest pos ' + this.room.name)
                return
            }

            this.setBasePlansXY(closestHarvestPos.x, closestHarvestPos.y, STRUCTURE_CONTAINER, 3)
            const packedCoord = packAsNum(closestHarvestPos)
            this.roadCoords[packedCoord] = 20
            this.baseCoords[packedCoord] = 255
        }

        for (const i in this.communeSources) {
            const origin = sourceHarvestPositions[i][0]

            const path = customFindPath({
                origin: origin,
                goals: [
                    {
                        pos: fastFillerAnchor,
                        range: 3,
                    },
                ],
                weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })

            let j = 0
            let pos = path[j]
            while (pos && getRange(pos, this.communeSources[i].pos) <= 2) {
                this.baseCoords[packAsNum(pos)] = 255

                j += 1
                pos = path[j]
            }
        }

        this.sourceHarvestPositions = sourceHarvestPositions
    }
    private mineral() {
        if (this.mineralPath) return

        const goal = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)

        sortBy(
            this.mineralHarvestPositions,
            origin =>
                customFindPath({
                    origin,
                    goals: [
                        {
                            pos: goal,
                            range: 3,
                        },
                    ],
                    weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                    plainCost: defaultRoadPlanningPlainCost,
                }).length,
        )

        const path = customFindPath({
            origin: this.mineralHarvestPositions[0],
            goals: [{ pos: goal, range: 1 }],
            weightCoordMaps: [this.diagonalCoords, this.roadCoords],
            plainCost: defaultRoadPlanningPlainCost * 2,
            swampCost: defaultSwampCost * 2,
        })

        for (const pos of path) {
            this.roadCoords[packAsNum(pos)] = 1
            this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, 6)
        }

        const closestMineralHarvestPos = this.mineralHarvestPositions[0]

        this.setBasePlansXY(closestMineralHarvestPos.x, closestMineralHarvestPos.y, STRUCTURE_CONTAINER, 6)
        const packedCoord = packAsNum(closestMineralHarvestPos)
        this.roadCoords[packedCoord] = 20
        this.baseCoords[packedCoord] = 255

        const mineralPos = this.room.roomManager.mineral.pos
        this.setBasePlansXY(mineralPos.x, mineralPos.y, STRUCTURE_EXTRACTOR, 6)

        this.mineralHarvestPositions = this.mineralHarvestPositions.filter(pos => {
            return getRange(closestMineralHarvestPos, pos) <= 1
        })

        this.mineralPath = path
    }
    private sourceStructures() {
        if (this.sourceStructureCoords) return

        this.stampAnchors.sourceExtension = []

        const fastFillerAnchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )
        const avoidCoords: Set<number> = new Set()

        for (let i = 0; i < this.sourceHarvestPositions.length; i++) {
            const closestHarvestPos = this.sourceHarvestPositions[i][0]

            const path = customFindPath({
                origin: closestHarvestPos,
                goals: [
                    {
                        pos: fastFillerAnchor,
                        range: 3,
                    },
                ],
                weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })
            /*
            // Temporary fix

            if (!path.length) {

                this.room.visualizeCoordMap(this.baseCoords)
                return
            }
 */
            for (const pos of path) {
                avoidCoords.add(packAsNum(pos))
                this.room.coordVisual(pos.x, pos.y)
            }
        }

        const sourceStructureCoords: Coord[][] = []

        for (let i = 0; i < this.sourceHarvestPositions.length; i++) {
            const closestHarvestPos = this.sourceHarvestPositions[i][0]

            sourceStructureCoords.push([])

            forAdjacentCoords(closestHarvestPos, adjCoord => {
                const packedAdjCoord = packAsNum(adjCoord)

                if (avoidCoords.has(packedAdjCoord)) return
                if (this.baseCoords[packedAdjCoord] === 255) return
                if (this.roadCoords[packedAdjCoord] > 0) return

                sourceStructureCoords[i].push(adjCoord)
                this.baseCoords[packedAdjCoord] = 255
                this.roadCoords[packedAdjCoord] = 255
            })

            this.stampAnchors.sourceExtension = this.stampAnchors.sourceExtension.concat(sourceStructureCoords[i])
            this.stampAnchors.sourceExtension.pop()
        }

        this.sourceStructureCoords = sourceStructureCoords
    }
    private planSourceStructures() {
        if (this.stampAnchors.sourceLink.length) return

        const sourceLinkCoords: Coord[] = []
        const sourceExtensionCoords: Coord[] = []
        const hubAnchor = this.stampAnchors.hub[0]

        for (let i = 0; i < this.sourceStructureCoords.length; i++) {
            let closestCoordIndex: number
            let closestRange = Infinity

            for (let j = this.sourceStructureCoords[i].length - 1; j >= 0; j--) {
                const coord = this.sourceStructureCoords[i][j]
                const packedCoord = packAsNum(coord)

                if (this.minCutCoords.has(packedCoord)) {
                    this.roadCoords[packedCoord] = 0
                    continue
                }

                const range = getRange(hubAnchor, coord)
                if (range >= closestRange) continue

                closestCoordIndex = j
                closestRange = range
            }

            if (!closestCoordIndex) continue

            const closestCoord = this.sourceStructureCoords[i][closestCoordIndex]
            this.sourceStructureCoords[i].splice(closestCoordIndex, 1)

            sourceLinkCoords.push(closestCoord)

            const packedCoord = packAsNum(closestCoord)
            this.baseCoords[packedCoord] = 255
            this.roadCoords[packedCoord] = 255

            for (const coord of this.sourceStructureCoords[i]) {
                const packedCoord = packAsNum(coord)
                if (this.minCutCoords.has(packedCoord)) {
                    this.roadCoords[packedCoord] = 0
                    continue
                }

                sourceExtensionCoords.push(coord)
                this.setBasePlansXY(coord.x, coord.y, STRUCTURE_EXTENSION)

                this.baseCoords[packedCoord] = 255
                this.roadCoords[packedCoord] = 255
            }
        }

        sourceLinkCoords.reverse()
        for (const coord of sourceLinkCoords) {
            this.setBasePlansXY(coord.x, coord.y, STRUCTURE_LINK)
        }

        this.stampAnchors.sourceExtension = sourceExtensionCoords
        this.stampAnchors.sourceLink = sourceLinkCoords
    }
    private findCenterUpgradePos() {
        if (this.centerUpgradePos) return false
        const controllerPos = this.room.controller.pos

        let bestCoords: Set<number> = new Set()
        let bestScore = 0

        forCoordsAroundRange(controllerPos, 2, coord => {
            const packedCoord = packAsNum(coord)
            if (this.roadCoords[packAsNum(coord)] > 0) return

            let score = 0

            forAdjacentCoords(coord, adjCoord => {
                if (this.roadCoords[packAsNum(adjCoord)] > 0) return

                score += 1
            })

            if (score > bestScore) {
                bestCoords = new Set([packedCoord])
                bestScore = score
                return
            }
            if (score === bestScore) {
                bestCoords.add(packedCoord)
                return
            }
        })

        if (!bestCoords.size) return RESULT_FAIL

        const centerUpgradePos = this.room.findClosestPos({
            coordMap: this.roadCoords,
            sources: [this.stampAnchors.fastFiller[0]],
            targetCondition: coord => {
                return bestCoords.has(packAsNum(coord))
            },
        })

        if (!centerUpgradePos) return RESULT_FAIL

        const packedCoord = packAsNum(centerUpgradePos)
        this.setBasePlansXY(centerUpgradePos.x, centerUpgradePos.y, STRUCTURE_CONTAINER, 2)
        this.setBasePlansXY(centerUpgradePos.x, centerUpgradePos.y, STRUCTURE_LINK)

        forCoordsAroundRange(centerUpgradePos, 1, adjCoord => {
            const packedAdjCoord = packAsNum(adjCoord)
            this.baseCoords[packedAdjCoord] = 255
            this.roadCoords[packedAdjCoord] = 20
        })

        this.roadCoords[packedCoord] = 255
        this.baseCoords[packedCoord] = 255

        this.centerUpgradePos = centerUpgradePos
        return RESULT_SUCCESS
    }
    private planGridCoords() {
        if (this.plannedGridCoords) return

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.gridCoords[packedCoord] === 0) continue
                if (this.roadCoords[packedCoord] === 1) continue
                if (this.baseCoords[packedCoord] === 255) continue

                let minRCL = Infinity

                forAdjacentCoords({ x: x, y: y }, adjCoord => {
                    const coordData = this.basePlans.get(packCoord(adjCoord))
                    if (!coordData) return
                    if (coordData[0].structureType === STRUCTURE_ROAD) return

                    const RCL = coordData[0].minRCL
                    if (RCL >= minRCL) return

                    minRCL = RCL
                })

                if (minRCL === Infinity) continue

                this.setBasePlansXY(x, y, STRUCTURE_ROAD, minRCL)
                this.roadCoords[packedCoord] = 1
            }
        }

        this.plannedGridCoords = true
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
                        dynamicWeight: args.dynamicWeight,
                    })
                    if (!stampAnchor) return RESULT_FAIL

                    args.consequence(stampAnchor)
                    this.stampAnchors[args.stampType].push(stampAnchor)

                    continue
                }
                stampAnchor = this.findDynamicStampAnchor({
                    stamp,
                    startCoords: args.startCoords,
                    conditions: args.conditions,
                })
                if (!stampAnchor) return RESULT_FAIL

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
            if (!stampAnchor) return RESULT_FAIL

            args.consequence(stampAnchor)
            this.stampAnchors[args.stampType].push(stampAnchor)
        }

        return RESULT_SUCCESS
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
        if (this.isCloseToExit(coord1, args.stamp.protectionOffset + 1)) return false
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

        let fromOrigin = new Uint8Array(2500)
        let lowestNextGenCost = Infinity
        let thisGeneration = args.startCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []
            let lowestGenCost = lowestNextGenCost
            lowestNextGenCost = Infinity

            let localVisitedCoords = new Uint8Array(visitedCoords)

            // Flood adjacent coords that are passible

            for (const coord of thisGeneration) {
                const packedCoord = packAsNum(coord)
                const coordCostFromOrigin = fromOrigin[packedCoord]
                const coordCost = args.dynamicWeight[packedCoord] + coordCostFromOrigin

                if (coordCost > lowestGenCost) {
                    nextGeneration.push(coord)
                    continue
                }

                if (this.isViableDynamicStampAnchor(args, coord)) return coord

                // Add viable adjacent coords to the next generation

                for (const offset of adjacentOffsets) {
                    const adjCoord = {
                        x: coord.x + offset.x,
                        y: coord.y + offset.y,
                    }

                    if (!isXYInRoom(coord.x, coord.y)) continue

                    const packedAdjCoord = packAsNum(adjCoord)

                    if (localVisitedCoords[packedAdjCoord] === 1) continue
                    localVisitedCoords[packedAdjCoord] = 1

                    if (this.baseCoords[packedAdjCoord] === 255) continue

                    nextGeneration.push(adjCoord)

                    const adjCostFromOrigin = (fromOrigin[packedAdjCoord] = coordCostFromOrigin + dynamicDistanceWeight)
                    const adjCoordCost = args.dynamicWeight[packedAdjCoord] + adjCostFromOrigin

                    if (adjCoordCost < lowestNextGenCost) lowestNextGenCost = adjCoordCost
                }
            }

            // Flood all adjacent coords

            if (!nextGeneration.length) {
                localVisitedCoords = new Uint8Array(visitedCoords)

                for (const coord of thisGeneration) {
                    const packedCoord = packAsNum(coord)
                    const coordCostFromOrigin = fromOrigin[packedCoord]
                    const coordCost = args.dynamicWeight[packedCoord] + coordCostFromOrigin

                    if (coordCost > lowestGenCost) {
                        nextGeneration.push(coord)
                        continue
                    }

                    if (this.isViableDynamicStampAnchor(args, coord)) return coord

                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const adjCoord = {
                            x: coord.x + offset.x,
                            y: coord.y + offset.y,
                        }

                        if (!isXYInRoom(coord.x, coord.y)) continue

                        const packedAdjCoord = packAsNum(adjCoord)

                        if (localVisitedCoords[packedAdjCoord] === 1) continue
                        localVisitedCoords[packedAdjCoord] = 1

                        nextGeneration.push(adjCoord)

                        const adjCostFromOrigin = (fromOrigin[packedAdjCoord] =
                            coordCostFromOrigin + dynamicDistanceWeight)
                        const adjCoordCost = args.dynamicWeight[packedAdjCoord] + adjCostFromOrigin

                        if (adjCoordCost < lowestNextGenCost) lowestNextGenCost = adjCoordCost
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
        if (this.roadCoords[packAsNum(coord1)] > 0) return false
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

                    if (this.room.exitCoords.has(packCoord(coord2))) return true

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
    private findFastFillerOrigin() {
        if (this.fastFillerStartCoords) return this.fastFillerStartCoords[this.planAttempts.length]

        // Controller

        const origins: Coord[] = [this.room.controller.pos]

        // Both sources

        const sources = this.room.find(FIND_SOURCES)
        for (const source of sources) origins.push(source.pos)

        // Find the closest source pos and its path to the controller

        let shortestPath: RoomPosition[]

        for (const source of sources) {
            const path = customFindPath({
                origin: source.pos,
                goals: [{ pos: this.room.controller.pos, range: 1 }],
                plainCost: defaultRoadPlanningPlainCost,
            })
            if (shortestPath && path.length >= shortestPath.length) continue

            shortestPath = path
        }

        let origin = shortestPath[Math.floor(shortestPath.length / 2)]
        if (origin) origins.push(origin)

        // Avg path between sources, if more than 1

        if (sources.length > 1) {
            const path = customFindPath({
                origin: sources[0].pos,
                goals: [{ pos: sources[1].pos, range: 1 }],
                plainCost: defaultRoadPlanningPlainCost,
            })

            origin = path[Math.floor(path.length / 2)]
            if (origin) origins.push(origin)
        }

        this.fastFillerStartCoords = origins
        return this.fastFillerStartCoords[this.planAttempts.length]
    }
    private fastFiller() {
        if (this.stampAnchors.fastFiller.length) return RESULT_NO_ACTION

        for (const coord of findCoordsInRange(this.room.controller.pos, 2)) {
            this.baseCoords[packAsNum(coord)] = 255
        }

        const result = this.planStamps({
            stampType: 'fastFiller',
            count: 1,
            startCoords: [this.findFastFillerOrigin()],
            cardinalFlood: true,
            consequence: stampAnchor => {
                const stampOffset = stamps.fastFiller.offset
                const structures = stamps.fastFiller.structures

                for (const coord of structures.road) {
                    const properCoord = {
                        x: coord.x + stampAnchor.x - stampOffset,
                        y: coord.y + stampAnchor.y - stampOffset,
                    }
                    const packedCoord = packAsNum(properCoord)
                    this.setBasePlansXY(properCoord.x, properCoord.y, STRUCTURE_ROAD, 3)
                    this.roadCoords[packedCoord] = 1
                    this.byPlannedRoad[packedCoord] = 0
                }

                const properCoord = {
                    x: structures.link[0].x + stampAnchor.x - stampOffset,
                    y: structures.link[0].y + stampAnchor.y - stampOffset,
                }
                const packedCoord = packAsNum(properCoord)
                this.setBasePlansXY(properCoord.x, properCoord.y, STRUCTURE_LINK, 6)
                this.baseCoords[packedCoord] = 255
                this.roadCoords[packedCoord] = 255

                const fastFillerPos = new RoomPosition(stampAnchor.x, stampAnchor.y, this.room.name)
                const sources = this.room.find(FIND_SOURCES)
                sortBy(
                    sources,
                    ({ pos }) =>
                        customFindPath({
                            origin: pos,
                            goals: [
                                {
                                    pos: fastFillerPos,
                                    range: 3,
                                },
                            ],
                            weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                            plainCost: defaultRoadPlanningPlainCost,
                        }).length,
                )

                const fastFillerCoords = structures.empty
                sortBy(
                    fastFillerCoords,
                    ({ x, y }) =>
                        customFindPath({
                            origin: new RoomPosition(
                                x + stampAnchor.x - stampOffset,
                                y + stampAnchor.y - stampOffset,
                                this.room.name,
                            ),
                            goals: [
                                {
                                    pos: sources[0].pos,
                                    range: 1,
                                },
                            ],
                            weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                            plainCost: defaultRoadPlanningPlainCost,
                        }).length,
                )

                let containerMinRCL = 1
                const containerCoords = [...structures.container]
                const extensionCoords = [...structures.extension]
                const spawnCoords = [...structures.spawn]

                for (let i = 0; i < fastFillerCoords.length; i++) {
                    const coord = fastFillerCoords[i]

                    for (let j = extensionCoords.length - 1; j >= 0; j--) {
                        const structureCoord = extensionCoords[j]
                        if (getRange(coord, structureCoord) > 1) continue

                        const properCoord = {
                            x: structureCoord.x + stampAnchor.x - stampOffset,
                            y: structureCoord.y + stampAnchor.y - stampOffset,
                        }
                        const packedCoord = packAsNum(properCoord)
                        this.setBasePlansXY(properCoord.x, properCoord.y, STRUCTURE_EXTENSION)
                        this.baseCoords[packedCoord] = 255
                        this.roadCoords[packedCoord] = 255

                        extensionCoords.splice(j, 1)
                    }

                    for (let j = spawnCoords.length - 1; j >= 0; j--) {
                        const structureCoord = spawnCoords[j]
                        if (getRange(coord, structureCoord) > 1) continue

                        const properCoord = {
                            x: structureCoord.x + stampAnchor.x - stampOffset,
                            y: structureCoord.y + stampAnchor.y - stampOffset,
                        }
                        const packedCoord = packAsNum(properCoord)
                        this.setBasePlansXY(properCoord.x, properCoord.y, STRUCTURE_SPAWN)
                        this.baseCoords[packedCoord] = 255
                        this.roadCoords[packedCoord] = 255

                        // It's not our first room, have a rampart planned to build the spawn under

                        if (i === 0 && !this.isFirstRoom) {
                            this.setRampartPlansXY(properCoord.x, properCoord.y, 2, false, false, false)
                        }

                        spawnCoords.splice(j, 1)
                        break
                    }

                    for (let j = containerCoords.length - 1; j >= 0; j--) {
                        const structureCoord = containerCoords[j]
                        if (getRange(coord, structureCoord) > 1) continue

                        const properCoord = {
                            x: structureCoord.x + stampAnchor.x - stampOffset,
                            y: structureCoord.y + stampAnchor.y - stampOffset,
                        }
                        const packedCoord = packAsNum(properCoord)
                        this.setBasePlansXY(properCoord.x, properCoord.y, STRUCTURE_CONTAINER, containerMinRCL)
                        this.baseCoords[packedCoord] = 255
                        this.roadCoords[packedCoord] = 255

                        containerMinRCL += 2
                        containerCoords.splice(j, 1)
                        break
                    }
                }
            },
        })

        return result
    }
    private hub() {
        const fastFillerPos = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )

        let closestSource: Source
        let closestSourceDistance = Infinity

        for (const source of this.room.find(FIND_SOURCES)) {
            const range = customFindPath({
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

        let pathOrigin: RoomPosition
        if (getRange(fastFillerPos, this.centerUpgradePos) >= 10) {
            pathOrigin = this.centerUpgradePos
        } else {
            pathOrigin = closestSource.pos
        }

        const path = customFindPath({
            origin: pathOrigin,
            goals: [{ pos: fastFillerPos, range: 3 }],
            weightCoordMaps: [this.roadCoords],
            plainCost: defaultRoadPlanningPlainCost,
        })
        const origin = path[path.length - 1] || pathOrigin

        this.planStamps({
            stampType: 'hub',
            count: 1,
            startCoords: [origin],
            dynamic: true,
            weighted: true,
            dynamicWeight: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure cardinal directions aren't gridCoords but are each adjacent to one
             */
            conditions: coord => {
                if (this.gridCoords[packAsNum(coord)] > 0) return false

                for (const offsets of cardinalOffsets) {
                    const packedCoord = packXYAsNum(coord.x + offsets.x, coord.y + offsets.y)
                    if (this.roadCoords[packedCoord] > 0) return false
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

                let [coord, i] = this.findStorageCoord(structureCoords)
                structureCoords.splice(i, 1)
                this.setBasePlansXY(coord.x, coord.y, STRUCTURE_STORAGE, 4)
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
                this.setBasePlansXY(coord.x, coord.y, STRUCTURE_TERMINAL, 6)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                //
                ;[coord, i] = findClosestCoord(this.room.controller.pos, structureCoords)
                structureCoords.splice(i, 1)
                this.setBasePlansXY(coord.x, coord.y, STRUCTURE_LINK, 5)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                coord = structureCoords[0]
                this.setBasePlansXY(coord.x, coord.y, STRUCTURE_FACTORY, 7)
                this.baseCoords[packAsNum(coord)] = 255
                this.roadCoords[packAsNum(coord)] = 255

                const path = customFindPath({
                    origin: new RoomPosition(stampAnchor.x, stampAnchor.y, this.room.name),
                    goals: [{ pos: fastFillerPos, range: 3 }],
                    weightCoordMaps: [this.diagonalCoords, this.gridCoords, this.roadCoords],
                    plainCost: defaultRoadPlanningPlainCost * 2,
                    swampCost: defaultSwampCost * 2,
                })

                for (const pos of path) {
                    this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, 3)
                    this.roadCoords[packAsNum(pos)] = 1
                }
            },
        })
    }
    private findStorageCoord(structureCoords: Coord[]): [Coord, number] {
        /*
        for (let i = 0; i < structureCoords.length; i++) {
            const coord = structureCoords[i]

            for (const positions of this.sourceHarvestPositions) {
                if (getRange(coord, positions[0]) > 1) continue

                return [coord, i]
            }

            if (getRange(coord, this.centerUpgradePos) > 1) continue

            return [coord, i]
        } */

        return findClosestCoord(this.stampAnchors.fastFiller[0], structureCoords)
    }
    private labs() {
        this.planStamps({
            stampType: 'inputLab',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            dynamicWeight: this.reverseExitFlood,
            /**
             * Ensure we can place all 10 labs where they are in range 2 of the 2 inputs, so can all be utilized for reactions
             */
            conditions: coord1 => {
                const packedNumCoord1 = packAsNum(coord1)
                if (this.byPlannedRoad[packedNumCoord1] !== 1) return false
                if (this.roadCoords[packedNumCoord1] > 0) return false

                let outputLabCoords: Coord[]

                // Record

                const packedAdjCoords1: Set<string> = new Set()
                const range = 2
                for (let x = coord1.x - range; x <= coord1.x + range; x += 1) {
                    for (let y = coord1.y - range; y <= coord1.y + range; y += 1) {
                        const packedCoordNum = packXYAsNum(x, y)
                        if (this.byPlannedRoad[packedCoordNum] !== 1) continue
                        if (this.roadCoords[packedCoordNum] > 0) continue

                        packedAdjCoords1.add(packXYAsCoord(x, y))
                    }
                }

                const packedCoord1 = packCoord(coord1)

                for (const coord2 of findCoordsInRangeXY(coord1.x, coord1.y, range)) {
                    const packedCoord2Num = packAsNum(coord2)
                    if (this.byPlannedRoad[packedCoord2Num] !== 1) continue
                    if (this.roadCoords[packedCoord2Num] > 0) continue

                    const packedCoord2 = packCoord(coord2)
                    if (packedCoord1 === packedCoord2) continue

                    outputLabCoords = []

                    for (const adjCoord2 of findCoordsInRangeXY(coord2.x, coord2.y, range)) {
                        const packedAdjCoord2 = packCoord(adjCoord2)
                        if (packedCoord1 === packedAdjCoord2) continue
                        if (packedCoord2 === packedAdjCoord2) continue
                        if (!packedAdjCoords1.has(packedAdjCoord2)) continue

                        outputLabCoords.push(adjCoord2)
                        if (outputLabCoords.length >= 8) {
                            this.inputLab2Coord = coord2
                            this.outputLabCoords = outputLabCoords
                            return true
                        }
                    }
                }

                return false
            },
            consequence: stampAnchor => {
                this.setBasePlansXY(stampAnchor.x, stampAnchor.y, STRUCTURE_LAB, 6)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255

                this.setBasePlansXY(this.inputLab2Coord.x, this.inputLab2Coord.y, STRUCTURE_LAB, 6)
                this.baseCoords[packAsNum(this.inputLab2Coord)] = 255
                this.roadCoords[packAsNum(this.inputLab2Coord)] = 255

                const goal = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)

                sortBy(
                    this.outputLabCoords,
                    ({ x, y }) =>
                        customFindPath({
                            origin: new RoomPosition(x, y, this.room.name),
                            goals: [
                                {
                                    pos: goal,
                                    range: 3,
                                },
                            ],
                            weightCoordMaps: [this.gridCoords, this.roadCoords],
                            plainCost: defaultRoadPlanningPlainCost,
                        }).length,
                )

                for (const coord of this.outputLabCoords) {
                    this.setBasePlansXY(coord.x, coord.y, STRUCTURE_LAB)
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
            dynamicWeight: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) return false
                if (this.byPlannedRoad[packedCoord] !== 1) return false

                return true
            },
            consequence: stampAnchor => {
                this.setBasePlansXY(stampAnchor.x, stampAnchor.y, STRUCTURE_EXTENSION)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
    private gridExtensionSourcePaths() {
        if (this.sourcePaths) return

        const hubAnchorPos = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)

        for (let i = this.stampAnchors.gridExtension.length - 1; i >= 0; i -= 5) {
            const coord = this.stampAnchors.gridExtension[i]

            const path = customFindPath({
                origin: new RoomPosition(coord.x, coord.y, this.room.name),
                goals: [{ pos: hubAnchorPos, range: 2 }],
                weightCoordMaps: [this.diagonalCoords, this.gridCoords, this.roadCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })

            const minRCL = this.basePlans.getXY(coord.x, coord.y)[0].minRCL

            for (const pos of path) {
                this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, minRCL)
                this.roadCoords[packAsNum(pos)] = 1
            }
        }

        const fastFillerAnchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )
        const sourcePaths: RoomPosition[][] = []

        for (let i = this.communeSources.length - 1; i >= 0; i -= 1) {
            const origin = this.sourceHarvestPositions[i][0]

            const path = customFindPath({
                origin: origin,
                goals: [
                    {
                        pos: fastFillerAnchor,
                        range: 3,
                    },
                ],
                weightCoordMaps: [this.diagonalCoords, this.roadCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })

            for (const pos of path) {
                this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, 3)
                this.roadCoords[packAsNum(pos)] = 1
            }

            sourcePaths.push(path)
        }

        const upgradePath = customFindPath({
            origin: this.centerUpgradePos,
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
            weightCoordMaps: [this.diagonalCoords, this.roadCoords],
            plainCost: defaultRoadPlanningPlainCost * 2,
            swampCost: defaultSwampCost * 2,
        })

        for (const pos of upgradePath) {
            this.roadCoords[packAsNum(pos)] = 1
            this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, 3)
        }

        this.upgradePath = upgradePath
        this.sourcePaths = sourcePaths.reverse()
    }
    private observer() {
        this.planStamps({
            stampType: 'observer',
            count: 1,
            startCoords: [this.stampAnchors.hub[0]],
            dynamic: true,
            weighted: true,
            dynamicWeight: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) return false
                if (this.gridCoords[packedCoord] > 0) return false

                return true
            },
            consequence: stampAnchor => {
                this.setBasePlansXY(stampAnchor.x, stampAnchor.y, STRUCTURE_OBSERVER, 8)
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
            dynamicWeight: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) return false
                if (this.byPlannedRoad[packedCoord] !== 1) return false

                return true
            },
            consequence: stampAnchor => {
                this.setBasePlansXY(stampAnchor.x, stampAnchor.y, STRUCTURE_NUKER, 8)
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
            dynamicWeight: this.reverseExitFlood,
            /**
             * Don't place on a gridCoord and ensure there is a gridCoord adjacent
             */
            conditions: coord => {
                const packedCoord = packAsNum(coord)
                if (this.baseCoords[packedCoord] === 255) return false
                if (this.byPlannedRoad[packedCoord] !== 1) return false

                return true
            },
            consequence: stampAnchor => {
                this.setBasePlansXY(stampAnchor.x, stampAnchor.y, STRUCTURE_POWER_SPAWN, 8)
                this.baseCoords[packAsNum(stampAnchor)] = 255
                this.roadCoords[packAsNum(stampAnchor)] = 255
            },
        })
    }
    private runMinCut() {
        if (this.minCutCoords) return

        const cm = new PathFinder.CostMatrix()
        const terrain = this.room.getTerrain()

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                if (terrain.get(x, y) !== TERRAIN_MASK_WALL) continue

                cm.set(x, y, 255)
            }
        }

        const protectionCoords: Set<number> = new Set()

        // General stamps

        for (const key in this.stampAnchors) {
            const stampType = key as StampTypes
            const stamp = stamps[stampType]

            for (const coord of this.stampAnchors[stampType]) {
                for (const nearbyCoord of findCoordsInRange(coord, stamp.protectionOffset)) {
                    const packedNearbyCoord = packAsNum(nearbyCoord)
                    if (this.terrainCoords[packedNearbyCoord] === 255) continue
                    if (this.byExitCoords[packedNearbyCoord] === 255) continue

                    protectionCoords.add(packedNearbyCoord)
                }
            }
        }

        const hubAnchor = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)
        const fastFillerAnchor = new RoomPosition(
            this.stampAnchors.fastFiller[0].x,
            this.stampAnchors.fastFiller[0].y,
            this.room.name,
        )

        let path = customFindPath({
            origin: hubAnchor,
            goals: [
                {
                    pos: fastFillerAnchor,
                    range: 3,
                },
            ],
            weightCoordMaps: [this.diagonalCoords, this.roadCoords],
            plainCost: defaultRoadPlanningPlainCost * 2,
            swampCost: defaultSwampCost * 2,
        })

        for (const pos of path) {
            for (const adjCoord of findCoordsInRange(pos, 3)) {
                const adjPackedCoord = packAsNum(adjCoord)
                if (this.terrainCoords[adjPackedCoord] > 0) continue
                if (this.byExitCoords[adjPackedCoord] > 0) continue

                protectionCoords.add(adjPackedCoord)
            }
        }

        // Prune protection coords not contigious with fastFiller anchor group

        const startCoords = this.stampAnchors.fastFiller
        const contigiousProtectionCoords: Set<Coord> = new Set()
        let visitedCoords = new Uint8Array(2500)

        for (const coord of startCoords) {
            const packedCoord = packAsNum(coord)
            visitedCoords[packedCoord] = 1
            contigiousProtectionCoords.add(coord)
            cm.set(coord.x, coord.y, 1)
        }

        let thisGeneration = startCoords
        let nextGeneration: Coord[]

        while (thisGeneration.length) {
            nextGeneration = []

            // Iterate through positions of this gen

            for (const coord1 of thisGeneration) {
                // Add viable adjacent coords to the next generation

                for (const offset of adjacentOffsets) {
                    const adjCoord = {
                        x: coord1.x + offset.x,
                        y: coord1.y + offset.y,
                    }
                    const packedAdjCoord = packAsNum(adjCoord)

                    if (visitedCoords[packedAdjCoord] === 1) continue
                    visitedCoords[packedAdjCoord] = 1

                    if (!protectionCoords.has(packedAdjCoord)) continue

                    contigiousProtectionCoords.add(adjCoord)
                    cm.set(adjCoord.x, adjCoord.y, defaultMinCutDepth)
                    nextGeneration.push(adjCoord)
                }
            }

            // Set this gen to next gen

            thisGeneration = nextGeneration
        }

        // Flood from contigious protectionCoords to get depth for distance-weighting

        visitedCoords = new Uint8Array(2500)

        for (const coord of contigiousProtectionCoords) {
            thisGeneration.push(coord)
            visitedCoords[packAsNum(coord)] = 1
        }

        let depth = defaultMinCutDepth + 1

        while (thisGeneration.length) {
            nextGeneration = []

            // Flood all adjacent positions

            if (!nextGeneration.length) {
                // Iterate through positions of this gen

                for (const coord1 of thisGeneration) {
                    // Add viable adjacent coords to the next generation

                    for (const offset of adjacentOffsets) {
                        const adjCoord = {
                            x: coord1.x + offset.x,
                            y: coord1.y + offset.y,
                        }
                        const packedAdjCoord = packAsNum(adjCoord)

                        if (!isXYInRoom(adjCoord.x, adjCoord.y)) continue

                        if (visitedCoords[packedAdjCoord] === 1) continue
                        visitedCoords[packedAdjCoord] = 1

                        if (this.terrainCoords[packedAdjCoord] === 255) continue

                        cm.set(adjCoord.x, adjCoord.y, depth)
                        nextGeneration.push(adjCoord)
                    }
                }
            }

            // Set this gen to next gen

            thisGeneration = nextGeneration
            depth += 1
        }

        //

        const result = minCutToExit(Array.from(contigiousProtectionCoords), cm)
        const minCutCoords: Set<number> = new Set()

        for (const coord of result) {
            const packedCoord = packAsNum(coord)
            this.rampartCoords[packedCoord] = 1

            minCutCoords.add(packedCoord)

            this.stampAnchors.minCutRampart.push(coord)
            /* this.roadCoords[packedCoord] = 1
            this.basePlans.setXY(coord.x, coord.y, STRUCTURE_ROAD, 4) */
            this.setRampartPlansXY(coord.x, coord.y, 4, false, false, false)
        }
        /*
        for (const coord of contigiousProtectionCoords) this.room.coordVisual(coord.x, coord.y)
        for (const packedCoord of minCutCoords) {
            const coord = unpackNumAsCoord(packedCoord)
            this.room.coordVisual(coord.x, coord.y, customColors.green)
        }
 */
        this.minCutCoords = minCutCoords
    }
    private groupMinCutCoords() {
        if (this.groupedMinCutCoords) return

        // Construct a costMatrix to store visited positions

        const visitedCoords = new Uint8Array(2500)

        const groupedMinCutCoords: Coord[][] = []
        let groupIndex = 0

        // Loop through each pos of positions

        for (const packedCoord of this.minCutCoords) {
            const coord = unpackNumAsCoord(packedCoord)

            if (visitedCoords[packAsNum(coord)] === 1) continue
            visitedCoords[packAsNum(coord)] = 1

            groupedMinCutCoords[groupIndex] = [new RoomPosition(coord.x, coord.y, this.room.name)]

            // Construct values for floodFilling

            let thisGeneration = [coord]
            let nextGeneration: Coord[] = []
            let groupSize = 0

            // So long as there are positions in this gen

            while (thisGeneration.length) {
                // Reset next gen

                nextGeneration = []

                // Iterate through positions of this gen

                for (const pos of thisGeneration) {
                    // Loop through adjacent positions

                    for (const adjCoord of findAdjacentCoordsToCoord(pos)) {
                        const packedAdjacentCoord = packAsNum(adjCoord)

                        // Iterate if the adjacent pos has been visited or isn't a tile

                        if (visitedCoords[packedAdjacentCoord] === 1) continue
                        visitedCoords[packedAdjacentCoord] = 1

                        // If a rampart is not planned for this position, iterate

                        if (!this.minCutCoords.has(packedAdjacentCoord)) continue

                        // Add it to the next gen and this group

                        groupedMinCutCoords[groupIndex].push(new RoomPosition(adjCoord.x, adjCoord.y, this.room.name))

                        groupSize += 1
                        nextGeneration.push(adjCoord)
                    }
                }

                if (groupSize >= maxRampartGroupSize) break

                // Set this gen to next gen

                thisGeneration = nextGeneration
            }

            // Config for next group

            groupIndex += 1
        }

        this.groupedMinCutCoords = groupedMinCutCoords
    }
    /**
     * Flood fill from exits, recording coords that aren't procted
     */
    private findUnprotectedCoords() {
        if (this.unprotectedCoords) return

        const unprotectedCoords = new Uint8Array(2500)
        let visitedCoords = new Uint8Array(2500)
        let thisGeneration = this.exitCoords
        let nextGeneration: Coord[]

        for (const coord of thisGeneration) {
            const packedCoord = packAsNum(coord)
            visitedCoords[packedCoord] = 1
            unprotectedCoords[packedCoord] = 255
        }

        while (thisGeneration.length) {
            nextGeneration = []

            // Iterate through positions of this gen

            for (const coord of thisGeneration) {
                // Add viable adjacent coords to the next generation

                for (const offset of adjacentOffsets) {
                    const adjCoord = {
                        x: coord.x + offset.x,
                        y: coord.y + offset.y,
                    }

                    if (!isXYInRoom(adjCoord.x, adjCoord.y)) continue

                    const packedAdjCoord = packAsNum(adjCoord)

                    if (visitedCoords[packedAdjCoord] === 1) continue
                    visitedCoords[packedAdjCoord] = 1

                    // We have hit a barrier

                    if (this.terrainCoords[packedAdjCoord] === 255) continue
                    if (this.minCutCoords.has(packedAdjCoord)) continue

                    unprotectedCoords[packedAdjCoord] = 255
                    nextGeneration.push(adjCoord)

                    for (const adjCoord2 of findCoordsInRange(adjCoord, 3)) {
                        const packedAdjCoord2 = packAsNum(adjCoord2)
                        if (this.terrainCoords[packedAdjCoord2] > 0) continue
                        if (this.minCutCoords.has(packedAdjCoord2)) continue

                        const currentWeight = unprotectedCoords[packedAdjCoord2]

                        if (this.roadCoords[packedAdjCoord2] === 1) {
                            unprotectedCoords[packedAdjCoord2] = Math.max(unprotectedCoordWeight * 0.5, currentWeight)
                            continue
                        }

                        unprotectedCoords[packedAdjCoord2] = Math.max(unprotectedCoordWeight, currentWeight)
                    }
                }
            }

            // Set up for next generation

            thisGeneration = nextGeneration
        }

        const addedMinCutRamparts: Coord[] = []

        // Weight coords near ramparts that could be ranged attacked

        for (const packedCoord of this.minCutCoords) {
            const coord = unpackNumAsCoord(packedCoord)

            forCoordsInRange(coord, 2, adjCoord => {
                const packedAdjCoord = packAsNum(adjCoord)
                if (this.terrainCoords[packedAdjCoord] > 0) return
                if (unprotectedCoords[packedAdjCoord] === 255) return

                if (!this.minCutCoords.has(packedAdjCoord) && getRange(coord, adjCoord) === 1) {
                    this.setRampartPlansXY(adjCoord.x, adjCoord.y, 4, false, false, true)
                    this.rampartCoords[packedAdjCoord] = 1

                    addedMinCutRamparts.push(adjCoord)
                }

                if (this.roadCoords[packedAdjCoord] === 1) {
                    unprotectedCoords[packedAdjCoord] = unprotectedCoordWeight * 0.5
                    return
                }

                unprotectedCoords[packedAdjCoord] = unprotectedCoordWeight
            })
        }

        this.stampAnchors.minCutRampart = this.stampAnchors.minCutRampart.concat(addedMinCutRamparts)
        this.unprotectedCoords = unprotectedCoords
    }
    private onboardingRamparts() {
        if (this.stampAnchors.onboardingRampart.length) return

        const onboardingCoords: Set<number> = new Set()
        const hubAnchorPos = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)

        for (const group of this.groupedMinCutCoords) {
            const [closestCoord] = findClosestCoord(hubAnchorPos, group)

            // Path from the hubAnchor to the cloestPosToAnchor

            const path = customFindPath({
                origin: new RoomPosition(closestCoord.x, closestCoord.y, this.room.name),
                goals: [{ pos: hubAnchorPos, range: 2 }],
                weightCoordMaps: [this.diagonalCoords, this.roadCoords, this.unprotectedCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })

            // Construct the onboardingIndex

            let onboardingIndex = 0
            let onboardingCount = 0
            let forThreat = false

            // So long as there is a pos in path with an index of onboardingIndex

            while (path[onboardingIndex]) {
                // Get the pos in path with an index of onboardingIndex

                const coord = path[onboardingIndex]
                const packedCoord = packAsNum(coord)

                onboardingIndex += 1

                // If there are already rampart plans at this pos

                if (this.minCutCoords.has(packedCoord) && !onboardingCoords.has(packedCoord)) continue

                // Record the coord

                /* this.roadCoords[packedCoord] = 1
                this.basePlans.setXY(coord.x, coord.y, STRUCTURE_ROAD, 4) */
                onboardingCoords.add(packedCoord)
                this.rampartCoords[packedCoord] = 1

                this.setRampartPlansXY(coord.x, coord.y, 4, false, false, forThreat)

                onboardingCount += 1
                if (forThreat) break
                if (onboardingCount === minOnboardingRamparts) forThreat = true
            }

            for (let i = Math.max(onboardingIndex - 1, 0); i < path.length; i++) {
                const pos = path[i]

                this.roadCoords[packAsNum(pos)] = 1
                this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, 4)
            }
        }

        this.stampAnchors.onboardingRampart = Array.from(onboardingCoords).map(packedCoord =>
            unpackNumAsCoord(packedCoord),
        )
    }
    private findOutsideMinCut() {
        if (this.outsideMinCut) return

        const outsideMinCut: Set<number> = new Set()

        const visitedCoords = new Uint8Array(2500)
        let thisGeneration = this.minCutCoords
        for (const packedCoord of thisGeneration) {
            visitedCoords[packedCoord] = 1
        }

        let nextGeneration: Set<number>
        let depth = 0

        while (thisGeneration.size) {
            nextGeneration = new Set()

            for (const packedCoord of thisGeneration) {
                const coord = unpackNumAsCoord(packedCoord)
                forAdjacentCoords(coord, adjCoord => {
                    const packedAdjCoord = packAsNum(adjCoord)

                    if (visitedCoords[packedAdjCoord] === 1) return
                    visitedCoords[packedAdjCoord] = 1

                    if (this.unprotectedCoords[packedAdjCoord] !== 255) return

                    outsideMinCut.add(packedAdjCoord)
                    nextGeneration.add(packedAdjCoord)
                })
            }

            depth += 1
            if (depth >= 4) break

            thisGeneration = nextGeneration
            depth += 1
        }

        this.outsideMinCut = outsideMinCut
    }
    private findInsideMinCut() {
        if (this.insideMinCut) return

        const insideMinCut: Set<number> = new Set()
        /*
        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.roadCoords[packedCoord] !== 0) continue
                if (this.rampartCoords[packedCoord] === 1) continue
                if (this.unprotectedCoords[packedCoord] === 255) continue

                insideMinCut.add(packedCoord)
            }
        }
 */

        const visitedCoords = new Uint8Array(2500)
        let thisGeneration = this.minCutCoords
        for (const packedCoord of thisGeneration) {
            visitedCoords[packedCoord] = 1
        }
        let nextGeneration: Set<number>
        let depth = 0

        while (thisGeneration.size) {
            nextGeneration = new Set()

            for (const packedCoord of thisGeneration) {
                const coord = unpackNumAsCoord(packedCoord)
                forAdjacentCoords(coord, adjCoord => {
                    const packedAdjCoord = packAsNum(adjCoord)

                    if (visitedCoords[packedAdjCoord] === 1) return
                    visitedCoords[packedAdjCoord] = 1

                    if (this.roadCoords[packedAdjCoord] > 0) return
                    if (this.unprotectedCoords[packedAdjCoord] === 255) return

                    nextGeneration.add(packedAdjCoord)

                    if (this.rampartCoords[packedAdjCoord] === 1) return
                    insideMinCut.add(packedAdjCoord)
                })
            }

            depth += 1
            if (depth >= 5) break

            thisGeneration = nextGeneration
        }

        this.insideMinCut = insideMinCut
    }
    /**
     * Sort of genetic algorithm to find best tower placement combination
     */
    private towers() {
        if (this.stampAnchors.tower.length) return

        if (this.bestTowerScore === undefined) {
            this.bestTowerScore = 0
            this.bestTowerCoords = []
            this.towerAttemptIndex = 0
        }

        for (; this.towerAttemptIndex < 1000; this.towerAttemptIndex++) {
            const towerOptions = Array.from(this.insideMinCut)
            const towerCoords: TowerDamageCoord[] = []
            const damageMap = new Uint32Array(roomDimensions * roomDimensions)

            for (let towers = 0; towers < CONTROLLER_STRUCTURES.tower[8]; towers++) {
                const index = randomIntRange(0, towerOptions.length)
                const packedCoord = towerOptions[index]
                towerOptions.splice(index, 1)

                const coord = unpackNumAsCoord(packedCoord) as TowerDamageCoord
                let minIndividualDamage = Infinity

                for (const packedCoord of this.outsideMinCut) {
                    const damage = estimateTowerDamage(coord, unpackNumAsCoord(packedCoord))
                    damageMap[packedCoord] += damage

                    if (damage >= minIndividualDamage) continue
                    minIndividualDamage = damage
                }

                coord.minDamage = minIndividualDamage
                towerCoords.push(coord)
            }

            let minDamage = Infinity

            for (let x = 0; x < roomDimensions; x++) {
                for (let y = 0; y < roomDimensions; y++) {
                    const damage = damageMap[packXYAsNum(x, y)]
                    if (damage === 0 || damage >= minDamage) continue

                    minDamage = damage
                }
            }

            if (minDamage <= this.bestTowerScore) continue

            this.bestTowerScore = minDamage = minDamage
            this.bestTowerCoords = towerCoords
        }

        // Make sure we plan and path for the best towers first

        this.bestTowerCoords.sort((a, b) => a.minDamage - b.minDamage).reverse()

        for (const coord of this.bestTowerCoords) {
            this.setBasePlansXY(coord.x, coord.y, STRUCTURE_TOWER)

            const packedCoord = packXYAsNum(coord.x, coord.y)
            this.baseCoords[packedCoord] = 255
            this.roadCoords[packedCoord] = 255
        }

        this.stampAnchors.tower = this.bestTowerCoords
    }
    private towerPaths() {
        if (this.finishedTowerPaths) return

        const hubAnchorPos = new RoomPosition(this.stampAnchors.hub[0].x, this.stampAnchors.hub[0].y, this.room.name)

        for (const coord of this.bestTowerCoords) {
            const minRCL = this.basePlans.getXY(coord.x, coord.y)[0].minRCL

            const path = customFindPath({
                origin: new RoomPosition(coord.x, coord.y, this.room.name),
                goals: [
                    {
                        pos: hubAnchorPos,
                        range: 2,
                    },
                ],
                weightCoordMaps: [this.diagonalCoords, this.roadCoords, this.unprotectedCoords],
                plainCost: defaultRoadPlanningPlainCost * 2,
                swampCost: defaultSwampCost * 2,
            })

            for (const pos of path) {
                this.setBasePlansXY(pos.x, pos.y, STRUCTURE_ROAD, minRCL)
                this.roadCoords[packAsNum(pos)] = 1
            }
        }

        this.finishedTowerPaths = true
    }
    private protectFromNuke(coord: Coord, minRCL: number) {}
    private shield(coord: Coord, minRCL: number, coversStructure: boolean = true) {
        const packedCoord = packAsNum(coord)
        if (this.unprotectedCoords[packedCoord] === 0) return

        this.setRampartPlansXY(coord.x, coord.y, 4, coversStructure, false, false)
        this.stampAnchors.shieldRampart.push(coord)
        this.rampartCoords[packedCoord] = 1
        this.unprotectedCoords[packedCoord] = 0
    }
    private generalShield() {
        if (this.generalShielded) return

        let unprotectedSources = 0

        // Protect source structures and best harvest pos

        for (const coord of this.stampAnchors.sourceExtension) this.shield(coord, 4)
        for (const coord of this.stampAnchors.sourceLink) this.shield(coord, 4)
        for (const sourceIndex in this.sourceHarvestPositions) {
            if (this.unprotectedCoords[packAsNum(this.sourceHarvestPositions[sourceIndex][0])] === 255) {
                unprotectedSources += 1
            }
            this.shield(this.sourceHarvestPositions[sourceIndex][0], 4, false)
        }

        // Protect position of

        this.shield(this.centerUpgradePos, 4)

        // Protect around the controller

        forAdjacentCoords(this.room.controller.pos, adjCoord => {
            if (this.unprotectedCoords[packAsNum(adjCoord)] !== 255) return
            this.isControllerProtected = false

            this.shield(adjCoord, 4, false)
        })

        // Protect important structures

        for (const packedCoord in this.basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const packedNumCoord = packAsNum(coord)
            const coordData = this.basePlans.map[packedCoord]

            for (const data of coordData) {
                if (!structureTypesToProtectSet.has(data.structureType)) continue
                if (this.rampartPlans.getXY(coord.x, coord.y)) continue

                const isProtected = this.unprotectedCoords[packedNumCoord] === 0
                this.setRampartPlansXY(coord.x, coord.y, data.minRCL, true, isProtected, false)

                this.stampAnchors.shieldRampart.push(coord)
                this.rampartCoords[packedNumCoord] = 1
                this.unprotectedCoords[packedNumCoord] = 0
            }
        }

        this.unprotectedSources = unprotectedSources
        this.generalShielded = true
    }
    private findScore() {
        if (this.score) return

        let score = 0
        score += this.room.findSwampPlainsRatio() * 10
        score += this.sourcePaths.length

        // Prefer protecting the source even more if there is only one

        score += this.unprotectedSources * (30 / this.sourcePaths.length)

        // Early RCL we want to have 3 or more harvest positions

        for (const positions of this.sourceHarvestPositions) {
            if (positions.length >= 3) continue
            score += (3 - positions.length) * 5
        }
        score += this.upgradePath.length
        score += this.mineralPath.length / 100
        score +=
            this.stampAnchors.minCutRampart.length * 2 +
            this.stampAnchors.shieldRampart.length +
            this.stampAnchors.onboardingRampart.length
        score += getRange(this.stampAnchors.hub[0], this.centerUpgradePos) / 10
        if (!this.isControllerProtected) score += 15
        score += (CONTROLLER_STRUCTURES.tower[8] * TOWER_POWER_ATTACK - this.bestTowerScore) / 100
        score += this.RCLPlannedStructureTypes[STRUCTURE_ROAD].structures / 100

        // We want more exits

        score += 6 * 4
        for (const key in Game.map.describeExits(this.room.name)) {
            score -= 6
        }

        this.score = Math.round(score)
    }
    private record() {
        this.recording = true

        this.planAttempts.push({
            score: this.score,
            stampAnchors: packStampAnchors(this.stampAnchors),
            basePlans: this.basePlans.pack(),
            rampartPlans: this.rampartPlans.pack(),
            communeSources: this.communeSources.map(source => source.id),
            sourceHarvestPositions: this.sourceHarvestPositions.map(positions => packPosList(positions)),
            sourcePaths: this.sourcePaths.map(path => packPosList(path)),
            mineralHarvestPositions: packPosList(this.mineralHarvestPositions),
            mineralPath: packPosList(this.mineralPath),
            centerUpgradePos: packPos(this.centerUpgradePos),
            upgradePath: packPosList(this.upgradePath),
        })

        // Delete plan-specific properties

        delete this.basePlans
        delete this.rampartPlans
        delete this.baseCoords
        delete this.roadCoords
        delete this.rampartCoords
        delete this.byExitCoords
        delete this.exitCoords
        delete this.weightedDiagonalCoords
        delete this.diagonalCoords
        delete this.gridCoords
        delete this.byPlannedRoad
        delete this.protectCoords
        delete this.protectedCoords
        delete this.unprotectedCoords
        delete this.minCutCoords
        delete this.groupedMinCutCoords
        delete this.insideMinCut
        delete this.outsideMinCut
        delete this.bestTowerScore
        delete this.bestTowerCoords
        delete this.towerAttemptIndex
        delete this.RCLPlannedStructureTypes

        delete this.plannedGridCoords
        delete this.finishedGrid
        delete this.generalShielded
        delete this.finishedFastFillerRoadPrune
        delete this.markSourcesAvoid
        delete this.finishedTowerPaths

        delete this.sourceHarvestPositions
        delete this.sourcePaths
        delete this.sourceStructureCoords
        delete this.communeSources
        delete this.mineralHarvestPositions
        delete this.mineralPath
        delete this.centerUpgradePos
        delete this.upgradePath
        delete this.inputLab2Coord
        delete this.outputLabCoords
        delete this.unprotectedSources
        delete this.isControllerProtected

        this.recording = false
    }
    /**
     * Find the plan with the lowest score
     */
    private findBestPlanIndex() {
        let bestScore = Infinity
        let bestPlanIndex: number | undefined

        for (let i = 0; i < this.planAttempts.length; i++) {
            const plan = this.planAttempts[i]

            if (plan.score >= bestScore) continue

            bestScore = plan.score
            bestPlanIndex = i
        }

        return bestPlanIndex
    }
    private choosePlan() {
        const plan = this.planAttempts[this.findBestPlanIndex()]
        const roomMemory = Memory.rooms[this.room.name]

        roomMemory[RoomMemoryKeys.score] = plan.score
        roomMemory[RoomMemoryKeys.basePlans] = plan.basePlans
        roomMemory[RoomMemoryKeys.rampartPlans] = plan.rampartPlans
        roomMemory[RoomMemoryKeys.stampAnchors] = plan.stampAnchors
        roomMemory[RoomMemoryKeys.communeSources] = plan.communeSources
        roomMemory[RoomMemoryKeys.communeSourceHarvestPositions] = plan.sourceHarvestPositions
        roomMemory[RoomMemoryKeys.communeSourcePaths] = plan.sourcePaths
        roomMemory[RoomMemoryKeys.mineralPositions] = plan.mineralHarvestPositions
        roomMemory[RoomMemoryKeys.mineralPath] = plan.mineralPath
        roomMemory[RoomMemoryKeys.centerUpgradePos] = plan.centerUpgradePos
        roomMemory[RoomMemoryKeys.upgradePath] = plan.upgradePath
        roomMemory[RoomMemoryKeys.communePlanned] = true
    }
    private visualizeGrid() {
        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                const packedCoord = packXYAsNum(x, y)
                if (this.baseCoords[packedCoord] === 255) continue
                if (this.gridCoords[packedCoord] === 0) continue

                this.room.visual.structure(x, y, STRUCTURE_ROAD)
            }
        }
    }
    private visualizeBestPlan() {
        this.visualizePlan(this.findBestPlanIndex())
    }
    private visualizePlans() {
        if (this.planVisualizeIndex === undefined) this.planVisualizeIndex = 0
        else {
            if (this.planVisualizeIndex >= this.planAttempts.length - 1) this.planVisualizeIndex = 0
            else this.planVisualizeIndex += 1
        }

        this.visualizePlan(this.planVisualizeIndex)
    }
    private visualizePlan(planIndex: number) {
        const plan = this.planAttempts[planIndex]
        const basePlans = BasePlans.unpack(plan.basePlans)

        for (const packedCoord in basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = basePlans.map[packedCoord]

            for (const data of coordData) {
                if (data.structureType !== STRUCTURE_ROAD) continue

                this.room.visual.structure(coord.x, coord.y, data.structureType)
            }
        }

        this.room.visual.connectRoads({
            opacity: 1,
        })

        for (const packedCoord in basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = basePlans.map[packedCoord]

            for (const data of coordData) {
                if (data.structureType === STRUCTURE_ROAD) {
                    this.room.visual.text(data.minRCL.toString(), coord.x, coord.y)
                    continue
                }

                this.room.visual.structure(coord.x, coord.y, data.structureType)
                this.room.visual.text(data.minRCL.toString(), coord.x, coord.y)
            }
        }

        const rampartPlans = RampartPlans.unpack(plan.rampartPlans)

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)

            if (rampartPlans.get(packedCoord).buildForNuke) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }

            if (rampartPlans.get(packedCoord).buildForThreat) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }
            this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.5 })
        }

        const fastFillerStartCoord = this.fastFillerStartCoords[planIndex]
        this.room.coordVisual(fastFillerStartCoord.x, fastFillerStartCoord.y, customColors.yellow)

        const stampAnchors = unpackStampAnchors(plan.stampAnchors)

        this.room.visual.text('Attempt: ' + (planIndex + 1), stampAnchors.fastFiller[0].x, stampAnchors.fastFiller[0].y)
    }
    private visualizeCurrentPlan() {
        for (const packedCoord in this.basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = this.basePlans.map[packedCoord]

            for (const data of coordData) {
                if (data.structureType !== STRUCTURE_ROAD) continue

                this.room.visual.structure(coord.x, coord.y, data.structureType)
            }
        }

        this.room.visual.connectRoads({
            opacity: 1,
        })

        for (const packedCoord in this.basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = this.basePlans.map[packedCoord]

            for (const data of coordData) {
                if (data.structureType === STRUCTURE_ROAD) {
                    this.room.visual.text(data.minRCL.toString(), coord.x, coord.y)
                    continue
                }

                this.room.visual.structure(coord.x, coord.y, data.structureType)
                this.room.visual.text(data.minRCL.toString(), coord.x, coord.y)
            }
        }

        for (const packedCoord in this.rampartPlans.map) {
            const coord = unpackCoord(packedCoord)

            if (this.rampartPlans.get(packedCoord).buildForThreat) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }
            this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.5 })
        }

        // Labs

        /*
        this.room.coordVisual(this.stampAnchors.labs[0].x, this.stampAnchors.labs[0].y, customColors.orange)
        this.room.coordVisual(this.inputLab2Coord.x, this.inputLab2Coord.y, customColors.orange)

        for (const coord of this.outputLabCoords) {
            this.room.visual.line(coord.x, coord.y, this.stampAnchors.labs[0].x, this.stampAnchors.labs[0].y)
            this.room.visual.line(coord.x, coord.y, this.inputLab2Coord.x, this.inputLab2Coord.y)
        }
        */
        /* this.room.visualizeCoordMap(this.reverseExitFlood) */
        /* this.room.visualizeCoordMap(this.byPlannedRoad, true, 100) */
        /* this.room.visualizeCoordMap(this.terrainCoords, true) */
    }
}
