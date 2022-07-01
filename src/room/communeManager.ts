import { constants } from 'international/constants'
import { customLog, getRange } from 'international/generalFunctions'
import { marketManager } from './market/marketManager'
import { taskManager } from './roomTaskManager'

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from './towerManager'
import { constructionManager } from './construction/constructionManager'
import { droppedResourceManager } from './droppedResourceManager'
import { defenceManager } from './defenceManager'
import { storageStructuresManager } from './storingStructuresManager'
import { linkManager } from './linkManager'
import './claimRequestManager'

export function communeManager(room: Room) {
     constructionManager(room)

     towerManager(room)

     marketManager(room)

     linkManager(room)

     defenceManager(room)

     storageStructuresManager(room)

     room.claimRequestManager()

     spawnManager(room)

     /*
    let cpu = Game.cpu.getUsed()

    room.specialDT(undefined)

    customLog('CPU USED FOR TEST', Game.cpu.getUsed() - cpu)
 */
}
