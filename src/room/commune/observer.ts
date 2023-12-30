import { customLog } from 'utils/logging'
import { forRoomNamesAroundRangeXY, randomTick, utils } from 'utils/utils'
import { CommuneManager } from './commune'
import { RoomMemoryKeys } from 'international/constants'
import { roomNameUtils } from 'room/roomNameUtils'
import { roomUtils } from 'room/roomUtils'

export class ObserverManager {
  communeManager: CommuneManager
  scoutTarget: string
  observer: StructureObserver

  constructor(communeManager: CommuneManager) {
    this.communeManager = communeManager
  }

  preTickRun() {
    // Run only every so often
    if (!utils.isTickInterval(10)) return

    this.observer = this.communeManager.room.roomManager.structures.observer[0]
    if (!this.observer) return

    const scoutTarget = this.findScoutTarget()
    if (!scoutTarget) return

    this.observer.observeRoom(scoutTarget)
  }

  findScoutTarget() {
    const roomCoord = roomNameUtils.pack(this.communeManager.room.name)

    let scoutTarget: string | undefined
    let highestScore = 0

    forRoomNamesAroundRangeXY(roomCoord.x, roomCoord.y, OBSERVER_RANGE, (x, y) => {
      const roomName = roomNameUtils.unpackXY(x, y)

      const score = this.findRoomNameScore(roomName)
      if (score <= highestScore) return

      highestScore = score
      scoutTarget = roomName
    })

    return scoutTarget
  }

  private findRoomNameScore(roomName: string) {
    const roomsDistance =
      OBSERVER_RANGE - Game.map.getRoomLinearDistance(roomName, this.communeManager.room.name)

    const roomMemory = Memory.rooms[roomName]
    if (!roomMemory) {
      const score = roomsDistance * 1000
      return score
    }

    // We have memory of the room. Consider when we last scouted into the score

    // The time that's surpassed since we last scouted the room
    const scoutDifference = Game.time - (roomMemory[RoomMemoryKeys.lastScout] || 0)

    const score = scoutDifference + roomsDistance * 10
    return score
  }
}
