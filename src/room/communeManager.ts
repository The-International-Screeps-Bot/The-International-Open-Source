import { constants } from 'international/constants'
import { customLog, getRange } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import { taskManager } from './roomTaskManager'

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from './towerManager'
import { constructionManager } from './construction/constructionManager'
import { defenceManager } from './defenceManager'
import { linkManager } from './linkManager'
import './claimRequestManager'

export function communeManager(room: Room) {
     constructionManager(room)

     towerManager(room)

     marketManager(room)

     linkManager(room)

     defenceManager(room)

     room.claimRequestManager()

     spawnManager(room)
     
     /*
     let cpu = Game.cpu.getUsed()



     customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu)
 */
}
