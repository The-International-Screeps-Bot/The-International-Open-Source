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
 * Inter-tick data for communes
 */
export const communeData: { [roomName: string]: Partial<CommuneData>} = {}

/**
 * Handles cached data for communes
 */
export class CommuneDataProcs {

  /**
   * Called by the room's RoomManager
   */
  static initCommune(room: Room) {
    communeData[room.name] ??= {}
  }

  static updateCommunes() {
    for (const roomName in communeData) {
      this.updateCommune(roomName)
    }
  }

  private static updateCommune(roomName: string) {
    const data = communeData[roomName]

    if (utils.isTickInterval(10)) {
      delete data.estimatedCommuneSourceIncome
      delete data.towerRampartRepairTreshold
    }
  }
}
