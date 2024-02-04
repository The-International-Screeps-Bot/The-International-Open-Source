import { Utils } from 'utils/utils'
import { CommuneDataOps } from './commune/communeData'

export interface RoomData {
  fastFillerContainerLeftId: Id<StructureContainer> | false
  fastFillerContainerRightId: Id<StructureContainer> | false
  fastFillerCoords: string[]
  terrainBinary: Uint8Array
}

/**
 * Inter-tick room data
 */
export const roomData: { [roomName: string]: Partial<RoomData> } = {}

/**
 * Handles cached data for rooms, including some overlapping data for communes and remotes
 */
export class RoomDataOps {
  static initRooms() {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName]

      this.initRoom(room)
    }
  }

  private static initRoom(room: Room) {
    roomData[room.name] ??= {}

    if (room.controller && room.controller.my) {
      CommuneDataOps.initCommune(room)
    }
  }

  static updateRooms() {
    for (const roomName in roomData) {
      this.updateRoom(roomName)
    }
  }

  private static updateRoom(roomName: string) {
    const data = roomData[roomName]

    if (Utils.isTickInterval(100)) {

      delete data.terrainBinary
      delete roomData[roomName]
    }
  }
}
