import './settings'
import './other/userScript/userScript'
import './international/commands'
import { collectiveManager } from './international/collective'
import { roomsManager } from 'room/rooms'
import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'
import './room/structureAdditions'
import './room/creeps/creepAdditions'
import './other/profilerRegister'
import { memHack } from 'other/memHack'
import { customLog } from 'utils/logging'
import { findCPUOf, outOfBucket, randomIntRange } from 'utils/utils'
import { CPUMaxPerTick, Result, customColors } from 'international/constants'
import { CommuneManager } from 'room/commune/commune'
import { initManager } from './international/init'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { migrationManager } from 'international/migration'
import { respawnManager } from './international/respawn'
import { tickInit } from './international/tickInit'
import { simpleAllies } from 'international/simpleAllies'
import { creepOrganizer } from './international/creepOrganizer'
import { powerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ErrorMapper } from 'other/ErrorMapper'
import { StatsManager, statsManager } from 'international/statsManager'
import { playerManager } from 'international/players'
import { profiler } from 'other/profiler'
import { SpawningStructuresManager } from 'room/commune/spawning/spawningStructures'
import { SpawnRequestsManager } from 'room/commune/spawning/spawnRequests'
import { flagManager } from 'international/flags'
import { roomPruningManager } from 'international/roomPruning'
import { TerminalManager } from 'room/commune/terminal/terminal'
import { LabManager } from 'room/commune/labs'
import { FactoryManager } from 'room/commune/factory'
import './room/construction/minCut'
import { creepClasses } from 'room/creeps/creepClasses'
import { constructionSiteManager } from './international/constructionSiteManager'
import { mapVisualsManager } from './international/mapVisuals'
import { endTickManager } from './international/endTick'
import { RoomManager } from 'room/room'
import { ObserverManager } from 'room/commune/observer'
import { RemotesManager } from 'room/commune/remotesManager'
import { HaulRequestManager } from 'room/commune/haulRequestManager'
import { SourceManager } from 'room/commune/sourceManager'
import { WorkRequestManager } from 'room/commune/workRequest'
import { ConstructionManager } from 'room/construction/construction'
import { wasm } from 'other/wasmInit'
import { requestsManager } from 'international/requests'
import { marketManager } from 'international/marketOrders'
import { transactionsManager } from 'international/transactions'
import { segmentsManager } from 'international/segments'
import { creepDataManager } from 'room/creeps/creepData'

export function originalLoop() {

    memHack.run()
    if (segmentsManager.run() === Result.stop) return

    if (Game.flags.deactivate) return
    if (Game.cpu.bucket < CPUMaxPerTick) {
        outOfBucket()
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
        transactionsManager.run()
        requestsManager.run()

        if (global.collectivizer) global.collectivizer.run()
        if (global.userScript) global.userScript.run()
        playerManager.run()
        roomsManager.initRun()
        creepOrganizer.run()
        creepDataManager.run()
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
