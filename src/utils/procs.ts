// General processes

import { collectiveManager } from "international/collective"
import { LogTypes, customLog } from "./logging"

export class Procs {
  outOfBucket() {
    collectiveManager.logs = ''
    customLog('Skipping tick due to low bucket, bucket remaining', Game.cpu.bucket, {
      type: LogTypes.warning,
    })
    console.log(
      global.settings.logging
        ? collectiveManager.logs
        : `Skipping tick due to low bucket, bucket remaining ${Game.cpu.bucket}`,
    )
  }
}

export const procs = new Procs()
