import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { basePlanner } from "./basePlanner"
import { rampartPlanner } from "./rampartPlanner"

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {

    // If the construction site count is at its limit, stop

    if (global.constructionSitesCount == 100) return

    // If the room is above 1 construction site, stop

    if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 2) return

    // Stop if placing containers was a success

    placeSourceContainers()

    function placeSourceContainers(): boolean {

        // Construct sourceNames

        const sourceNames: ('source1' | 'source2')[] = [
            'source1',
            'source2'
        ]

        // Iterate through sourceNames

        for (const sourceName of sourceNames) {

            // Try to find the source with the sourceName

            const source: Source = room.get(sourceName)

            // Iterate if there is no resource

            if (!source) continue

            // Try to find an existing sourceContainer for the source

            const sourceContainer = room.get(`${sourceName}Container`)

            // Iterate if there is a sourceContainer

            if (sourceContainer) continue

            // Try to find the closestHarvestPos for the source

            const closestHarvestPos: RoomPosition = room.get(`${sourceName}ClosestHarvestPos`)

            // Iterate if it doesn't exist

            if (!closestHarvestPos) continue

            // Try to place a container on the closestHarvestPos

            room.createConstructionSite(closestHarvestPos, STRUCTURE_CONTAINER)
        }

        return true
    }

    placeControllerContainer()

    function placeControllerContainer() {

        // Get the center upgrade pos

        const centerUpgadePos: RoomPosition = room.get('centerUpgradePos')

        // Stop if it isn't defined

        if (!centerUpgadePos) return

        // Otherwise place a container on the pos

        room.createConstructionSite(centerUpgadePos, STRUCTURE_CONTAINER)
    }

    placeMineralContainer()

    function placeMineralContainer() {

        // If the controller's level is below 6, stop

        if (room.controller.level < 6) return

        // Otherwise get the mineralHarvestPos, stopping if it's undefined

        const mineralHarvestPos: RoomPosition = room.get('mineralHarvestPos')
        if (!mineralHarvestPos) return

        // Otherwise place a container on the pos

        room.createConstructionSite(mineralHarvestPos, STRUCTURE_CONTAINER)
    }

    placeExtractor()

    function placeExtractor() {

        // If the controller's level is below 6, stop

        if (room.controller.level < 6) return

        // Otherwise get the mineral

        const mineral: Mineral = room.get('mineral')

        // Otherwise place an extractor on the pos

        room.createConstructionSite(mineral.pos, STRUCTURE_EXTRACTOR)
    }

    manageBasePlanning()

    function manageBasePlanning() {

        // If there are no buildLocations

        if (!global[room.name].buildLocations) {

            // Generate and record base plans

            const basePlannerResult = basePlanner(room)

            // Stop if there base planning failed

            if (!basePlannerResult) return

            // Otherwise record aspects of the results in the room's global

            global[room.name].buildLocations = basePlannerResult.buildLocations
            global[room.name].stampAnchors = basePlannerResult.stampAnchors
            global[room.name].buildPositions = basePlannerResult.buildPositions
            global[room.name].roadPositions = basePlannerResult.roadPositions
        }

        // Get the buildLocations

        const buildLocations: BuildLocations = global[room.name].buildLocations

        // Loop through each stamp type in base locations

        for (const stampType in buildLocations) {

            // Get the build object using the stamp type

            const buildObjects = buildLocations[stampType]

            // Loop through build objects inside build locations for this stamp type

            for (const buildObj of buildObjects) {

                // Display visuals if enabled

                /* if (Memory.roomVisuals) room.visual.structure(buildObj.x, buildObj.y, buildObj.structureType, {
                opacity: 0.5
                }) */

                // If the room controller level is less than 3 and the structureType is a road, iterate

                if (room.controller.level < 3 && buildObj.structureType == STRUCTURE_ROAD) continue

                // If the structure is a container and there aren't source containers for each source and a controller container, iterate

                if (buildObj.structureType == STRUCTURE_CONTAINER && (!room.get('source1Container') || !room.get('source2Container') || !room.get('controllerContainer'))) continue

                // Place construction sites for the base

                room.createConstructionSite(buildObj.x, buildObj.y, buildObj.structureType)
            }
        }

        // If visuals are enabled, connect road visuals

        /* if (Memory.roomVisuals) room.visual.connectRoads() */
    }

    manageRampartPlanning()

    function manageRampartPlanning() {

        // If there are no rampartLocations

        if (!global[room.name].rampartLocations) {

            // Record rampart plans in the room's global rampartLocations

            global[room.name].rampartLocations = rampartPlanner(room)
        }

        // Stop if there is no storage and no terminal

        if (!room.get('storage') && !room.get('terminal')) return

        // Get the rampartLocations, stopping if there are undefined

        const rampartLocations: RoomPosition[][] = global[room.name].rampartLocations
        if (!rampartLocations) return

        // Record the groupIndex

        let groupIndex = 0

        // Loop through each group

        for (const group of rampartLocations) {

            // Get the hubAnchor after converting it to a roomPosition

            const hubAnchor = room.newPos(global[room.name].stampAnchors.hub[0])

            // Get the closest pos of the group by range to the anchor

            const cloestPosToAnchor = hubAnchor.findClosestByRange(group)

            // Path from the hubAnchor to the cloestPosToAnchor

            const path = room.advancedFindPath({
                origin: cloestPosToAnchor,
                goal: { pos: hubAnchor, range: 2 },
                weightPositions: {
                    255: global[room.name].buildPositions,
                    1: global[room.name].roadPositions,
                }
            })

            // Loop through positions of the path

            for (const pos of path) {

                // Iterate if the pos is already a roadPos

                if ((global[room.name].roadPositions as Pos[]).filter(roadPos => generalFuncs.arePositionsEqual(pos, roadPos)).length) continue

                // Add the position to roadPositions

                global[room.name].roadPositions.push(pos)

                // Add the positions to the buildLocations under it's stamp and structureType

                global[room.name].buildLocations.roads.push({
                    structureType: STRUCTURE_ROAD,
                    x: pos.x,
                    y: pos.y
                })
            }

            // Get the last pos in the path

            const lastPos = path[0]

/*             // If the pos doesn't have a rampart on it, plan for one

            group.push(lastPos) */

            // Visualize the rampart placement

            if (Memory.roomVisuals) room.visual.structure(lastPos.x, lastPos.y, STRUCTURE_RAMPART, {
                opacity: 0.5
            })

            // Visualize the road placement

            if (Memory.roomVisuals) room.visual.structure(lastPos.x, lastPos.y, STRUCTURE_ROAD, {
                opacity: 0.5
            })

            // Place a road at lastPos

            room.createConstructionSite(lastPos, STRUCTURE_ROAD)

            // Loop through each pos of the group

            for (const pos of group) {

                // Visualize the rampart placement

                if (Memory.roomVisuals) room.visual.structure(pos.x, pos.y, STRUCTURE_RAMPART, {
                    opacity: 0.5
                })

                // Visualize the road placement

                if (Memory.roomVisuals) room.visual.structure(pos.x, pos.y, STRUCTURE_ROAD, {
                    opacity: 0.5
                })

                // Place a road at pos

                room.createConstructionSite(pos, STRUCTURE_ROAD)
            }

            groupIndex++
        }

        // If visuals are enabled, connect road visuals

        /* if (Memory.roomVisuals) room.visual.connectRoads() */
    }
}
