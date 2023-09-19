import { Sleepable } from 'utils/Sleepable'
import { RoomMemoryKeys, codecCacheLength } from './constants'
import { packCache, unpackCache } from 'other/codec'

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
        this.cleanCodecCachePartial()
    }
    cleanRooms() {
        for (const roomName in Memory.rooms) {
            const roomMemory = Memory.rooms[roomName]
            if (Game.time - roomMemory[RoomMemoryKeys.lastScout] < this.cleanRoomThreshold) continue

            delete Memory.rooms[roomName]
        }
    }
    cleanPlayers() {}
    cleanCodecCachePartial() {
        const packCacheKeys = Object.keys(packCache)
        if (packCacheKeys.length > codecCacheLength) {
            delete packCache[packCacheKeys[0]]
        }

        const unpackCacheKeys = Object.keys(unpackCache)
        if (unpackCacheKeys.length > codecCacheLength) {
            delete unpackCache[unpackCacheKeys[0]]
        }
    }
}

export const garbageCollector = new GarbageCollector()
