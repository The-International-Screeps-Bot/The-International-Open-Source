import { roomUtils } from 'room/roomUtils'

export class SourceProcs {
  createPowerTasks(room: Room) {
    if (!room.myPowerCreeps.length) return

    const sources = roomUtils.getSources(room)
    for (const source of sources) {
      room.createPowerTask(source, PWR_REGEN_SOURCE, 10)
    }
  }
}

export const sourceProcs = new SourceProcs()
