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

    runPlanning()

    function runPlanning() {

        if (room.global.plannedBase) {

            // Only run the planner every x ticks (temporary fix)

            if (Game.time % Math.floor(Math.random() * 100) != 0) return

            // If the construction site count is at its limit, stop

            if (global.constructionSitesCount == 100) return

            // If the room is above 1 construction site, stop

            if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 2) return
        }

        manageControllerStructures()
        manageBasePlanning()
        manageRampartPlanning()
    }

    function manageControllerStructures() {

        //

        const centerUpgradePos: RoomPosition | undefined = room.get('centerUpgradePos')
        if (!centerUpgradePos) return

        if (room.controller.level >= 5) {

            const controllerContainer: StructureContainer | undefined = room.get('controllerContainer')
            if (controllerContainer) controllerContainer.destroy()

            room.createConstructionSite(centerUpgradePos, STRUCTURE_LINK)
            return
        }

        room.createConstructionSite(centerUpgradePos, STRUCTURE_CONTAINER)
    }

    function manageBasePlanning() {

        // If there are no base plans yet

        if (!room.global.plannedBase) {

            // Generate and record base plans

            const basePlannerResult = basePlanner(room)

            // Stop if there base planning failed

            if (!basePlannerResult) return
        }

        // Use floodfill from the anchor to plan structures

        room.advancedConstructStructurePlans()
    }

    function manageRampartPlanning() {

        // Stop if there is no storage and no terminal

        if (!room.storage && !room.terminal) return

        // If there is not enough energy to start builing ramparts, stop

        if (room.findStoredResourceAmount(RESOURCE_ENERGY) < 30000) return

        // If ramparts are not yet planned

        if (!room.global.plannedRamparts) {

            // Run rampart planning and record the state of the plans

            rampartPlanner(room)
        }
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Construction Manager', 'CPU: ' + (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
