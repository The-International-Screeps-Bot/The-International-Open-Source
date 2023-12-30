import { communeDataManager } from "./commune/communeData"

interface RoomData {

}

/**
 * Handles cached data for rooms, including some overlapping data for communes and remotes
 */
export class RoomDataManager {
  data: {[roomName: string]: Partial<RoomData>} = {}

  updateRooms() {
    for (const roomName in Game.rooms) {

      this.updateRoom(Game.rooms[roomName])
    }
  }

  private updateRoom(room: Room) {

    this.data[room.name] ??= {}

    if (room.controller && room.controller.my) {

      communeDataManager.updateCommune(room)
    }
  }
}

export const roomDataManager = new RoomDataManager()
