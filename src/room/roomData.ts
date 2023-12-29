interface RoomData {

}

/**
 * Handles cached data for rooms, including some overlapping data for communes and remotes
 */
export class RoomDataManager {
  data: {[roomName: string]: Partial<RoomData>}

  updateRooms() {
    for (const roomName in Game.rooms) {

      this.updateRoom(Game.rooms[roomName])
    }
  }

  private updateRoom(room: Room) {

    this.data[room.name] ??= {}
  }
}

export const roomDataManager = new RoomDataManager()
