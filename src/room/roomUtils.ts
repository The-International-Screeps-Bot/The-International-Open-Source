import { RoomMemoryKeys, RoomTypes } from "international/constants"
import { packCoord } from "other/codec"
import { roomDataManager } from "./roomData"
import { findObjectWithID } from "utils/utils"

export class RoomUtils {
  getRemoteRepairStructures(room: Room) {

    const repairStructures: (StructureContainer | StructureRoad)[] = []
  }

  getSources(room: Room): Source[] {
    const data = roomDataManager.data[room.name]
    if (data.sourceIDs !== undefined) {
      return data.sourceIDs.map(ID => findObjectWithID(ID))
    }

    const sources = room.find(FIND_SOURCES)
    const sourceIDs = sources.map(source => source.id)

    data.sourceIDs = sourceIDs
    return sources
  }
}

export const roomUtils = new RoomUtils()
