import { RoomMemoryKeys } from '../../constants/general'
import { RoomNameUtils } from 'room/roomNameUtils'
import { forRoomNamesAroundRangeXY, Utils } from 'utils/utils'

export class ObserverProcs {
  static preTickRun(room: Room) {
    // Run only every so often
    if (!Utils.isTickInterval(10)) return

    const observer = room.roomManager.structures.observer[0]
    if (!observer) return

    const scoutTarget = this.findScoutTarget(room)
    if (!scoutTarget) return

    observer.observeRoom(scoutTarget)
  }

  static findScoutTarget(room: Room) {
    const roomCoord = RoomNameUtils.pack(room.name)

    let scoutTarget: string | undefined
    let highestScore = 0

    forRoomNamesAroundRangeXY(roomCoord.x, roomCoord.y, OBSERVER_RANGE, (x, y) => {
      const scoutRoomName = RoomNameUtils.unpackXY(x, y)

      const score = this.findRoomNameScore(room, scoutRoomName)
      if (score <= highestScore) return

      highestScore = score
      scoutTarget = scoutRoomName
    })

    return scoutTarget
  }

  private static findRoomNameScore(room: Room, scoutRoomName: string) {
    const roomsDistance = OBSERVER_RANGE - Game.map.getRoomLinearDistance(room.name, scoutRoomName)

    const scoutRoomMemory = Memory.rooms[scoutRoomName]
    if (!scoutRoomMemory) {
      const score = roomsDistance * 1000
      return score
    }

    // We have memory of the room. Consider when we last scouted into the score

    // The time that's surpassed since we last scouted the room
    const scoutDifference = Game.time - (scoutRoomMemory[RoomMemoryKeys.lastScout] || 0)

    const score = scoutDifference + roomsDistance * 10
    return score
  }
}
