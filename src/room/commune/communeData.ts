import { CollectiveManager } from 'international/collective'
import { Utils } from 'utils/utils'
import { ResourceTargets } from './commune'

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
  resourceTargets: ResourceTargets
  minStoredEnergy: number
}

/**
 * Inter-tick data for communes
 */
export const communeData: { [roomName: string]: Partial<CommuneData> } = {}

/**
 * Handles cached data for communes
 */
export class CommuneDataOps {
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

    if (Utils.isTickInterval(10)) {
      delete data.estimatedCommuneSourceIncome
      delete data.towerRampartRepairTreshold
      delete data.minStoredEnergy
    }

    if (Utils.isTickInterval(100)) {
      delete data.resourceTargets
      delete communeData[roomName]
    }
  }
}
