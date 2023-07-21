// Imports

// International

import './international/commands'
import { collectiveManager } from './international/collective'

// Room

import { roomsManager } from 'room/rooms'
import './room/roomAdditions'

import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'
import './room/structureAdditions'

// Creep

import './room/creeps/creepAdditions'

// Other

import { memHack } from 'other/memHack'
import { customLog } from 'international/utils'
import { CPUMaxPerTick, customColors } from 'international/constants'
import { CommuneManager } from 'room/commune/commune'
import { configManager } from './international/config'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { migrationManager } from 'international/migration'
import { respawnManager } from './international/respawn'
import { tickInit } from './international/tickInit'
import { allyRequestManager } from 'international/AllyRequests'
import ExecutePandaMasterCode from './other/PandaMaster/Execute'
import { creepOrganizer } from './international/creepOrganizer'
import { powerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ErrorMapper } from 'other/ErrorMapper'
import { StatsManager, statsManager, updateStat } from 'international/statsManager'
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
import { endTickManager } from './international/endTickManager'
import { CommunePlanner } from 'room/communePlanner'
import { RoomManager } from 'room/room'
import { ObserverManager } from 'room/commune/observer'
import { RemotesManager } from 'room/commune/remotesManager'
import { HaulRequestManager } from 'room/commune/haulRequestManager'
import { SourceManager } from 'room/commune/sourceManager'
import { WorkRequestManager } from 'room/commune/workRequest'
import { ConstructionManager } from 'room/construction/construction'
import { DynamicSquad } from 'room/creeps/roleManagers/antifa/dynamicSquad'
/* const collaborator = require('collaborator-obfuscated.js') as Collaborator */
import { collaborator } from 'international/collectivization/collaborator-obfuscated'
import { userScriptManager } from 'other/userScript/userScript'

// TextEncoder/Decoder polyfill for UTF-8 conversion
import 'fastestsmallesttextencoderdecoder-encodeinto/EncoderDecoderTogether.min.js';

import { initSync } from 'commiebot-wasm/commiebot_wasm.js';
let wasm_module = new WebAssembly.Module(require('commiebot_wasm_bg'));
let wasm = initSync(wasm_module);
wasm.log_setup();

function originalLoop() {
    profiler.wrap((): void => {
        if (Memory.me === 'PandaMaster' && Game.shard.name === 'shard0') {
            ExecutePandaMasterCode(false)
        } else if (Game.cpu.limit === 2) {
            ExecutePandaMasterCode()
            return
        }

        if (Game.cpu.bucket < CPUMaxPerTick) {
            outOfBucket()
            return
        }

        memHack.run()

        wasm.wasm_function()

        collectiveManager.update()

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        // Run prototypes

        migrationManager.run()
        respawnManager.run()
        configManager.run()
        allyRequestManager.initRun()
        playerManager.run();
        (collaborator as Collaborator).run()
        tickInit.run()
        tickInit.configGeneral()
        statsManager.internationalPreTick()
        roomsManager.updateRun()
        tickInit.configWorkRequests()
        tickInit.configCombatRequests()
        tickInit.configHaulRequests()
        roomsManager.initRun()
        creepOrganizer.run()
        powerCreepOrganizer.run()

        roomPruningManager.run()
        flagManager.run()
        constructionSiteManager.run()
        collectiveManager.orderManager()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('International Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: InternationalStatNames = 'imcu'
            updateStat('', statName, cpuUsed, true)
        }

        userScriptManager.run()

        roomsManager.run()

        mapVisualsManager.run()

        collectiveManager.advancedGeneratePixel()
        collectiveManager.advancedSellPixels()

        endTickManager.run()
    })
}

function outOfBucket() {
    customLog('Skipping tick due to low bucket, bucket remaining', Game.cpu.bucket, {
        textColor: customColors.white,
        bgColor: customColors.red,
    })
    console.log(
        Memory.logging
            ? global.logs
            : `Skipping tick due to low bucket, bucket remaining ${Game.cpu.bucket}`,
    )
}

export const loop = ErrorMapper.wrapLoop(originalLoop)

// Profiler decs

profiler.registerClass(CommuneManager, 'CommuneManager')
profiler.registerClass(RoomManager, 'RoomManager')
profiler.registerClass(SpawningStructuresManager, 'SpawningStructuresManager')
profiler.registerClass(SpawnRequestsManager, 'SpawnRequestsManager')
profiler.registerClass(TerminalManager, 'TerminalManager')
profiler.registerClass(LabManager, 'LabManager')
profiler.registerClass(FactoryManager, 'FactoryManager')
profiler.registerClass(StatsManager, 'StatsManager')
profiler.registerClass(CommunePlanner, 'CommunePlanner')
profiler.registerClass(ConstructionManager, 'ConstructionManager')
profiler.registerClass(ObserverManager, 'ObserverManager')
profiler.registerClass(RemotesManager, 'RemotesManager')
profiler.registerClass(HaulRequestManager, 'HaulRequestManager')
profiler.registerClass(SourceManager, 'SourceManager')
profiler.registerClass(WorkRequestManager, 'WorkRequestManager')
profiler.registerClass(Quad, 'Quad')
profiler.registerClass(DynamicSquad, 'DynamicSquad')
profiler.registerClass(Duo, 'Duo')
profiler.registerFN(updateStat, 'updateStat')
profiler.registerFN(originalLoop, 'loop')

for (const creepClass of new Set(Object.values(creepClasses))) {
    profiler.registerClass(creepClass, creepClass.toString().match(/ (\w+)/)[1])
}
profiler.registerFN(outOfBucket, 'outOfBucket')
