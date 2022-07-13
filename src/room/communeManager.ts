import { customLog, findClosestObject, getRange } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import { spawnManager } from './spawning/spawnManager'

import { towerManager } from './towerManager'
import { constructionManager } from './construction/constructionManager'
import './defenceManager'
import { linkManager } from './linkManager'
import './claimRequestManager'
import { myColors } from 'international/constants'
import { packCoord, packCoordList, packPosList } from 'other/packrat'

/**
 * Handles managers for exclusively commune-related actions
 */
export function communeManager(room: Room) {
    constructionManager(room)

    room.defenceManager()

    towerManager(room)

    marketManager(room)

    linkManager(room)

    room.claimRequestManager()

    spawnManager(room)
    /*
   let cpu = Game.cpu.getUsed()



   customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
   */
    /*
   cpu = Game.cpu.getUsed()



   customLog('CPU USED FOR TEST 2', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
   */
}
