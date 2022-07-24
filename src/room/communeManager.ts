import { customLog, findClosestObject, getRange } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import './spawning/spawnManager'

import './towers'
import { constructionManager } from './construction/constructionManager'
import './defence'
import './links'
import './allyCreepRequestManager'
import './claimRequestManager'
import { myColors } from 'international/constants'
import { packCoord, packCoordList, packPosList } from 'other/packrat'

/**
 * Handles managers for exclusively commune-related actions
 */
export function communeManager(room: Room) {
    constructionManager(room)

    room.defenceManager()

    room.towerManager()

    marketManager(room)

    room.linkManager()

    room.claimRequestManager()

    room.allyCreepRequestManager()

    room.spawnManager()

    // Testing stuff, feel welcome to use to test CPU usage for specific room things

/*
    let cpu = Game.cpu.getUsed()

   room.cSiteTarget

    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
 */
    /*
   cpu = Game.cpu.getUsed()



   customLog('CPU USED FOR TEST 2', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
   */
}
