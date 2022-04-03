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

export function communeManager(room: Room) {

    taskManager(room)

    towerManager(room)

    constructionManager(room)

    marketManager(room)

    defenceManager(room)

    droppedResourceManager(room)

    structuresForSpawningManager(room)

    storageStructuresManager(room)

    spawnManager(room)

/*
    let cpu = Game.cpu.getUsed()



    customLog('CPU USED FOR TEST', Game.cpu.getUsed() - cpu)
     */
}
