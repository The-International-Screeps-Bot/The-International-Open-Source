import { CollectiveManager } from 'international/collective'
import { utils } from 'utils/utils'

interface CommuneData {
  /**
   * The last registered room controller level for the commune
   */
  registeredRCL: number
  generalRepairStructureCoords: Set<string>
  maxUpgradeStrength: number
  estimatedCommuneSourceIncome: number[]
  towerRampartRepairTreshold: number
  rampartDamageCoords: number
  /**
   * The amount of hits for each rampart the previous tick, if exists
   */
  previousRampartHits: number
}

/**
 * Handles cached data for communes
 */
export class CommuneDataManager {
  data: { [roomName: string]: Partial<CommuneData> } = {}

  /**
   * Called by the room's RoomManager
   */
  initCommune(room: Room) {
    this.data[room.name] ??= {}
  }

  updateCommunes() {
    for (const roomName in this.data) {
      this.updateCommune(roomName)
    }
  }

  private updateCommune(roomName: string) {
    const data = this.data[roomName]

    if (utils.isTickInterval(10)) {
      delete data.estimatedCommuneSourceIncome
      delete data.towerRampartRepairTreshold
    }
  }
}

export const communeDataManager = new CommuneDataManager()
