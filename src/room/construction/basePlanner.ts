import { constants } from "international/constants";
import { generalFuncs } from "international/generalFunctions";

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room): false | BuildLocations {

    // Get a cost matrix of walls and exit areas

    const baseCM = room.get('baseCM')

    function recordAdjacentPositions(x: number, y: number, range: number) {

        // Construct a rect and get the positions in a range of 1

        const rect = { x1: x - range, y1: y - range, x2: x + range, y2: y + range }
        const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

        // Loop through adjacent positions

        for (const adjacentPos of adjacentPositions) {

            // Iterate if the adjacent pos is a wall

            if (baseCM.get(adjacentPos.x, adjacentPos.y) == 255) continue

            // Otherwise record the position as a wall

            baseCM.set(adjacentPos.x, adjacentPos.y, 255)
        }
    }

    // Record postions around the controller as unusable

    recordAdjacentPositions(room.controller.pos.x, room.controller.pos.y, 3)

    // Record positions around the mineral as unusable

    const mineral: Mineral = room.get('mineral')
    recordAdjacentPositions(mineral.pos.x, mineral.pos.y, 1)

    // Record the positions around sources as unusable

    const sources: Source[] = room.get('sources')

    for (const source of sources) {

        // Record adjacent positions to avoid

        recordAdjacentPositions(source.pos.x, source.pos.y, 2)
    }

    // Get the sources in the room

    const source1: Source = room.get('source1')
    const source2: Source = room.get('source2')

    // Find the average pos between the sources

    const avgSourcePos = generalFuncs.findAvgBetweenPosotions(source1.pos, source2.pos)

    // Find the average pos between the two sources and the controller

    const avgControllerSourcePos = generalFuncs.findAvgBetweenPosotions(room.controller.pos, avgSourcePos)
/*
    // Construct seeds for the floodfill

    const seeds = []

    // Get exits and loop through them

    const exits = room.find(FIND_EXIT)

    for (const pos of exits) {

        // Add the pos into seeds

        seeds.push(pos)
    }

    // Use the seeds in a floodfill

    const floodCM = room.floodFill(seeds)
 */
    // Construct an foundation for recording base plans

    const buildLocations: BuildLocations = {}

    const roadLocations: {[key: string]: Pos[]} = {}

    /**
     * Tries to plan a stamp's placement in a room around an orient. Will inform the achor of the stamp if successful
     */
    function planStamp(stampType: StampTypes, anchorOrient: Pos): false | Pos {

        // Define the stamp using the stampType

        const stamp = constants.stamps[stampType]

        // Run distance transform with the baseCM

        const distanceCM = room.specialDT(baseCM)

        // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

        const anchor = room.findClosestPosOfValue(distanceCM, anchorOrient, stamp.size)

        // Inform false if no anchor was generated

        if (!anchor) return false

        // If base locations aren't configured for this stamp yet

        if (!buildLocations[stampType]) {

            // Configure base locations and road locations

            buildLocations[stampType] = []
            roadLocations[stampType] = []
        }

        // Loop through structure types in fastFiller structures

        for (const structureType in stamp.structures) {

            // Get the positions for this structre type

            const positions = stamp.structures[structureType]

            // Loop through positions

            for (const pos of positions) {

                // Get the proper x and y using the offset and stamp radius

                const x = pos.x + anchor.x - stamp.offset
                const y = pos.y + anchor.y - stamp.offset

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])

                // If the structure is empty

                if (structureType == 'empty') {

                    // Add the pos in the cost matrix and iterate

                    baseCM.set(x, y, 255)
                    continue
                }

                // Add the positions to the buildLocations under it's stamp and structureType

                buildLocations[stampType].push({
                    structureType,
                    x,
                    y
                })

                // If the structure is a road

                if (structureType === STRUCTURE_ROAD) {

                    // Add the x and y to the stampType in road locations

                    roadLocations[stampType].push({
                        x,
                        y
                    })

                    // And iterate

                    continue
                }

                // Otheriwse record the pos as avoid in the base cost matrix

                baseCM.set(x, y, 255)
            }
        }

        return anchor
    }

    // Try to plan the stamp

    const fulfillerAnchor = planStamp('fastFiller', avgControllerSourcePos)

    // If the stamp failed to be planned

    if (!fulfillerAnchor) {

        // Record that the room is not claimable and stop

        room.memory.notClaimable = true
        return false
    }

    // Try to plan the stamp

    const hubAnchor = planStamp('hub', fulfillerAnchor)

    // Inform false if the stamp failed to be planned

    if (!hubAnchor) return false

    // Plan the stamp 7 times

    for (let i = 0; i < 7; i++) {

        // Try to plan the stamp

        const extensionsAnchor = planStamp('extensions', hubAnchor)

        // Inform false if the stamp failed to be planned

        if (!extensionsAnchor) return false
    }

    // Try to plan the stamp

    const labsAnchor = planStamp('labs', hubAnchor)

    // Inform false if the stamp failed to be planned

    if (!labsAnchor) return false

/*     // Loop through all stringified positions in road build locations

    for (const stringPos in roadBuildLocations) {

        // Cover the stringPos into a pos

        const pos: Pos = JSON.parse(stringPos)

        // Record it in the base cost matrix

        baseCM.set(pos.x, pos.y, 255)
    } */

    // Loop through each stamp type in road locations

    for (const stampType in roadLocations) {

        // Get the road positions using the stamp type

        const roadPositions = roadLocations[stampType]

        // Loop through positions of road positions

        for (const pos of roadPositions) {

            // Record the pos to avoid in the base cost matrix

            baseCM.set(pos.x, pos.y, 255)
        }
    }

    // Loop 6 times

    for (let i = 0; i < 6; i++) {

        // Try to plan the stamp

        const towerAnchor = planStamp('tower', hubAnchor)

        // Inform false if the stamp failed to be planned

        if (!towerAnchor) return false
    }

    // Loop 10 times

    for (let i = 0; i < 8; i++) {

        // Try to plan the stamp

        const extensionAnchor = planStamp('extension', hubAnchor)

        // Inform false if the stamp failed to be planned

        if (!extensionAnchor) return false
    }

    // Inform information to build based on the plans

    return buildLocations
}
