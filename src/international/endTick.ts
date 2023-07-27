import { customColors } from 'international/constants'
import { customLog, findCPUColor, findCPUOf } from 'international/utils'
import { allyRequestManager } from 'international/AllyRequests'
import { collectiveManager, CollectiveManager } from './collective'
import { statsManager } from './statsManager'

/**
 * Handles logging, stat recording, and more at the end of the tick
 */
class EndTickManager {
    run() {
        allyRequestManager.endRun()
        statsManager.internationalEndTick()

        if (!global.settings.logging) return

        const interval = 100 / Math.floor(global.settings.logging)

        // Fill up the console with empty logs
        for (let i = 0; i < interval; i += 1) console.log()

        customLog('General data', '⬇️')
        customLog('Creeps total', Object.values(Game.creeps).length, { position: 1 })
        customLog('Heap used', global.usedHeap(), { position: 1 })
        customLog('Tick', Game.time, { position: 1 })

        // Get the CPU color based on the amount of used CPU

        const CPUColor = findCPUColor()

        customLog(
            'CPU used total',
            `${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`,
            {
                textColor: customColors.white,
                bgColor: CPUColor,
                position: 1,
            },
        )

        // Log the accumilated global logs

        console.log(global.logs)
    }
}

export const endTickManager = new EndTickManager()
