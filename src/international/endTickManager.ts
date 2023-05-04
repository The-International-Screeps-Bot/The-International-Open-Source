import { customColors } from 'international/constants'
import { customLog, findCPUColor, findFunctionCPU } from 'international/utils'
import { allyManager } from 'international/simpleAllies'
import { internationalManager, InternationalManager } from './international'
import { statsManager } from './statsManager'

/**
 * Handles logging, stat recording, and more at the end of the tick
 */
class EndTickManager {
    run() {
        allyManager.endTickManager()
        statsManager.internationalEndTick()

        if (!Memory.logging) return

        // Fill up the console with empty logs
        for (let i = 0; i < 99; i += 1) console.log()

        customLog('General data', '⬇️')
        customLog('Creeps total', Object.values(Game.creeps).length, { superPosition: 1 })
        customLog('Heap used', global.usedHeap(), { superPosition: 1 })

        // Get the CPU color based on the amount of used CPU

        const CPUColor = findCPUColor()

        customLog(
            'CPU used total',
            `${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`,
            {
                textColor: customColors.white,
                bgColor: CPUColor,
                superPosition: 1,
            },
        )

        // Log the accumilated global logs

        console.log(global.logs)
    }
}

export const endTickManager = new EndTickManager()
