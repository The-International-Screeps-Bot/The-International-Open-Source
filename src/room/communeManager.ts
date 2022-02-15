import { marketManager } from "./market/marketManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from "./towerManager"
import { constructionManager } from "./construction/constructionManager"
import { structuresForSpawningManager } from "./structuresForSpawningManager"
import { droppedResourceManager } from "./droppedResourceManager"
import { defenceManager } from "./defenceManager"
import { generalFuncs } from "international/generalFunctions"

export function communeManager(room: Room) {

    room.findSourceHarvesterInfo()

    taskManager(room)

    towerManager(room)

    constructionManager(room)

    marketManager(room)

    defenceManager(room)

    droppedResourceManager(room)

    structuresForSpawningManager(room)

    spawnManager(room)

    room.floodFill([ room.controller.pos ])
}
