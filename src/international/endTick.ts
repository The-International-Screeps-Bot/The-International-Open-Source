import { customColors } from '../constants/general'
import { LogTypes, LogOps } from 'utils/logOps'
import { findCPUColor, findCPUOf } from 'utils/utils'
import { CollectiveManager } from './collective'

/**
 * Handles logging, stat recording, and more at the end of the tick
 */
export class EndTickManager {
  static run() {
    if (!global.settings.logging) return

    const interval = 100 / Math.floor(global.settings.logging)

    // Fill up the console with empty logs
    for (let i = 0; i < interval; i += 1) console.log()

    LogOps.log('General data', '⬇️')
    LogOps.log('Creeps total', Memory.stats.creeps, { position: 1 })
    LogOps.log('Heap used', global.usedHeap(), { position: 1 })
    LogOps.log('Tick', Game.time, { position: 1 })

    // Get the CPU color based on the amount of used CPU

    const CPUColor = findCPUColor()

    LogOps.log(
      'CPU used total',
      `${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} CPU Bucket: ${Game.cpu.bucket}`,
      {
        type: LogTypes.info,
        position: 1,
        BGColor: CPUColor,
      },
    )

    // Log the accumilated global logs

    console.log(CollectiveManager.logs)
  }
}
