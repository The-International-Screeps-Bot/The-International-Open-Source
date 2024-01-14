import './settings'
import './other/userScript/userScript'
import './international/commands'
import './debug/debugUtils'
import { collectiveManager } from './international/collective'
import { roomsManager } from 'room/rooms'
import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'
import './room/creeps/creepAdditions'
import './other/profilerRegister'
import { memHack } from 'other/memHack'
import { CPUMaxPerTick, Result } from 'international/constants'
import { initManager } from './international/init'
import { migrationManager } from 'international/migration'
import { respawnManager } from './international/respawn'
import { tickInit } from './international/tickInit'
import { simpleAllies } from 'international/simpleAllies/simpleAllies'
import { creepOrganizer } from './international/creepOrganizer'
import { powerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ErrorMapper } from 'other/ErrorMapper'
import { statsManager } from 'international/statsManager'
import { playerManager } from 'international/players'
import { profiler } from 'other/profiler'
import { flagManager } from 'international/flags'
import { roomPruningManager } from 'international/roomPruning'
import './room/construction/minCut'
import { constructionSiteManager } from './international/constructionSiteManager'
import { mapVisualsManager } from './international/mapVisuals'
import { endTickManager } from './international/endTick'
import { wasm } from 'other/wasmInit'
import { requestsManager } from 'international/requests'
import { marketManager } from 'international/market/marketOrders'
import { transactionsManager } from 'international/transactions'
import { segmentsManager } from 'international/segments'
import { creepDataManager } from 'room/creeps/creepData'
import { roomDataManager } from 'room/roomData'
import { utils } from 'utils/utils'
import { procs } from 'utils/procs'
import { communeDataManager } from 'room/commune/communeData'

export function originalLoop() {
  memHack.run()
  if (segmentsManager.run() === Result.stop) return

  if (Game.flags.deactivate) return
  if (Game.cpu.bucket < CPUMaxPerTick) {
    procs.outOfBucket()
    return
  }
  if (global.userScript) global.userScript.initialRun()

  profiler.wrap((): void => {
    migrationManager.run()
    respawnManager.run()
    initManager.run()

    tickInit.configGeneral()
    statsManager.tickInit()
    collectiveManager.update()
    simpleAllies.initRun()
    wasm.collaborator()

    roomsManager.updateRun()
    roomDataManager.initRooms()
    roomDataManager.updateRooms()
    transactionsManager.run()
    requestsManager.run()

    if (global.collectivizer) global.collectivizer.run()
    if (global.userScript) global.userScript.run()
    playerManager.run()
    roomsManager.initRun()
    creepOrganizer.run()
    creepDataManager.updateCreeps()
    powerCreepOrganizer.run()

    roomPruningManager.run()
    flagManager.run()
    constructionSiteManager.run()
    marketManager.run()

    roomsManager.run()

    mapVisualsManager.run()
    simpleAllies.endRun()
    marketManager.advancedSellPixels()
    if (global.userScript) global.userScript.endRun()
    statsManager.internationalEndRun()

    collectiveManager.advancedGeneratePixel()

    segmentsManager.endRun()
    endTickManager.run()
  })
}
export const loop = ErrorMapper.wrapLoop(originalLoop)
