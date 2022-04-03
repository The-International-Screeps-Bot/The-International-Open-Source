import { constants } from "international/constants"
import { customLog, findCPUColor } from "international/generalFunctions"

/**
 * Handles logging, stat recording, and more at the end of the tick
 */
export function endTickManager() {

    const CPU = Game.cpu.getUsed(),

    // Get the CPU color based on the amount of used CPU

    CPUColor = findCPUColor(CPU)

    // Stats recording

    Memory.cpuUsage = Game.cpu.getUsed()

    // customLog the CPU used

    customLog('Total CPU', (CPU).toFixed(2) + ' / ' + Game.cpu.limit, constants.colors.white, CPUColor)

    // Fill up the console with empty logs

    for (let i = 0; i < 99; i++) console.log()

    // Log the accumilated global logs

    console.log(global.logs)
}
