import { constants } from "international/constants"
import { customLog } from "international/generalFunctions"
import { basePlanner } from "./basePlanner"
import { rampartPlanner } from "./rampartPlanner"

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // If the room has been planned for this global

    if (global[room.name].planned) {

        // If the construction site count is at its limit, stop

        if (global.constructionSitesCount == 100) return

        // If the room is above 1 construction site, stop

        if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 2) return
    }

    // Only run the planner every x ticks (temporary fix)

    if (Game.time % 50 != 0) return

    manageBasePlanning()

    function manageBasePlanning() {

        // If there are no base plans yet

        if (!global[room.name].planned) {

            // Generate and record base plans

            const basePlannerResult = basePlanner(room)

            // Stop if there base planning failed

            if (!basePlannerResult) return
        }

        // Use floodfill from the anchor to plan structures

        room.advancedConstructStructurePlans()
    }

    manageRampartPlanning()

    function manageRampartPlanning() {

        // Stop if there is no storage and no terminal

        if (!room.storage && !room.terminal) return

        // If there is not enough energy to start builing ramparts, stop

        if (room.findStoredResourceAmount(RESOURCE_ENERGY) < 30000) return

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

                room.createConstructionSite(x, y, STRUCTURE_RAMPART)

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.structure(x, y, STRUCTURE_RAMPART, {
                    opacity: 0.5
                })
            }
        }
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Construction Manager', 'CPU: ' + (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
