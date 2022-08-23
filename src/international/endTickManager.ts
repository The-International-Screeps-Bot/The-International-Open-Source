import { myColors } from 'international/constants'
import { customLog, findCPUColor } from 'international/generalFunctions'
import { allyManager } from 'international/simpleAllies'
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

InternationalManager.prototype.endTickManager = function () {
    allyManager.endTickManager()
    statsManager.internationalEndTick()

    if (!Memory.isMainShard) return

    // Fill up the console with empty logs
    for (let i = 0; i < 99; i += 1) console.log()

    // Get the CPU color based on the amount of used CPU

    const CPUColor = findCPUColor()

    customLog(
        'Total CPU',
        `${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`,
        myColors.white,
        CPUColor,
    )

    // Log the accumilated global logs

    console.log(global.logs)
}
