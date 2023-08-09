import { Sleepable } from 'utils/Sleepable'
import { RoomMemoryKeys } from './constants'

/**
 * Intended to clean Memory, global, segments from stale data
 */
class GarbageCollector extends Sleepable {
    // Clean rooms that haven't been scouted in 100k ticks
    cleanRoomThreshold = 100000
    sleepFor = 100000
    run() {
        if (this.isSleepingResponsive()) return

        this.cleanRooms()
        this.cleanPlayers()
    }
    cleanRooms() {
        for (const roomName in Memory.rooms) {
            const roomMemory = Memory.rooms[roomName]
            if (Game.time - roomMemory[RoomMemoryKeys.lastScout] < this.cleanRoomThreshold) continue

            delete Memory.rooms[roomName]
        }
    }
    cleanPlayers() {}
}

export const garbageCollector = new GarbageCollector()
