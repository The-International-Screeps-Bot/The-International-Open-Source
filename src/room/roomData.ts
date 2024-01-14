import { utils } from "utils/utils"
import { communeDataManager } from "./commune/communeData"

interface RoomData {
  sourceIDs: Id<Source>[]
}

/**
 * Handles cached data for rooms, including some overlapping data for communes and remotes
 */
export class RoomDataManager {
  data: {[roomName: string]: Partial<RoomData>} = {}

  initRooms() {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName]

      this.initRoom(room)
    }
  }

  private initRoom(room: Room) {
    this.data[room.name] ??= {}

    if (room.controller && room.controller.my) {

      communeDataManager.initCommune(room)
    }
  }

  updateRooms() {
    for (const roomName in this.data) {


      this.updateRoom(roomName)
    }
  }

  private updateRoom(roomName: string) {

    const data = this.data[roomName]


  }
}

export const roomDataManager = new RoomDataManager()
