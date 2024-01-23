import { RoomUtils } from 'room/roomUtils'

export class SourceProcs {
  createPowerTasks(room: Room) {
    if (!room.myPowerCreeps.length) return

    const sources = RoomUtils.getSources(room)
    for (const source of sources) {
      room.createPowerTask(source, PWR_REGEN_SOURCE, 10)
    }
  }
}

export const sourceProcs = new SourceProcs()
