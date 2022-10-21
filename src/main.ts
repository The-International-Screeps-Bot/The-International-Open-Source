// Imports

// International

import './international/commands'
import { internationalManager } from './international/internationalManager'
import './international/config'
import './international/tickConfig'
import './international/creepOrganizer'
import './international/constructionSiteManager'
import './international/mapVisualsManager'
import './international/endTickManager'

// Room

import { roomsManager } from 'room/roomsManager'
import './room/roomAdditions'

import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'

// Creep

import './room/creeps/creepAdditions'

// Other

import { memHack } from 'other/memHack'
import { customLog } from 'international/utils'
import { myColors, TrafficPriorities } from 'international/constants'
import { CommuneManager } from 'room/communeManager'
import { configManager } from './international/config'
import { initProfiler } from 'other/profiler'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { migrationManager } from 'international/migrationManager'
import { respawnManager } from './international/respawnManager'
import { tickConfig } from './international/tickConfig'
import { allyManager } from 'international/simpleAllies'
import ExecutePandaMasterCode from './other/PandaMaster/Execute'
import { creepOrganizer } from './international/creepOrganizer'
import { powerCreepOrganizer } from 'international/powerCreepOrganizer'

global.profiler = initProfiler()

export const loop = function () {
    if (Game.cpu.bucket < 100) {
        console.log('SKIPPING TICK due to low bucket:' + Game.cpu.bucket)
        return
    }
    memHack.run()

    internationalManager.update()

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Run prototypes

    migrationManager.run()
    respawnManager.run()
    configManager.run()
    tickConfig.run()
    creepOrganizer.run()
    powerCreepOrganizer.run()
    internationalManager.constructionSiteManager()
    internationalManager.orderManager()

    // Handle ally requests

    allyManager.tickConfig()
    allyManager.getAllyRequests()
    ExecutePandaMasterCode()

    if (Memory.CPULogging)
        customLog(
            'International Manager',
            (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
            myColors.white,
            myColors.lightBlue,
        )

    /*
    let cpu = Game.cpu.getUsed()

    console.log(new InternationalManager())

    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
 */
    roomsManager()

    internationalManager.mapVisualsManager()

    internationalManager.advancedGeneratePixel()
    internationalManager.advancedSellPixels()
    internationalManager.endTickManager()
}
