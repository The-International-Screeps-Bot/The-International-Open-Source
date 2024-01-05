import { collectiveManager } from "international/collective";
import { utils } from "utils/utils";

interface CommuneData {
  /**
   * The last registered room controller level for the commune
   */
  registeredRCL: number
  generalRepairStructureCoords: Set<string>
  maxUpgradeStrength: number
  estimatedCommuneSourceIncome: number[]
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
    const data = this.data[room.name]

    if (utils.isTickInterval(10)) {

      delete data.estimatedCommuneSourceIncome
    }
  }
}

export const communeDataManager = new CommuneDataManager()
