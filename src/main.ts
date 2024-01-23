import './settings'
import './other/userScript/userScript'
import './international/commands'
import './debug/debugUtils'
import { CollectiveManager } from './international/collective'
import { RoomsManager } from 'room/rooms'
import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'
import './room/creeps/creepAdditions'
import './other/profilerRegister'
import { memHack } from 'other/memHack'
import { CPUMaxPerTick, Result } from 'international/constants'
import { InitManager } from './international/init'
import { MigrationManager } from 'international/migration'
import { RespawnManager } from './international/respawn'
import { TickInit } from './international/tickInit'
import { simpleAllies } from 'international/simpleAllies/simpleAllies'
import { CreepOrganizer } from './international/creepOrganizer'
import { PowerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ErrorMapper } from 'other/ErrorMapper'
import { StatsManager } from 'international/stats'
import { PlayerManager } from 'international/players'
import { profiler } from 'other/profiler'
import { flagManager } from 'international/flags/flags'
import { RoomPruningManager } from 'international/roomPruning'
import './room/construction/minCut'
import { ConstructionSiteManager } from './international/constructionSites'
import { MapVisualsManager } from './international/mapVisuals'
import { EndTickManager } from './international/endTick'
import { wasm } from 'other/wasmInit'
import { RequestsManager } from 'international/requests'
import { MarketManager } from 'international/market/marketOrders'
import { TransactionsManager } from 'international/transactions'
import { SegmentsManager } from 'international/segments'
import { CreepDataProcs } from 'room/creeps/creepData'
import { RoomDataProcs } from 'room/roomData'
import { utils } from 'utils/utils'
import { procs } from 'utils/procs'
import { CommuneDataProcs } from 'room/commune/communeData'
import { GarbageCollector } from 'international/garbageCollector'

export function originalLoop() {
  memHack.run()
  if (SegmentsManager.run() === Result.stop) return

  if (Game.flags.deactivate) return
  if (Game.cpu.bucket < CPUMaxPerTick) {
    procs.outOfBucket()
    return
  }
  if (global.userScript) global.userScript.initialRun()

  profiler.wrap((): void => {
    MigrationManager.tryMigrate()
    RespawnManager.tryRegisterRespawn()
    InitManager.tryInit()

    TickInit.configGeneral()
    StatsManager.tickInit()
    CollectiveManager.update()
    GarbageCollector.tryRun()
    simpleAllies.initRun()
    wasm.collaborator()

    RoomDataProcs.initRooms()
    RoomDataProcs.updateRooms()
    RoomsManager.updateRun()
    TransactionsManager.run()
    RequestsManager.run()

    if (global.collectivizer) global.collectivizer.run()
    if (global.userScript) global.userScript.run()
    PlayerManager.run()
    RoomsManager.initRun()
    CreepDataProcs.updateCreeps()
    CreepOrganizer.run()
    PowerCreepOrganizer.run()

    RoomPruningManager.run()
    flagManager.run()
    ConstructionSiteManager.run()
    MarketManager.run()

    RoomsManager.run()

    MapVisualsManager.run()
    simpleAllies.endRun()
    MarketManager.advancedSellPixels()
    if (global.userScript) global.userScript.endRun()
    StatsManager.internationalEndRun()

    CollectiveManager.advancedGeneratePixel()

    SegmentsManager.endRun()
    EndTickManager.run()
  })
}
export const loop = ErrorMapper.wrapLoop(originalLoop)
