import { randomIntRange } from "./utils"

class RoomPruningManager {
    sleepTime = randomIntRange(50000, 100000)
    lastAttempt: number

    run() {
        return

        if (this.lastAttempt + this.sleepTime > Game.time) return

        // Make sure all rooms are max RCL
        // Temple rooms?

        let highestScore = 0
        let highestScoreCommuneName: string

        for (const roomName of global.communes) {

            const room = Game.rooms[roomName]

            if (room.controller.level < 8) {

                this.lastAttempt = Game.time
                return
            }

            const score = Memory.rooms[roomName].S
            if (score <= highestScore) continue

            highestScore = score
            highestScoreCommuneName = roomName
        }

        // Find the lowest scoring claimRequest that is also lower than the highest scoring commune

        let lowestScore = 0
        let lowestScoreClaimRequestName: string

        /*
        for (const )
        */

        Memory.rooms[highestScoreCommuneName].Ab = true
    }
}


export const roomPruningManager = new RoomPruningManager()
