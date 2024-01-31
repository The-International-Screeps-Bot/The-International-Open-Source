import { RoomMemoryKeys, WorkRequestKeys, maxControllerLevel } from '../constants/general'
import { findLowestScore, randomIntRange } from '../utils/utils'
import { Sleepable, StaticSleepable } from 'utils/sleepable'
import { CollectiveManager } from './collective'

export class RoomPruningManager extends StaticSleepable {
  static sleepFor = randomIntRange(50000, 100000)
  static run() {
    if (this.isSleepingResponsive()) return

    // Find the highest scoring commune. Remember that higher score is less preferable.

    let maxRCLRooms = 0
    let highestCommuneScore = 0
    let highestCommuneScoreCommuneName: string

    for (const roomName of CollectiveManager.communes) {
      const room = Game.rooms[roomName]
      if (room.controller.level < maxControllerLevel) return

      maxRCLRooms += 1

      const roomMemory = Memory.rooms[roomName]
      const score = roomMemory[RoomMemoryKeys.score] + roomMemory[RoomMemoryKeys.dynamicScore]

      if (score <= highestCommuneScore) continue

      highestCommuneScore = score
      highestCommuneScoreCommuneName = roomName
    }

    // Ensure that every room is max RCL
    // What about temple rooms?
    if (maxRCLRooms !== CollectiveManager.communes.size) return

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
