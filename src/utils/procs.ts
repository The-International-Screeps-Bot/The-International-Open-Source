// General processes

import { CollectiveManager } from 'international/collective'
import { LogTypes, customLog } from "./logging"

export class Procs {
  static outOfBucket() {
    CollectiveManager.logs = ''
    customLog('Skipping tick due to low bucket, bucket remaining', Game.cpu.bucket, {
      type: LogTypes.warning,
    })
    console.log(
      global.settings.logging
        ? CollectiveManager.logs
        : `Skipping tick due to low bucket, bucket remaining ${Game.cpu.bucket}`,
    )
  }
}
