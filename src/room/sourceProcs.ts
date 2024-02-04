import { RoomUtils } from 'room/roomUtils'
import { RoomOps } from './roomOps'

export class SourceProcs {
  static createPowerTasks(room: Room) {
    if (!room.myPowerCreeps.length) return

    const sources = RoomOps.getSources(room)
    for (const source of sources) {
      room.createPowerRequest(source, PWR_REGEN_SOURCE, 10)
    }
  }
}
