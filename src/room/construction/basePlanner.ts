import { constants } from "international/constants";
import { generalFuncs } from "international/generalFunctions";
import 'other/RoomVisual'

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room) {

    // Get a cost matrix of walls and exit areas

    const baseCM = room.get('baseCM')

    function recordAdjacentPositions(x: number, y: number, range: number) {

        // Construct a rect and get the positions in a range of 1

        const rect = { x1: x - range, y1: y - range, x2: x + range, y2: y + range }
        const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

        // Loop through adjacent positions

        for (const adjacentPos of adjacentPositions) {

            // Iterate if the adjacent pos is to avoid

            if (baseCM.get(adjacentPos.x, adjacentPos.y) == 255) continue

            // Otherwise record the position in the base cost matrix as avoid

            baseCM.set(adjacentPos.x, adjacentPos.y, 255)
        }
    }

    // Get the room's upgrade positions

    const upgradePositions: Pos[] = room.get('upgradePositions')

    // If the upgrade positions are defined

    if (upgradePositions) {

        // Loop through them

        for (const pos of upgradePositions) {

            // Record the pos as avoid in the base cost matrix

            baseCM.set(pos.x, pos.y, 255)
        }
    }

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

    // Construct an foundation for recording base plans

    const buildLocations: BuildLocations = {},

    roadLocations: {[key: string]: Pos[]} = {},

    buildPositions: Pos[] = [],
    roadPositions: Pos[] = [],

    stampAnchors: StampAnchors = {}

    /**
     * Tries to plan a stamp's placement in a room around an orient. Will inform the achor of the stamp if successful
     */
    function planStamp(stampType: StampTypes, anchorOrient: Pos, initialWeight?: number, adjacentToRoads?: boolean): false | Pos {

        // Define the stamp using the stampType

        const stamp = constants.stamps[stampType]

        // Run distance transform with the baseCM

        const distanceCM = room.specialDT(baseCM)

        // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

        const anchor = room.findClosestPosOfValue(distanceCM, anchorOrient, stamp.size, initialWeight, adjacentToRoads, adjacentToRoads ? roadPositions : [])

        // Inform false if no anchor was generated

        if (!anchor) return false

        // Otherwise
        // If the stampType isn't in stampAnchors, construct it

        if (!stampAnchors[stampType]) stampAnchors[stampType] = []

        // Add the anchor to stampAnchors based on its type

        stampAnchors[stampType].push(anchor)

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

                // If the structure is empty

                if (structureType == 'empty') {

                    // Add the pos in the cost matrix and iterate

                    baseCM.set(x, y, 255)
                    continue
                }

                // Add the positions to the buildLocations under it's stamp and structureType

                buildLocations[stampType].push({
                    structureType: structureType as BuildableStructureConstant,
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

                    // Add the x and y to roadPositions

                    roadPositions.push({ x, y })

                    // And iterate

                    continue
                }

                // Otherwise if the structure isn't a road

                // Add the x and y to buildPositions

                buildPositions.push({ x, y })

                // Record the pos as avoid in the base cost matrix

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

    // Otherwise store the fulfillerAnchor as anchor in the room's memory

    room.memory.anchor = fulfillerAnchor

    // Try to plan the stamp

    const hubAnchor = planStamp('hub', fulfillerAnchor)

    // Inform false if the stamp failed to be planned

    if (!hubAnchor) return false

    // Configure base locations for roads

    buildLocations.roads = []

    // Construct path

    let path: RoomPosition[] = []

    // Plan the stamp 7 times

    for (let i = 0; i < 6; i++) {

        // Try to plan the stamp

        const extensionsAnchor = planStamp('extensions', hubAnchor)

        // Inform false if the stamp failed to be planned

        if (!extensionsAnchor) return false

        // Path from the extensionsAnchor to the hubAnchor

        path = room.advancedFindPath({
            origin: room.newPos(extensionsAnchor),
            goal: { pos: room.newPos(hubAnchor), range: 2 },
            weightPositions: {
                255: buildPositions,
                1: roadPositions,
            },
            weightGamebjects: {
                1: room.get('road')
            }
        })

        // Loop through positions of the path

        for (const pos of path) {

            // Add the position to roadPositions

            roadPositions.push(pos)

            // Record the pos as avoid in the base cost matrix

            baseCM.set(pos.x, pos.y, 255)

            // Add the positions to the buildLocations under it's stamp and structureType

            buildLocations.roads.push({
                structureType: STRUCTURE_ROAD,
                x: pos.x,
                y: pos.y
            })
        }
    }

    // Try to plan the stamp

    const labsAnchor = planStamp('labs', hubAnchor)

    // Inform false if the stamp failed to be planned

    if (!labsAnchor) return false

    // Plan roads

    // Get the room's closestSourceHarvestPositions

    const closestSourceHarvestPositions: RoomPosition[] = [room.get('source1ClosestHarvestPosition'), room.get('source2ClosestHarvestPosition')]

    // loop through closestSourceHarvestPositions

    for (const closestHarvestPos of closestSourceHarvestPositions) {

        // Path from the hubAnchor to the closestHarvestPos

        path = room.advancedFindPath({
            origin: closestHarvestPos,
            goal: { pos: room.newPos(hubAnchor), range: 2 },
            weightPositions: {
                255: buildPositions,
                1: roadPositions,
            },
            weightGamebjects: {
                1: room.get('road')
            }
        })

        // Loop through positions of the path

        for (const pos of path) {

            // Add the position to roadPositions

            roadPositions.push(pos)

            // Record the pos as avoid in the base cost matrix

            baseCM.set(pos.x, pos.y, 255)

            // Add the positions to the buildLocations under it's stamp and structureType

            buildLocations.roads.push({
                structureType: STRUCTURE_ROAD,
                x: pos.x,
                y: pos.y
            })
        }
    }

    // Path from the hubAnchor to the centerUpgradePos

    path = room.advancedFindPath({
        origin: room.get('centerUpgradePos'),
        goal: { pos: room.newPos(hubAnchor), range: 2 },
        weightPositions: {
            255: buildPositions,
            1: roadPositions,
        }
    })

    // Loop through positions of the path

    for (const pos of path) {

        // Add the position to roadPositions

        roadPositions.push(pos)

        // Record the pos as avoid in the base cost matrix

        baseCM.set(pos.x, pos.y, 255)

        // Add the positions to the buildLocations under it's stamp and structureType

        buildLocations.roads.push({
            structureType: STRUCTURE_ROAD,
            x: pos.x,
            y: pos.y
        })
    }

    // Path from the hubAnchor to the labsAnchor

    path = room.advancedFindPath({
        origin: room.newPos(labsAnchor),
        goal: { pos: room.newPos(hubAnchor), range: 2 },
        weightPositions: {
            255: buildPositions,
            1: roadPositions,
        }
    })

    // Loop through positions of the path

    for (const pos of path) {

        // Add the position to roadPositions

        roadPositions.push(pos)

        // Record the pos as avoid in the base cost matrix

        baseCM.set(pos.x, pos.y, 255)

        // Add the positions to the buildLocations under it's stamp and structureType

        buildLocations.roads.push({
            structureType: STRUCTURE_ROAD,
            x: pos.x,
            y: pos.y
        })
    }

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

        const towerAnchor = planStamp('tower', hubAnchor, 0, true)

        // Inform false if the stamp failed to be planned

        if (!towerAnchor) return false
    }

    // Loop 10 times

    for (let i = 0; i < 14; i++) {

        // Try to plan the stamp

        const extensionAnchor = planStamp('extension', hubAnchor, 0, true)

        // Inform false if the stamp failed to be planned

        if (!extensionAnchor) return false
    }

    // Try to plan the stamp

    const observerAnchor = planStamp('observer', hubAnchor)

    // Inform false if the stamp failed to be planned

    if (!observerAnchor) return false

    // Inform information to build based on the plans

    return { buildLocations, stampAnchors }
}
