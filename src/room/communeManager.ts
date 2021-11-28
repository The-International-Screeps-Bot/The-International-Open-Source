import { marketManager } from "./market/marketManager"
import { spawnManager } from './spawning/spawnManager'

export function communeManager(room: Room) {

    marketManager(room)

    spawnManager(room)
}
