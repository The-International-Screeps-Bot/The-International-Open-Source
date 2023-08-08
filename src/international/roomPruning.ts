import { RoomMemoryKeys, WorkRequestKeys } from './constants'
import { findLowestScore, randomIntRange } from './utils'

class RoomPruningManager {
    sleepTime = randomIntRange(50000, 100000)
    lastAttempt: number
    /**
     * The tick for which we were last ran
     */
    sleep = 0
    sleepFor = 100000
    run() {
        // Only run when sleep has expired
        if (Game.time - this.sleep > this.sleepFor) return
        this.sleep = Game.time

        // Make sure all rooms are max RCL
        // Temple rooms?

        let highestCommuneScore = 0
        let highestCommuneScoreCommuneName: string

        for (const roomName of global.communes) {

            const roomMemory = Memory.rooms[roomName]
            const score = roomMemory[RoomMemoryKeys.score] + roomMemory[RoomMemoryKeys.dynamicScore]

            if (score <= highestCommuneScore) continue

            highestCommuneScore = score
            highestCommuneScoreCommuneName = roomName
        }

        // Find the lowest scoring workRequest
        const lowestWorkRequestScore = findLowestScore(Object.keys(Memory.workRequests), roomName => Memory.rooms[roomName][RoomMemoryKeys.score] + Memory.rooms[roomName][RoomMemoryKeys.dynamicScore])
        // The best work request must be better than our worst commune
        if (lowestWorkRequestScore >= highestCommuneScore) return

        Memory.rooms[highestCommuneScoreCommuneName][RoomMemoryKeys.abandonCommune] = true
    }
}

export const roomPruningManager = new RoomPruningManager()
