import { customColors, stamps } from 'international/constants'
import { customLog } from 'international/utils'
import { basePlanner } from '../communePlanner'
import { rampartPlanner } from './rampartPlanner'
import './constructionFunctions'
import { globalStatsUpdater } from 'international/statsManager'

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()
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

    if (Memory.CPULogging === true) {
        const cpuUsed = Game.cpu.getUsed() - managerCPUStart
        customLog('Construction Manager', cpuUsed.toFixed(2), {
            textColor: customColors.white,
            bgColor: customColors.lightBlue,
        })
        const statName: RoomCommuneStatNames = 'cmcu'
        globalStatsUpdater(room.name, statName, cpuUsed)
    }
}
