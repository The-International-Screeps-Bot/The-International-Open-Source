import {
    Result,
    RoomMemoryKeys,
    RoomTypes,
    defaultSwampCost,
    dynamicScoreRoomRange,
    maxControllerLevel,
    preferredCommuneRange,
    remoteRoles,
    roomDimensions,
    roomTypeProperties,
    roomTypes,
} from 'international/constants'
import { collectiveManager } from 'international/collective'
import {
    advancedFindDistance,
    findAdjacentCoordsToCoord,
    forAdjacentCoords,
    forRoomNamesAroundRangeXY,
    getRange,
    makeRoomCoord,
    packAsNum,
    packXYAsNum,
    roomNameFromRoomXY,
} from 'utils/utils'
import { unpackPosAt } from 'other/codec'
import { CommuneManager } from './commune/commune'
import { customLog } from 'utils/logging'

/**
 * considers a position being flooded
 * @returns Wether or not the position should be flooded next generation
 */
type FloodForCoordCheck = (
    coord: Coord,
    packedCoord: number,
    generation?: number,
) => boolean | Result.stop

export const roomNameUtils = {
    abandonRemote(roomName: string, time: number) {
        const roomMemory = Memory.rooms[roomName]

        if (roomMemory[RoomMemoryKeys.abandonRemote] >= time) return

        roomMemory[RoomMemoryKeys.abandonRemote] = time
        delete roomMemory[RoomMemoryKeys.recursedAbandonment]
    },
    findDynamicScore(roomName: string) {
        let dynamicScore = 0

        let closestEnemy = 0
        let communeScore = 0
        let allyScore = 0

        const roomCoord = makeRoomCoord(roomName)
        forRoomNamesAroundRangeXY(roomCoord.x, roomCoord.y, dynamicScoreRoomRange, (x, y) => {
            const searchRoomName = roomNameFromRoomXY(x, y)
            const searchRoomMemory = Memory.rooms[searchRoomName]
            if (!searchRoomMemory) return

            if (searchRoomMemory[RoomMemoryKeys.type] === RoomTypes.enemy) {
                const score = advancedFindDistance(roomName, searchRoomName)
                if (score <= closestEnemy) return

                closestEnemy = score
                return
            }

            if (searchRoomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
                const searchRoom = Game.rooms[searchRoomName]
                if (!searchRoom) return

                const score =
                    Math.pow(
                        Math.abs(
                            advancedFindDistance(roomName, searchRoomName) - preferredCommuneRange,
                        ),
                        1.8,
                    ) +
                    (maxControllerLevel - searchRoom.controller.level)
                if (score <= communeScore) return

                communeScore = score
                return
            }

            if (searchRoomMemory[RoomMemoryKeys.type] === RoomTypes.ally) {
                const score =
                    Math.pow(
                        Math.abs(
                            advancedFindDistance(roomName, searchRoomName) - preferredCommuneRange,
                        ),
                        1.5,
                    ) +
                    (searchRoomMemory[RoomMemoryKeys.RCL] || 0) * 0.3
                if (score <= allyScore) return

                allyScore = score
                return
            }
        })

        dynamicScore += Math.round(Math.pow(closestEnemy, -0.8) * 25)
        dynamicScore += Math.round(communeScore * 50)
        dynamicScore += allyScore

        // Prefer minerals with below average communes

        const roomMemory = Memory.rooms[roomName]
        const mineralType = roomMemory[RoomMemoryKeys.mineralType]
        const mineralScore =
            collectiveManager.mineralNodes[mineralType] - collectiveManager.avgCommunesPerMineral
        dynamicScore += mineralScore * 40

        roomMemory[RoomMemoryKeys.dynamicScore] = dynamicScore
        roomMemory[RoomMemoryKeys.dynamicScoreUpdate] = Game.time

        return dynamicScore
    },
    floodFillFor(roomName: string, seeds: Coord[], coordCheck: FloodForCoordCheck) {
        const visitedCoords = new Uint8Array(2500)

        let depth = 0
        let thisGeneration = seeds
        let nextGeneration: Coord[] = []

        // Record seeds as visited
        for (const coord of seeds) visitedCoords[packAsNum(coord)] = 1

        while (thisGeneration.length) {
            // Reset next gen
            nextGeneration = []

            for (const coord of thisGeneration) {
                // Try to flood to adjacent coords
                for (const adjacentCoord of findAdjacentCoordsToCoord(coord)) {
                    const packedAdjacentCoord = packAsNum(adjacentCoord)
                    // Make sure we haven't visited this coord before
                    if (visitedCoords[packedAdjacentCoord]) continue

                    visitedCoords[packedAdjacentCoord] = 1

                    // Custom check for the coord
                    const checkResult = coordCheck(adjacentCoord, packedAdjacentCoord, depth)
                    if (checkResult === Result.stop) return adjacentCoord
                    if (!checkResult) continue

                    nextGeneration.push(adjacentCoord)
                }
            }

            // Set this gen to next gen
            thisGeneration = nextGeneration
            depth += 1
        }

        return false
    },
    floodFillCardinalFor() {},
    isSourceSpawningStructure(roomName: string, structure: StructureExtension | StructureSpawn) {
        const packedSourceHarvestPositions =
            Memory.rooms[roomName][RoomMemoryKeys.communeSourceHarvestPositions]
        for (const i in packedSourceHarvestPositions) {
            const closestHarvestPos = unpackPosAt(packedSourceHarvestPositions[i], 0)

            if (getRange(structure.pos, closestHarvestPos) <= 1) return true
        }

        return false
    },
    /**
     * Removes roomType-based values in the room's memory that don't match its type
     */
    cleanMemory(roomName: string) {
        const roomMemory = Memory.rooms[roomName]
        for (const key in roomMemory) {
            // Make sure key is a type-specific key
            if (!roomTypeProperties.has(key as unknown as keyof RoomMemory)) continue

            // Make sure key is related to the roomType
            if (roomTypes[roomMemory[RoomMemoryKeys.type]].has(key as unknown as keyof RoomMemory))
                continue

            delete roomMemory[key as unknown as keyof RoomMemory]
        }
    },
    /**
     * Finds the name of the closest commune, exluding the specified roomName
     */
    findClosestCommuneName(roomName: string) {
        const communesNotThis = []

        for (const communeName of collectiveManager.communes) {
            if (roomName == communeName) continue

            communesNotThis.push(communeName)
        }

        return communesNotThis.sort(
            (a, b) =>
                Game.map.getRoomLinearDistance(roomName, a) -
                Game.map.getRoomLinearDistance(roomName, b),
        )[0]
    },
    findClosestClaimType(roomName: string) {
        return Array.from(collectiveManager.communes).sort(
            (a, b) =>
                Game.map.getRoomLinearDistance(roomName, a) -
                Game.map.getRoomLinearDistance(roomName, b),
        )[0]
    },
    updateCreepsOfRemoteName(remoteName: string, communeManager: CommuneManager) {

        const remoteMemory = Memory.rooms[remoteName]

        communeManager.room.creepsOfRemote[remoteName] = {}
        for (const role of remoteRoles) {
            communeManager.room.creepsOfRemote[remoteName][role] = []
        }

        communeManager.remoteSourceHarvesters[remoteName] = []
        for (const index in remoteMemory[RoomMemoryKeys.remoteSources]) {
            communeManager.remoteSourceHarvesters[remoteName].push([])
        }
    },
    diagonalCoords(roomName: string, commune: Room) {

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('no anchor for room: ' + roomName)

        const diagonalCoords = new Uint8Array(2500)
        const terrain = Game.map.getRoomTerrain(roomName)

        for (let x = 0; x < roomDimensions; x++) {
            for (let y = 0; y < roomDimensions; y++) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue

                // Calculate the position of the cell relative to the anchor

                const relX = x - anchor.x
                const relY = y - anchor.y

                // Check if the cell is part of a diagonal line
                if (Math.abs(relX - 3 * relY) % 2 !== 0 && Math.abs(relX + 3 * relY) % 2 !== 0)
                    continue

                const packedCoord = packXYAsNum(x, y)

                if (terrain.get(x, y) === TERRAIN_MASK_SWAMP) {
                    diagonalCoords[packedCoord] = 3 * defaultSwampCost
                    continue
                }
                diagonalCoords[packedCoord] = 4
            }
        }

        return diagonalCoords
    }
}
