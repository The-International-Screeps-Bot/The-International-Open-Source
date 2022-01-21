import { marketManager } from "./market/marketManager"
import { roomVisualsManager } from "./roomVisualsManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from "./towerManager"
import { constructionManager } from "./construction/constructionManager"
import { basePlanner } from "./construction/basePlanner"
import { generalFuncs } from "international/generalFunctions"
import { structuresForSpawningManager } from "./structuresForSpawningManager"
import { droppedResourceManager } from "./droppedResourceManager"

export function communeManager(room: Room) {

    marketManager(room)

    taskManager(room)

    spawnManager(room)

    towerManager(room)

    roomVisualsManager(room)

    constructionManager(room)

    droppedResourceManager(room)

    structuresForSpawningManager(room)

    const upgradePositions: Pos[] = room.get('upgradePositions')

    generalFuncs.customLog('testing', JSON.stringify(upgradePositions))

    if (upgradePositions) {

        for (const pos of upgradePositions) {

            room.visual.text('A', pos.x, pos.y)
        }
    }
}
