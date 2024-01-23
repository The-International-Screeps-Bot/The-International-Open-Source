import { utils } from "utils/utils"
import { CommuneDataManager } from './commune/communeData'

interface RoomData {
  sourceIDs: Id<Source>[]
  fastFillerContainerLeftId: Id<StructureContainer> | false
  fastFillerContainerRightId: Id<StructureContainer> | false
  fastFillerCoords: string[]
}

/**
 * Handles cached data for rooms, including some overlapping data for communes and remotes
 */
export class RoomDataManager {
  static data: { [roomName: string]: Partial<RoomData> } = {}

  static initRooms() {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName]

      this.initRoom(room)
    }
  }

  private static initRoom(room: Room) {
    this.data[room.name] ??= {}

    if (room.controller && room.controller.my) {
      CommuneDataManager.initCommune(room)
    }
  }

  static updateRooms() {
    for (const roomName in this.data) {
      this.updateRoom(roomName)
    }
  }

  private static updateRoom(roomName: string) {
    const data = this.data[roomName]
  }
}
