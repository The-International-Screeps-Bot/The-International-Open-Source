import { constants } from 'international/constants'
import { customLog, findCPUColor } from 'international/generalFunctions'
import { allyManager } from 'international/simpleAllies'
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

InternationalManager.prototype.endTickManager = function () {
     allyManager.endTickManager()
     statsManager.internationalEndTick()

     if (!Memory.isMainShard) return

     const CPU = Game.cpu.getUsed()

     // Get the CPU color based on the amount of used CPU

     const CPUColor = findCPUColor(CPU)

     customLog(
          'Total CPU',
          `${CPU.toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`,
          constants.colors.white,
          CPUColor,
     )

     // Fill up the console with empty logs

     for (let i = 0; i < 99; i += 1) console.log()

     // Log the accumilated global logs

     console.log(global.logs)
}
