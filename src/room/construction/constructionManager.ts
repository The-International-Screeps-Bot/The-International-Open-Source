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

        // If there are no structurePlans

        if (!global[room.name].structurePlans) {

            // Generate and record base plans

            const basePlannerResult = basePlanner(room)

            // Stop if there base planning failed

            if (!basePlannerResult) return
        }

        const structurePlans: CostMatrix = room.get('structurePlans')

        // Iterate through each x and y in the room

        for (let x = 0; x < constants.roomDimensions; x++) {
            for (let y = 0; y < constants.roomDimensions; y++) {

                // Get the planned value for this pos

                const plannedValue = structurePlans.get(x, y)

                // If there are no ramparts planned for this pos, iterate

                if (plannedValue == 0) continue

                // Otherwise get the structureType

                const structureType = constants.numbersByStructureTypes[plannedValue]

                // If the structureType is empty, iterate

                if (structureType == 'empty') continue

                // Display visuals if enabled

                /* if (Memory.roomVisuals) room.visual.structure(x, y, structureType, {
                    opacity: 0.5
                }) */

                // Create a road site at this pos

                room.createConstructionSite(x, y, structureType)
            }
        }

        // If visuals are enabled, connect road visuals

        /* if (Memory.roomVisuals) room.visual.connectRoads() */
    }

    manageRampartPlanning()

    function manageRampartPlanning() {

        // Stop if there is no storage and no terminal

        if (!room.get('storage') && !room.get('terminal')) return

        // If ramparts are not yet planned

        if (!global[room.name].plannedRamparts) {

            // Run rampart planning and record the state of the plans

            global[room.name].plannedRamparts = rampartPlanner(room)
        }

        const rampartPlans: CostMatrix = room.get('rampartPlans')

        // Iterate through each x and y in the room

        for (let x = 0; x < constants.roomDimensions; x++) {
            for (let y = 0; y < constants.roomDimensions; y++) {

                // If there are no ramparts planned for this pos, iterate

                if (rampartPlans.get(x, y) != 1) continue

                // Otherwise

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.structure(x, y, STRUCTURE_ROAD, {
                    opacity: 0.5
                })

                if (Memory.roomVisuals) room.visual.structure(x, y, STRUCTURE_RAMPART, {
                    opacity: 0.5
                })

                // Create a road site at this pos

                room.createConstructionSite(x, y, STRUCTURE_ROAD)
            }
        }

        // If visuals are enabled, connect road visuals

        if (Memory.roomVisuals) room.visual.connectRoads()
    }
}
