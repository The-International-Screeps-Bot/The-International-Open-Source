import { marketManager } from "./market/marketManager"
import { roomVisualsManager } from "./roomVisualsManager"
import { spawnManager } from './spawning/spawnManager'



export function communeManager(room: Room) {

    marketManager(room)

    spawnManager(room)

    roomVisualsManager(room)
}
