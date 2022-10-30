import { myColors, stamps } from 'international/constants'
import { customLog } from 'international/utils'
import { basePlanner } from './communePlanner'
import { rampartPlanner } from './rampartPlanner'
import './constructionFunctions'

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()
    /*
    // Testing

    delete room.memory.PC

    room.memory.stampAnchors = {}

    for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
 */

    if (!room.memory.PC) basePlanner(room)

    manageControllerStructures()

    function manageControllerStructures() {
        const centerUpgradePos = room.centerUpgradePos
        if (!centerUpgradePos) return

        const controllerContainer = room.controllerContainer
        if (room.controller.level >= 5) {
            if (controllerContainer) controllerContainer.destroy()

            const controllerLink = room.controllerLink
            if (!controllerLink) room.createConstructionSite(centerUpgradePos, STRUCTURE_LINK)

            return
        }

        if (!controllerContainer) room.createConstructionSite(centerUpgradePos, STRUCTURE_CONTAINER)
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
