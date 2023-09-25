import { RoomMemoryKeys, WorkRequestKeys, maxControllerLevel } from './constants'
import { findLowestScore, randomIntRange } from '../utils/utils'
import { Sleepable } from 'utils/Sleepable'
import { collectiveManager } from './collective'

class RoomPruningManager extends Sleepable {
    sleepFor = randomIntRange(50000, 100000)
    run() {
        if (this.isSleepingResponsive()) return

        // Make sure all rooms are max RCL
        // Temple rooms?

        let rooms = 0
        let highestCommuneScore = 0
        let highestCommuneScoreCommuneName: string

        for (const roomName of collectiveManager.communes) {
            const room = Game.rooms[roomName]
            if (room.controller.level < maxControllerLevel) return

            rooms += 1

            const roomMemory = Memory.rooms[roomName]
            const score = roomMemory[RoomMemoryKeys.score] + roomMemory[RoomMemoryKeys.dynamicScore]

            if (score <= highestCommuneScore) continue

            highestCommuneScore = score
            highestCommuneScoreCommuneName = roomName
        }

        // Have multiple rooms before we unclaim
        if (rooms <= 1) return

        // Find the lowest scoring workRequest
        const lowestWorkRequestScore = findLowestScore(
            Object.keys(Memory.workRequests),
            roomName =>
                Memory.rooms[roomName][RoomMemoryKeys.score] +
                Memory.rooms[roomName][RoomMemoryKeys.dynamicScore],
        )
        // The best work request must be better than our worst commune
        if (lowestWorkRequestScore >= highestCommuneScore) return

        Memory.rooms[highestCommuneScoreCommuneName][RoomMemoryKeys.abandonCommune] = true
    }
}

export const roomPruningManager = new RoomPruningManager()
