// General processes

import { CollectiveManager } from 'international/collective'
import { LogTypes, LogOps } from './logOps'

export class Procs {
  static outOfBucket() {
    CollectiveManager.logs = ''
    LogOps.log('Skipping tick due to low bucket, bucket remaining', Game.cpu.bucket, {
      type: LogTypes.warning,
    })
    console.log(
      global.settings.logging
        ? CollectiveManager.logs
        : `Skipping tick due to low bucket, bucket remaining ${Game.cpu.bucket}`,
    )
  }
}
