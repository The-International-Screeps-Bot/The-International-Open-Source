import { RoomMemoryKeys } from "./constants"

/**
 * Intended to clean Memory, global, segments from stale data
 */
class GarbageCollector {
    // Clean rooms that haven't been scouted in 100k ticks
    cleanRoomThreshold = 100000
    /**
     * The tick for which we were last ran
     */
    sleep = 0
    sleepFor = 100000
    constructor() {

        // Only run when sleep has expired
        if (Game.time - this.sleep > this.sleepFor) return
        
        this.cleanRooms()
        this.cleanPlayers()
    }
    run() {


    }
    cleanRooms() {

        for (const roomName in Memory.rooms) {

            const roomMemory = Memory.rooms[roomName]
            if (Game.time - roomMemory[RoomMemoryKeys.lastScout] < this.cleanRoomThreshold) continue

            delete Memory.rooms[roomName]
        }
    }
    cleanPlayers() {


    }
}

export const garbageCollector = new GarbageCollector()
