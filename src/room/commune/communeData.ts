import { collectiveManager } from "international/collective";

interface CommuneData {
  /**
   * The last registered room controller level for the commune
   */
  registeredRCL: number
  generalRepairStructureCoords: Set<string>
}

/**
 * Handles cached data for communes
 */
export class CommuneDataManager {
  data: {[roomName: string]: Partial<CommuneData>} = {}

  /**
   * Handled by the RoomDataManager
   */
  updateCommune(room: Room) {

    this.data[room.name] ??= {}
  }
}

export const communeDataManager = new CommuneDataManager()
