import { marketManager } from "./market/marketManager"
import { roomVisualsManager } from "./roomVisualsManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from "./towerManager"
import { constructionManager } from "./construction/constructionManager"
import { basePlanner } from "./construction/basePlanner"
import { generalFuncs } from "international/generalFunctions"

export function communeManager(room: Room) {

    marketManager(room)

    taskManager(room)

    spawnManager(room)

    towerManager(room)

    roomVisualsManager(room)

    constructionManager(room)

    /* basePlanner(room) */
}
