import { Sleepable, StaticSleepable } from 'utils/sleepable'
import { RoomMemoryKeys } from '../constants/general'

/**
 * Intended to clean Memory, global, segments from stale data
 */
export class GarbageCollector extends StaticSleepable {
  // Clean rooms that haven't been scouted for a certain amount of ticks
  static cleanRoomThreshold = 300000
  static sleepFor = 100000
  static tryRun() {
    if (this.isSleepingResponsive()) return

    this.cleanRooms()
    this.cleanPlayers()
  }
  static cleanRooms() {
    for (const roomName in Memory.rooms) {
      const roomMemory = Memory.rooms[roomName]
      if (roomMemory[RoomMemoryKeys.lastScout] && Game.time - roomMemory[RoomMemoryKeys.lastScout] < this.cleanRoomThreshold) {
        continue
      }

      delete Memory.rooms[roomName]
    }
  }
  static cleanPlayers() {}
}
