import { marketManager } from "./market/marketManager"
import { roomVisualsManager } from "./roomVisualsManager"
import { taskManager } from "./roomTaskManager"

import { spawnManager } from './spawning/spawnManager'

import './towerManager'
import './linkManager'
import './factoryManager'

export function communeManager(room: Room) {

    marketManager(room)

    taskManager(room)

    spawnManager(room)

    roomVisualsManager(room)
}
