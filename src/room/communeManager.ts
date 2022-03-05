import { marketManager } from "./market/marketManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import { towerManager } from "./towerManager"
import { constructionManager } from "./construction/constructionManager"
import { structuresForSpawningManager } from "./structuresForSpawningManager"
import { droppedResourceManager } from "./droppedResourceManager"
import { defenceManager } from "./defenceManager"
import { generalFuncs } from "international/generalFunctions"
import { constants } from "international/constants"

export function communeManager(room: Room) {

    taskManager(room)

    towerManager(room)

    constructionManager(room)

    marketManager(room)

    defenceManager(room)

    droppedResourceManager(room)

    structuresForSpawningManager(room)

    spawnManager(room)

    let cpu = Game.cpu.getUsed()

    const cm = new PathFinder.CostMatrix()

    // Iterate through each x and y in the room
/*
    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            cm.set(x, y, 255)
            cm.get(x, y)
        }
    }
 */
    generalFuncs.customLog('CPU USED FOR TEST', Game.cpu.getUsed() - cpu)
}
