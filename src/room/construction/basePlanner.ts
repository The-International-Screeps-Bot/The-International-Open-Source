import { constants } from "international/constants";
import { generalFuncs } from "international/generalFunctions";
import 'other/RoomVisual'

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room) {

    // Get a cost matrix of walls and exit areas

    const baseCM: CostMatrix = room.get('baseCM'),
    roadCM: CostMatrix = room.get('roadCM'),
    structurePlans: CostMatrix = room.get('structurePlans'),
    stampAnchors: StampAnchors = {}

    function recordAdjacentPositions(x: number, y: number, range: number, weight?: number) {

        // Construct a rect and get the positions in a range of 1

        const rect = { x1: x - range, y1: y - range, x2: x + range, y2: y + range },
        adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

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

    const mineralHarvestPos: RoomPosition = room.get('mineralHarvestPos')
    baseCM.set(mineralHarvestPos.x, mineralHarvestPos.y, 255)

    // Record the positions around sources as unusable

    const sources: Source[] = room.get('sources')

    // Loop through each source, marking nearby positions as avoid

    for (const source of sources) recordAdjacentPositions(source.pos.x, source.pos.y, 2)

    // Find the average pos between the sources

    const avgSourcePos = generalFuncs.findAvgBetweenPosotions(sources[0].pos, sources[1].pos),

    // Find the average pos between the two sources and the controller

    avgControllerSourcePos = generalFuncs.findAvgBetweenPosotions(room.controller.pos, avgSourcePos)

    interface PlanStampOpts {
        stampType: StampTypes
        anchorOrient: Pos
        initialWeight?: number
        adjacentToRoads?: boolean
    }

    /**
     * Tries to plan a stamp's placement in a room around an orient. Will inform the achor of the stamp if successful
     */
    function planStamp(opts: PlanStampOpts): false | RoomPosition {

        // Define the stamp using the stampType

        const stamp = constants.stamps[opts.stampType]

        // Run distance transform with the baseCM

        const distanceCM = room.specialDT(baseCM)

        // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

        const anchor = room.findClosestPosOfValue({
            CM: distanceCM,
            startPos: opts.anchorOrient,
            requiredValue: stamp.size,
            initialWeight: opts.initialWeight || 0,
            adjacentToRoads: opts.adjacentToRoads,
            roadCM: opts.adjacentToRoads ? roadCM : undefined
        })

        // Inform false if no anchor was generated

        if (!anchor) return false

        // Otherwise
        // If the stampType isn't in stampAnchors, construct it

        if (!stampAnchors[opts.stampType]) stampAnchors[opts.stampType] = []

        // Add the anchor to stampAnchors based on its type

        stampAnchors[opts.stampType].push(anchor)

        // Loop through structure types in fastFiller structures

        for (const structureType in stamp.structures) {

            // Get the positions for this structre type

            const positions = stamp.structures[structureType]

            // Loop through positions

            for (const pos of positions) {

                // Re-assign the pos's x and y to align with the offset

                const x = pos.x + anchor.x - stamp.offset,
                y = pos.y + anchor.y - stamp.offset

                // Plan for the structureType at this position

                structurePlans.set(x, y, constants.structureTypesByNumber[structureType])

                // If the structureType is a road

                if (structureType == STRUCTURE_ROAD) {

                    // Record the position in roadCM and iterate

                    roadCM.set(x, y, 1)
                    continue
                }

                // Otherwise record the position as avoid in baseCM and roadCM and iterate

                baseCM.set(x, y, 255)
                roadCM.set(x, y, 255)
            }
        }

        return anchor
    }

    // Try to plan the stamp

    const fastFillerAnchor = planStamp({
        stampType: 'fastFiller',
        anchorOrient: avgControllerSourcePos,
    })

    // If the stamp failed to be planned

    if (!fastFillerAnchor) {

        // Record that the room is not claimable and stop

        room.memory.notClaimable = true
        return false
    }

    // Otherwise store the fastFillerAnchor as anchor in the room's memory

    room.memory.anchor = fastFillerAnchor

    // Get the centerUpgradePos, informing false if it's undefined

    const centerUpgadePos: RoomPosition = room.get('centerUpgradePos')
    if (!centerUpgadePos) return false

    // Get the upgradePositions

    const upgradePositions: RoomPosition[] = room.get('upgradePositions')

    // Loop through each upgradePos

    for (const upgradePos of upgradePositions) {

        // Mark as avoid in road and base cost matrixes

        baseCM.set(upgradePos.x, upgradePos.y, 255)
        roadCM.set(upgradePos.x, upgradePos.y, 255)
    }

    // Try to plan the stamp

    const hubAnchor = planStamp({
        stampType: 'hub',
        anchorOrient: fastFillerAnchor,
    })

    // Inform false if the stamp failed to be planned

    if (!hubAnchor) return false

    // Get the closest upgrade pos and mark it as fair use in roadCM

    const closestUpgradePos = hubAnchor.findClosestByRange(upgradePositions)
    roadCM.set(closestUpgradePos.x, closestUpgradePos.y, 5)

    // Construct path

    let path: RoomPosition[] = []

    // Plan the stamp x times

    for (let i = 0; i < 6; i++) {

        // Try to plan the stamp

        const extensionsAnchor = planStamp({
            stampType: 'extensions',
            anchorOrient: hubAnchor,
        })

        // Inform false if the stamp failed to be planned

        if (!extensionsAnchor) return false

        // Path from the extensionsAnchor to the hubAnchor

        path = room.advancedFindPath({
            origin: extensionsAnchor,
            goal: { pos: hubAnchor, range: 2 },
            weightCostMatrixes: [roadCM]
        })

        // Loop through positions of the path

        for (const pos of path) {

            // Record the pos in roadCM

            roadCM.set(pos.x, pos.y, 1)

            // Plan for a road at this position

            structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
        }
    }

    // Try to plan the stamp

    const labsAnchor = planStamp({
        stampType: 'labs',
        anchorOrient: hubAnchor,
    })

    // Inform false if the stamp failed to be planned

    if (!labsAnchor) return false

    // Plan roads

    // Path from the fastFillerAnchor to the hubAnchor

    path = room.advancedFindPath({
        origin: hubAnchor,
        goal: { pos: fastFillerAnchor, range: 3 },
        weightCostMatrixes: [roadCM]
    })

    // Loop through positions of the path

    for (const pos of path) {

        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)

        // Plan for a road at this position

        structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
    }

    // Record the pos in roadCM

    roadCM.set(centerUpgadePos.x, centerUpgadePos.y, 255)

    // Plan for a road at the pos

    structurePlans.set(centerUpgadePos.x, centerUpgadePos.y, constants.structureTypesByNumber[STRUCTURE_CONTAINER])

    // Path from the hubAnchor to the closestUpgradePos

    path = room.advancedFindPath({
        origin: centerUpgadePos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM]
    })

    // Record the path's length in global

    global[room.name].upgradePathLength = path.length

    // Loop through positions of the path

    for (const pos of path) {

        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)

        // Plan for a road at this position

        structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
    }

    // Get the room's sourceNames

    const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

    // loop through sourceNames

    for (const sourceName of sourceNames) {

        // get the closestHarvestPos using the sourceName

        const closestHarvestPos = room.get(`${sourceName}ClosestHarvestPos`)

        // Record the pos in roadCM

        roadCM.set(closestHarvestPos.x, closestHarvestPos.y, 255)

        // Plan for a road at the pos

        structurePlans.set(closestHarvestPos.x, closestHarvestPos.y, constants.structureTypesByNumber[STRUCTURE_CONTAINER])

        // Path from the hubAnchor to the closestHarvestPos

        const fastFillerPath = room.advancedFindPath({
            origin: closestHarvestPos,
            goal: { pos: fastFillerAnchor, range: 4 },
            weightCostMatrixes: [roadCM]
        })

        // Record the path's length in global

        global[room.name][`${sourceName}PathLength`] = fastFillerPath.length

        // Path from the hubAnchor to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestHarvestPos,
            goal: { pos: hubAnchor, range: 2 },
            weightCostMatrixes: [roadCM]
        })

        // Loop through positions of the path

        for (const pos of path) {

            // Record the pos in roadCM

            roadCM.set(pos.x, pos.y, 1)

            // Plan for a road at this position

            structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
        }

        // Path from the centerUpgradePos to the closestHarvestPos

        /* path = room.advancedFindPath({
            origin: closestHarvestPos,
            goal: { pos: closestUpgradePos, range: 1 },
            weightCostMatrixes: [roadCM]
        })

        // Loop through positions of the path

        for (const pos of path) {

            // Record the pos in roadCM

            roadCM.set(pos.x, pos.y, 1)

            // Plan for a road at this position

            structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
        } */
    }

    // Path from the hubAnchor to the labsAnchor

    path = room.advancedFindPath({
        origin: labsAnchor,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM]
    })

    // Loop through positions of the path

    for (const pos of path) {

        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)

        // Plan for a road at this position

        structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
    }

    // Record the pos in roadCM

    roadCM.set(mineralHarvestPos.x, mineralHarvestPos.y, 255)

    // Plan for a road at the pos

    structurePlans.set(mineralHarvestPos.x, mineralHarvestPos.y, constants.structureTypesByNumber[STRUCTURE_CONTAINER])

    // Path from the hubAnchor to the mineralHarvestPos

    path = room.advancedFindPath({
        origin: mineralHarvestPos,
        goal: { pos: hubAnchor, range: 2 },
        weightCostMatrixes: [roadCM]
    })

    // Loop through positions of the path

    for (const pos of path) {

        // Record the pos in roadCM

        roadCM.set(pos.x, pos.y, 1)

        // Plan for a road at this position

        structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
    }

    // Otherwise get the mineral

    const mineral: Mineral = room.get('mineral')

    // Plan for a road at the mineral's pos

    structurePlans.set(mineral.pos.x, mineral.pos.y, constants.structureTypesByNumber[STRUCTURE_EXTRACTOR])

    // Record road plans in the baseCM

    // Iterate through each x and y in the room

    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            // Get the value of this pos in roadCM, iterate if the value is 0, iterate

            const roadValue = roadCM.get(x, y)
            if (roadValue == 0) continue

            // Otherwise assign 255 to this pos in baseCM

            baseCM.set(x, y, 255)
        }
    }

    // Mark the closestUpgradePos as avoid in the CM

    baseCM.set(closestUpgradePos.x, closestUpgradePos.y, 255)

    // Loop 6 times

    for (let i = 0; i < 6; i++) {

        // Try to plan the stamp

        const towerAnchor = planStamp({
            stampType: 'tower',
            anchorOrient: hubAnchor,
            adjacentToRoads: true,
        })

        // Inform false if the stamp failed to be planned

        if (!towerAnchor) return false
    }

    // Loop 10 times

    for (let i = 0; i < 14; i++) {

        // Try to plan the stamp

        const extensionAnchor = planStamp({
            stampType: 'extension',
            anchorOrient: hubAnchor,
            adjacentToRoads: true,
        })

        // Inform false if the stamp failed to be planned

        if (!extensionAnchor) return false
    }

    // Try to plan the stamp

    const observerAnchor = planStamp({
        stampType: 'observer',
        anchorOrient: hubAnchor,
    })

    // Inform false if the stamp failed to be planned

    if (!observerAnchor) return false

    // Record planning results in the room's global and inform true

    global[room.name].stampAnchors = stampAnchors
    global[room.name].planned = true
    return true
}
