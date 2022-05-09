import { marketManager } from "./market/marketManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from "./towerManager"
import { constructionManager } from "./construction/constructionManager"
import { structuresForSpawningManager } from "./structuresForSpawningManager"
import { droppedResourceManager } from "./droppedResourceManager"
import { defenceManager } from "./defenceManager"
import { constants } from "international/constants"
import { storageStructuresManager } from "./storingStructuresManager"
import { customLog, getRange } from "international/generalFunctions"
import { linkManager } from "./linkManager"
import './claimRequestManager'

export function communeManager(room: Room) {

    constructionManager(room)

    towerManager(room)

    marketManager(room)

    linkManager(room)

    defenceManager(room)

    structuresForSpawningManager(room)

    storageStructuresManager(room)

    room.claimRequestManager()

    spawnManager(room)
    
/*
    let cpu = Game.cpu.getUsed()

    room.specialDT(undefined)

    customLog('CPU USED FOR TEST', Game.cpu.getUsed() - cpu)
 */
}
