import { myColors, roomDimensions, stamps } from 'international/constants'
import {
    customLog,
    findAvgBetweenPosotions,
    findPositionsInsideRect,
    getRange,
    pack,
    unpackAsPos,
    unpackAsRoomPos,
} from 'international/generalFunctions'
import { packPosList } from 'other/packrat'
import 'other/RoomVisual'
import { rampartPlanner } from './rampartPlanner'

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room) {
    // Get a cost matrix of walls and exit areas

    const baseCM: CostMatrix = room.get('baseCM')
    const roadCM: CostMatrix = room.get('roadCM')

    const terrain = room.getTerrain()

    if (!room.memory.stampAnchors) {
        room.memory.stampAnchors = {}

        for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
    }

    function recordAdjacentPositions(x: number, y: number, range: number, weight?: number) {
        // Construct a rect and get the positions in a range of 1

        const adjacentPositions = findPositionsInsideRect(x - range, y - range, x + range, y + range)

        // Loop through adjacent positions

        for (const adjacentPos of adjacentPositions) {
            // Iterate if the adjacent pos is to avoid

            if (baseCM.get(adjacentPos.x, adjacentPos.y) > 0) continue

            // Otherwise record the position in the base cost matrix as avoid

            baseCM.set(adjacentPos.x, adjacentPos.y, weight || 255)
        }
    }

    // Get the controller and set positions nearby to avoid

    recordAdjacentPositions(room.controller.pos.x, room.controller.pos.y, 2)

    // Get and record the mineralHarvestPos as avoid

    for (const pos of room.get('mineralHarvestPositions') as RoomPosition[]) {
        baseCM.set(pos.x, pos.y, 255)
    }

    // Record the positions around sources as unusable

    const sources = room.sources

    // Loop through each source, marking nearby positions as avoid

    for (const source of sources) recordAdjacentPositions(source.pos.x, source.pos.y, 2)

    // Find the average pos between the sources

    const avgSourcePos = sources.length > 1 ? findAvgBetweenPosotions(sources[0].pos, sources[1].pos) : sources[0].pos

    // Find the average pos between the two sources and the controller

    const avgControllerSourcePos = findAvgBetweenPosotions(room.controller.pos, avgSourcePos)

    const controllerAdjacentPositions = findPositionsInsideRect(
        room.controller.pos.x - 3,
        room.controller.pos.y - 3,
        room.controller.pos.x + 3,
        room.controller.pos.y + 3,
    )

    for (const pos of controllerAdjacentPositions) baseCM.set(pos.x, pos.y, 255)

    interface PlanStampOpts {
        stampType: StampTypes
        count: number
        anchorOrient: Coord
        initialWeight?: number
        adjacentToRoads?: boolean
        normalDT?: boolean
    }

    let stamp
    let newStampAnchors
    let packedStampAnchor
    let stampAnchor
    let structureType
    let pos
    let x
    let y

    /**
     * Tries to plan a stamp's placement in a room around an orient. Will inform the achor of the stamp if successful
     */
    function planStamp(opts: PlanStampOpts): boolean {
        // Define the stamp using the stampType

        stamp = stamps[opts.stampType]

        newStampAnchors = []

        // So long as the count is more than 0

        while (opts.count > 0) {
            opts.count -= 1

            // If an anchor already exists with this index

            if (room.memory.stampAnchors[opts.stampType][opts.count]) {
                for (packedStampAnchor of room.memory.stampAnchors[opts.stampType]) {
                    stampAnchor = unpackAsPos(packedStampAnchor)

                    for (structureType in stamp.structures) {
                        for (pos of stamp.structures[structureType]) {
                            // Re-assign the pos's x and y to align with the offset

                            x = pos.x + stampAnchor.x - stamp.offset
                            y = pos.y + stampAnchor.y - stamp.offset

                            // If the structureType is a road

                            if (structureType === STRUCTURE_ROAD) {
                                // Record the position in roadCM and iterate

                                roadCM.set(x, y, 1)
                                continue
                            }

                            baseCM.set(x, y, 255)
                            roadCM.set(x, y, 255)
                        }
                    }
                }

                continue
            }

            // Run distance transform with the baseCM

            const distanceCM = opts.normalDT ? room.distanceTransform(baseCM) : room.diagonalDistanceTransform(baseCM)

            // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

            stampAnchor = room.findClosestPosOfValue({
                CM: distanceCM,
                startPos: opts.anchorOrient,
                requiredValue: stamp.size,
                initialWeight: opts.initialWeight || 0,
                adjacentToRoads: opts.adjacentToRoads,
                roadCM: opts.adjacentToRoads ? roadCM : undefined,
            })

            // Inform false if no anchor was generated

            if (!stampAnchor) return false

            // Add the anchor to stampAnchors based on its type

            newStampAnchors.push(pack(stampAnchor))

            for (structureType in stamp.structures) {
                // Loop through positions

                for (pos of stamp.structures[structureType]) {
                    // Re-assign the pos's x and y to align with the offset

                    x = pos.x + stampAnchor.x - stamp.offset
                    y = pos.y + stampAnchor.y - stamp.offset

                    // If the structureType is a road

                    if (structureType === STRUCTURE_ROAD) {
                        // Record the position in roadCM and iterate

                        roadCM.set(x, y, 1)
                        continue
                    }

                    baseCM.set(x, y, 255)
                    roadCM.set(x, y, 255)
                }
            }
        }

        room.memory.stampAnchors[opts.stampType] = room.memory.stampAnchors[opts.stampType].concat(newStampAnchors)
        return true
    }

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'fastFiller',
            count: 1,
            anchorOrient: avgControllerSourcePos,
            normalDT: true,
        })
    )
        return false

    // If the stamp failed to be planned

    if (!room.memory.stampAnchors.fastFiller.length) {
        // Record that the room is not claimable and stop

        room.memory.notClaimable = true
        return false
    }

    for (const pos of controllerAdjacentPositions) {
        if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

        baseCM.set(pos.x, pos.y, 0)
    }

    // Get the centerUpgradePos, informing false if it's undefined

    const centerUpgadePos: RoomPosition = room.get('centerUpgradePos')
    if (!centerUpgadePos) return false

    // Get the upgradePositions

    const upgradePositions: RoomPosition[] = room.get('upgradePositions')

    // Loop through each upgradePos

    for (const upgradePos of upgradePositions) {
        // Mark as avoid in road and base cost matrixes

        baseCM.set(upgradePos.x, upgradePos.y, 255)
        roadCM.set(upgradePos.x, upgradePos.y, 20)
    }

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'hub',
            count: 1,
            anchorOrient: room.anchor,
            normalDT: true,
        })
    )
        return false

    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name)
    const fastFillerHubAnchor = findAvgBetweenPosotions(room.anchor, hubAnchor)
    // Get the closest upgrade pos and mark it as fair use in roadCM

    const closestUpgradePos = upgradePositions[0]
    roadCM.set(closestUpgradePos.x, closestUpgradePos.y, 5)

    // Construct path

    let path: RoomPosition[] = []

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'extensions',
            count: 7,
            anchorOrient: fastFillerHubAnchor,
        })
    )
        return false

    // Plan the stamp x times

    for (const extensionsAnchor of room.memory.stampAnchors.extensions) {
        // Path from the extensionsAnchor to the hubAnchor

        path = room.advancedFindPath({
            origin: unpackAsRoomPos(extensionsAnchor, room.name),
            goal: { pos: hubAnchor, range: 2 },
            weightCostMatrixes: [roadCM],
        })

        // Loop through positions of the path

        for (const pos of path) {
            // Record the pos in roadCM

            roadCM.set(pos.x, pos.y, 1)
        }
    }

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'labs',
            count: 1,
            anchorOrient: fastFillerHubAnchor,
        })
    )
        return false

    // Plan roads

    // Path from the fastFillerAnchor to the hubAnchor

    path = room.advancedFindPath({
        origin: hubAnchor,
        goal: { pos: room.anchor, range: 3 },
        weightCostMatrixes: [roadCM],
    })

    // Loop through positions of the path

    for (const pos of path) {
        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)
    }

    // Plan for a container at the pos

    /* structurePlans.set(centerUpgadePos.x, centerUpgadePos.y, structureTypesByNumber[STRUCTURE_CONTAINER]) */

    // Path from the hubAnchor to the closestUpgradePos

    path = room.advancedFindPath({
        origin: centerUpgadePos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    })

    // Loop through positions of the path

    for (const pos of path) {
        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)
    }

    // loop through sourceNames

    for (const index in sources) {
        // Get the closestHarvestPos using the sourceName, iterating if undefined

        const closestSourcePos = room.sourcePositions[index][0]

        // Record the pos in roadCM

        roadCM.set(closestSourcePos.x, closestSourcePos.y, 255)
    }

    // loop through sourceNames

    for (const index in sources) {
        // get the closestHarvestPos using the sourceName, iterating if undefined

        const closestSourcePos = room.sourcePositions[index][0]

        if (!room.memory.stampAnchors.container.includes(pack(closestSourcePos))) {
            room.memory.stampAnchors.container.push(pack(closestSourcePos))
        }

        // Add up source positions that aren't for this source

        let otherSourcePositions: RoomPosition[] = []

        for (const index2 in room.sources) {
            if (index === index2) continue

            for (const pos of room.sourcePositions[index2]) roadCM.set(pos.x, pos.y, 10)
        }

        // Path from the fastFillerAnchor to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestSourcePos,
            goal: { pos: room.anchor, range: 3 },
            weightCostMatrixes: [roadCM],
        })

        // Record the path positions in roadCM

        for (const pos of path) roadCM.set(pos.x, pos.y, 1)

        // Path from the centerUpgradePos to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestSourcePos,
            goal: { pos: closestUpgradePos, range: 1 },
            weightCostMatrixes: [roadCM],
        })

        // Loop through positions of the path

        // Record the pos in roadCM

        for (const pos of path) roadCM.set(pos.x, pos.y, 1)
    }

    // Path from the hubAnchor to the labsAnchor

    path = room.advancedFindPath({
        origin: unpackAsRoomPos(room.memory.stampAnchors.labs[0], room.name),
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    })

    // Loop through positions of the path

    // Record the pos in roadCM

    for (const pos of path) roadCM.set(pos.x, pos.y, 1)

    const mineralHarvestPos: RoomPosition = room.get('closestMineralHarvestPos')

    // Record the pos in roadCM

    roadCM.set(mineralHarvestPos.x, mineralHarvestPos.y, 255)
    /*

    structurePlans.set(mineralHarvestPos.x, mineralHarvestPos.y, structureTypesByNumber[STRUCTURE_CONTAINER])
 */
    // Path from the hubAnchor to the mineralHarvestPos

    path = room.advancedFindPath({
        origin: mineralHarvestPos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM],
    })

    // Loop through positions of the path

    // Record the pos in roadCM

    for (const pos of path) roadCM.set(pos.x, pos.y, 1)

    // Plan for a road at the mineral's pos

    if (!room.memory.stampAnchors.extractor.length) room.memory.stampAnchors.extractor.push(pack(room.mineral.pos))

    // Record road plans in the baseCM

    // Iterate through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            // If there is road at the pos, assign it as avoid in baseCM

            if (roadCM.get(x, y) === 1) baseCM.set(x, y, 255)
        }
    }

    // Mark the closestUpgradePos as avoid in the CM

    baseCM.set(closestUpgradePos.x, closestUpgradePos.y, 255)

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'tower',
            count: 6,
            anchorOrient: fastFillerHubAnchor,
            adjacentToRoads: true,
        })
    )
        return false

    rampartPlanner(room)

    // Iterate through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            // If there is road at the pos, assign it as avoid in baseCM

            if (roadCM.get(x, y) === 1) baseCM.set(x, y, 255)
        }
    }

    // Construct extraExtensions count

    let extraExtensionsAmount =
        CONTROLLER_STRUCTURES.extension[8] -
        stamps.fastFiller.structures.extension.length -
        stamps.hub.structures.extension.length -
        room.memory.stampAnchors.extensions.length * stamps.extensions.structures.extension.length -
        room.memory.stampAnchors.extension.length -
        room.memory.stampAnchors.sourceExtension.length

    if (room.memory.stampAnchors.sourceLink.length + room.memory.stampAnchors.sourceExtension.length === 0) {
        // loop through sourceNames

        for (const index in sources) {
            // Record that the source has no link

            let sourceHasLink = false

            // Get the closestHarvestPos of this sourceName

            const closestSourcePos = room.sourcePositions[index][0]

            // Find positions adjacent to source

            const adjacentPositions = findPositionsInsideRect(
                closestSourcePos.x - 1,
                closestSourcePos.y - 1,
                closestSourcePos.x + 1,
                closestSourcePos.y + 1,
            )

            // Sort adjacentPositions by range from the anchor

            adjacentPositions.sort(function (a, b) {
                return getRange(a.x, hubAnchor.x, a.y, hubAnchor.y) - getRange(b.x, hubAnchor.x, b.y, hubAnchor.y)
            })

            // Loop through each pos

            for (const pos of adjacentPositions) {
                // Iterate if plan for pos is in use

                if (roadCM.get(pos.x, pos.y) > 0) continue

                // Iterate if the pos is a wall

                if (terrain.get(pos.x, pos.y) === TERRAIN_MASK_WALL) continue

                // Otherwise

                // Assign 255 to this pos in baseCM

                baseCM.set(pos.x, pos.y, 255)

                // Assign 255 to this pos in roadCM

                roadCM.set(pos.x, pos.y, 255)

                // If there is no planned link for this source, plan one

                if (!sourceHasLink) {
                    room.memory.stampAnchors.sourceLink.push(pack(pos))

                    sourceHasLink = true
                    continue
                }

                // Otherwise plan for an extension

                room.memory.stampAnchors.sourceExtension.push(pack(pos))

                // Decrease the extraExtensionsAmount and iterate

                extraExtensionsAmount -= 1
                continue
            }
        }
    }

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'extension',
            count: extraExtensionsAmount,
            anchorOrient: hubAnchor,
            adjacentToRoads: true,
        })
    )
        return false

    // Try to plan the stamp

    if (
        !planStamp({
            stampType: 'observer',
            count: 1,
            anchorOrient: fastFillerHubAnchor,
        })
    )
        return false

    // Iterate through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            const packedPos = x * roomDimensions + y

            if (room.rampartPlans.get(x, y) === 1) room.memory.stampAnchors.rampart.push(packedPos)

            if (!room.memory.stampAnchors.road.includes(packedPos) && roadCM.get(x, y) === 1)
                room.memory.stampAnchors.road.push(packedPos)
        }
    }

    // Record planning results in the room's global and inform true

    room.memory.planned = true
    return true
}
