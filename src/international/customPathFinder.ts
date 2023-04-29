import { BasePlans } from 'room/construction/basePlans'
import {
    CreepMemoryKeys,
    RoomMemoryKeys,
    RoomTypes,
    customColors,
    defaultPlainCost,
    defaultSwampCost,
    impassibleStructureTypes,
    roomDimensions,
} from './constants'
import { packCoord, unpackCoord, unpackPosList } from 'other/codec'
import { customLog, unpackNumAsCoord } from './utils'

export function customFindPath(args: CustomPathFinderArgs) {
    const allowedRoomNames = new Set([args.origin.roomName])

    generateRoute(args, allowedRoomNames)
    weightStructurePlans(args, allowedRoomNames)
    return generatePath(args, allowedRoomNames)
}

function generateRoute(args: CustomPathFinderArgs, allowedRoomNames: Set<string>) {
    /**
     * Room names for goals that have already been searched and thus don't require another one
     */
    const searchedGoalRoomNames: Set<string> = new Set()

    for (const goal of args.goals) {
        // If the goal is in the same room as the origin

        if (args.origin.roomName === goal.pos.roomName) continue

        if (searchedGoalRoomNames.has(goal.pos.roomName)) continue
        searchedGoalRoomNames.add(goal.pos.roomName)

        function weightRoom(roomName: string) {
            const roomMemory = Memory.rooms[roomName]
            if (!roomMemory) {
                if (roomName === goal.pos.roomName) return 1
                return Infinity
            }
            if (
                args.avoidAbandonedRemotes &&
                roomMemory[RoomMemoryKeys.type] === RoomTypes.remote &&
                roomMemory[RoomMemoryKeys.abandon]
            )
                return Infinity

            // If the goal is in the room

            if (roomName === goal.pos.roomName) return 1

            // If the type is in typeWeights, inform the weight for the type

            if (args.typeWeights && args.typeWeights[roomMemory[RoomMemoryKeys.type]])
                return args.typeWeights[roomMemory[RoomMemoryKeys.type]]

            return 1
        }

        // Construct route by searching through rooms

        const route = Game.map.findRoute(args.origin.roomName, goal.pos.roomName, {
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

function weightStructurePlans(args: CustomPathFinderArgs, allowedRoomNames: Set<string>) {
    if (!args.weightStructurePlans) return

    if (!args.weightCoords) args.weightCoords = {}

    for (const roomName of allowedRoomNames) {
        if (!args.weightCoords[roomName]) args.weightCoords[roomName] = {}
    }

    for (const roomName of allowedRoomNames) {
        const roomMemory = Memory.rooms[roomName]

        if (roomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
            // Weight structures

            const basePlans = BasePlans.unpack(roomMemory[RoomMemoryKeys.basePlans])

            for (const packedCoord in basePlans.map) {
                const coordData = basePlans.map[packedCoord]

                for (const data of coordData) {
                    const weight = data.structureType === STRUCTURE_ROAD ? 1 : 255

                    const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                    args.weightCoords[roomName][packedCoord] = Math.max(weight, currentWeight)
                }
            }

            const weightRoom = Game.rooms[roomName]
            if (weightRoom) {
                // Weight potential and actual stationary positions

                for (const index in weightRoom.find(FIND_SOURCES)) {
                    // Loop through each position of harvestPositions, have creeps prefer to avoid

                    for (const pos of weightRoom.roomManager.sourceHarvestPositions[index]) {
                        const packedCoord = packCoord(pos)

                        const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                        args.weightCoords[roomName][packedCoord] = Math.max(20, currentWeight)
                    }
                }

                if (weightRoom.roomManager.anchor) {
                    // The last upgrade position should be the deliver pos, which we want to weight normal

                    for (const pos of weightRoom.roomManager.upgradePositions) {
                        const packedCoord = packCoord(pos)

                        const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                        args.weightCoords[roomName][packedCoord] = Math.max(20, currentWeight)
                    }

                    for (const pos of weightRoom.roomManager.mineralHarvestPositions) {
                        const packedCoord = packCoord(pos)

                        const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                        args.weightCoords[roomName][packedCoord] = Math.max(20, currentWeight)
                    }

                    const stampAnchors = weightRoom.roomManager.stampAnchors
                    if (stampAnchors) {
                        const packedCoord = packCoord(stampAnchors.hub[0])

                        const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                        args.weightCoords[roomName][packedCoord] = Math.max(20, currentWeight)
                    }

                    // Loop through each position of fastFillerPositions, have creeps prefer to avoid

                    for (const pos of weightRoom.fastFillerPositions) {
                        const packedCoord = packCoord(pos)

                        const currentWeight = args.weightCoords[roomName][packedCoord] || 0
                        args.weightCoords[roomName][packedCoord] = Math.max(20, currentWeight)
                    }
                }
            }
        } else if (roomMemory[RoomMemoryKeys.type] === RoomTypes.remote) {
            for (const packedPath of roomMemory[RoomMemoryKeys.remoteSourcePaths]) {
                const path = unpackPosList(packedPath)

                for (const pos of path) {
                    if (!args.weightCoords[pos.roomName]) args.weightCoords[pos.roomName] = {}
                    args.weightCoords[pos.roomName][packCoord(pos)] = 1
                }
            }
        }
    }
}

function generatePath(args: CustomPathFinderArgs, allowedRoomNames: Set<string>) {
    args.plainCost = args.plainCost || defaultPlainCost
    args.swampCost = args.swampCost || defaultSwampCost

    const originRoom: undefined | Room = Game.rooms[args.origin.roomName]
    const maxRooms = args.maxRooms ? Math.min(allowedRoomNames.size, args.maxRooms) : allowedRoomNames.size
    const pathFinderResult = PathFinder.search(args.origin, args.goals, {
        plainCost: args.plainCost,
        swampCost: args.swampCost,
        maxRooms,
        maxOps: Math.min(100000, (1 + maxRooms) * 500),
        heuristicWeight: 1,
        flee: args.flee,

        // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

        roomCallback(roomName) {
            // If the room is not allowed

            if (!allowedRoomNames.has(roomName)) return false

            /* const roomMemory = Memory.rooms[roomName] */

            const room = Game.rooms[roomName]
            const cm =
                room && args.weightCostMatrix
                    ? (room[args.weightCostMatrix as keyof Room] as CostMatrix)
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

            if (args.weightCostMatrix) return cm

            // Weight positions

            if (args.weightCoords && args.weightCoords[roomName]) {
                for (const packedCoord in args.weightCoords[roomName]) {
                    const coord = unpackCoord(packedCoord)

                    cm.set(coord.x, coord.y, args.weightCoords[roomName][packedCoord])
                }
            }

            // Weight coord maps

            if (args.weightCoordMaps) {
                for (const coordMap of args.weightCoordMaps) {
                    for (const index in coordMap) {
                        const packedCoord = parseInt(index)

                        if (coordMap[packedCoord] === 0) continue

                        const coord = unpackNumAsCoord(packedCoord)
                        if (cm.get(coord.x, coord.y) === 255) continue

                        cm.set(coord.x, coord.y, coordMap[packedCoord])
                    }
                }
            }

            // If we have no vision in the room

            if (!room) return cm

            // The pather is a creep, it isn't in a quad, and it hasn't already weighted roads

            if (
                args.creep &&
                (!args.creep.memory[CreepMemoryKeys.squadMembers] ||
                    args.creep.memory[CreepMemoryKeys.squadMembers].length < 3) &&
                (!args.weightStructures || !args.weightStructures.road)
            ) {
                let roadCost = 1
                if (!args.creep.memory[CreepMemoryKeys.preferRoads]) roadCost = args.plainCost

                for (const road of room.roomManager.structures.road) cm.set(road.pos.x, road.pos.y, roadCost)
            }

            // If avoidStationaryPositions is requested

            if (args.avoidStationaryPositions) {
                for (const packedCoord of room.usedSourceHarvestCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 20)
                }

                if (room.roomManager.anchor) {
                    // The last upgrade position should be the deliver pos, which we want to weight normal

                    for (const packedCoord of room.usedUpgradeCoords) {
                        const coord = unpackCoord(packedCoord)
                        cm.set(coord.x, coord.y, 20)
                    }

                    for (const packedCoord of room.usedMineralCoords) {
                        const coord = unpackCoord(packedCoord)
                        cm.set(coord.x, coord.y, 20)
                    }

                    const stampAnchors = room.roomManager.stampAnchors
                    if (stampAnchors) cm.set(stampAnchors.hub[0].x, stampAnchors.hub[0].y, 20)

                    // Loop through each position of fastFillerPositions, have creeps prefer to avoid

                    for (const packedCoord of room.usedFastFillerCoords) {
                        const coord = unpackCoord(packedCoord)
                        cm.set(coord.x, coord.y, 20)
                    }
                }
            }

            // Weight structures

            for (const key in args.weightStructures) {
                // Get the numeric value of the weight

                const structureType = key as StructureConstant

                for (const structure of room.roomManager.structures[structureType])
                    cm.set(structure.pos.x, structure.pos.y, args.weightStructures[structureType])
            }

            for (const portal of room.roomManager.structures.portal) cm.set(portal.pos.x, portal.pos.y, 255)

            // Loop trough each construction site belonging to an ally

            for (const cSite of room.allyCSites) cm.set(cSite.pos.x, cSite.pos.y, 255)

            // If there is a request to avoid enemy ranges

            avoidEnemyRanges()

            function avoidEnemyRanges() {
                // Stop if avoidEnemyRanges isn't specified

                if (!args.avoidEnemyRanges) return
                if (room.controller && room.controller.safeMode && room.controller.my) return

                for (const packedCoord of room.enemyThreatCoords) {
                    const coord = unpackCoord(packedCoord)
                    cm.set(coord.x, coord.y, 255)
                }
            }

            if (args.avoidNotMyCreeps && (!room.controller || !room.controller.safeMode)) {
                for (const creep of room.enemyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)
                for (const creep of room.allyCreeps) cm.set(creep.pos.x, creep.pos.y, 255)

                for (const creep of room.find(FIND_HOSTILE_POWER_CREEPS)) cm.set(creep.pos.x, creep.pos.y, 255)
            }

            // If avoiding structures that can't be walked on is enabled

            if (args.avoidImpassibleStructures) {
                for (const rampart of room.roomManager.structures.rampart) {
                    // If the rampart is mine

                    if (rampart.my) {
                        // If there is no weight for my ramparts, iterate

                        if (!args.myRampartWeight) continue

                        // Otherwise, record rampart by the weight and iterate

                        cm.set(rampart.pos.x, rampart.pos.y, args.myRampartWeight)
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
                    for (const structure of room.roomManager.structures[structureType]) {
                        // Set pos as impassible

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

                    for (const cSite of room.roomManager.cSites[structureType]) {
                        // Set pos as impassible

                        cm.set(cSite.pos.x, cSite.pos.y, 255)
                    }
                }
            }

            // Stop if there are no cost matrixes to weight

            if (args.weightCostMatrixes) {
                // Otherwise iterate through each x and y in the room

                for (let x = 0; x < roomDimensions; x += 1) {
                    for (let y = 0; y < roomDimensions; y += 1) {
                        // Loop through each costMatrix

                        for (const weightCMName of args.weightCostMatrixes) {
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
        customLog(
            'Incomplete Path',
            `${args.origin} -> ${args.goals[0].pos} range: ${args.goals[0].range} goals: ${
                args.goals.length - 1
            } path: ${pathFinderResult.path.length}`,
            {
                textColor: customColors.white,
                bgColor: customColors.red,
            },
        )

        originRoom.pathVisual(pathFinderResult.path, 'red')
        originRoom.errorVisual(args.origin)

        let lastPos = args.origin

        for (const goal of args.goals) {
            // Ensure no visuals are generated outside of the origin room

            if (lastPos.roomName !== goal.pos.roomName) continue

            originRoom.visual.line(lastPos, goal.pos, {
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
