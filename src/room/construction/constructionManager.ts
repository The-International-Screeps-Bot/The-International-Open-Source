import { myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { basePlanner } from './communePlanner'
import { rampartPlanner } from './rampartPlanner'
import './constructionFunctions'

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    if (!room.memory.PC) basePlanner(room)

    manageControllerStructures()

    function manageControllerStructures() {
        const centerUpgradePos: RoomPosition | undefined = room.get('centerUpgradePos')
        if (!centerUpgradePos) return

        if (room.controller.level >= 5) {
            const controllerContainer = room.controllerContainer
            if (controllerContainer) controllerContainer.destroy()

            room.createConstructionSite(centerUpgradePos, STRUCTURE_LINK)
            return
        }

        room.createConstructionSite(centerUpgradePos, STRUCTURE_CONTAINER)
    }

    room.clearOtherStructures()

    // Use floodfill from the anchor to plan structures

    room.communeConstructionPlacement()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog(
            'Construction Manager',
            `CPU: ${(Game.cpu.getUsed() - managerCPUStart).toFixed(2)}`,
            undefined,
            myColors.lightGrey,
        )
}
