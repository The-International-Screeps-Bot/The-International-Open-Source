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

            const closestHarvestPos: RoomPosition = room.get(`${sourceName}ClosestHarvestPosition`)

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

    manageBasePlanning()

    function manageBasePlanning() {

        // Get the buildLocations

        const buildLocations: BuildLocations = global[room.name].buildLocations

        // If there are no build locations

        if (!buildLocations) {

            // Generate and record base plans

            const basePlannerResult = basePlanner(room)

            // Stop if there base planning failed

            if (!basePlannerResult) return

            // Otherwise record aspects of the results in the room's global

            global[room.name].buildLocations = basePlannerResult.buildLocations
            global[room.name].stampAnchors = basePlannerResult.stampAnchors
        }

        // Loop through each stamp type in base locations

        for (const stampType in buildLocations) {

            // Get the build object using the stamp type

            const buildObjects = buildLocations[stampType]

            // Loop through build objects inside build locations for this stamp type

            for (const buildObj of buildObjects) {

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.structure(buildObj.x, buildObj.y, buildObj.structureType)

                // If the room controller level is less than 3 and the structureType is a road, iterate

                if (room.controller.level < 3 && buildObj.structureType == STRUCTURE_ROAD) continue

                // If the structure is a container and there aren't source containers for each source and a controller container, iterate

                if (buildObj.structureType == STRUCTURE_CONTAINER && (!room.get('source1Container') || !room.get('source2Container') || !room.get('controllerContainer'))) continue

                // Place construction sites for the base

                room.createConstructionSite(buildObj.x, buildObj.y, buildObj.structureType)
            }
        }

        // If visuals are enabled, connect road visuals

        if (Memory.roomVisuals) room.visual.connectRoads()
    }

    manageRampartPlanning()

    function manageRampartPlanning() {

        // Get the rampartLocations

        const rampartLocations: Pos[] = global[room.name].rampartLocations

        // If there are no rampartLocations

        if (!rampartLocations) {

            // Generate and record rampart plans

            const rampartPlannerResult = rampartPlanner(room)

            // Stop if there rampart planning failed

            if (!rampartPlannerResult) return

            // Otherwise record the result in the room's global rampartLocations

            global[room.name].rampartLocations = rampartPlannerResult
        }

        // Loop through each positions in rampartLocations

        for (const pos of global[room.name].rampartLocations) {

            // Visualize the rampart placement

            room.visual.structure(pos.x, pos.y, STRUCTURE_RAMPART)
        }
    }
}
