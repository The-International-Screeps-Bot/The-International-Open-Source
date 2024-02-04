import { util } from "chai"
import { Utils } from 'utils/utils'

export type Boosts = Partial<{ [key in MineralBoostConstant]: number }>

export interface CreepData {
  parts: Partial<{ [key in BodyPartConstant]: number }>
  /**
   * update when applying boosts
   */
  upgradeStrength: number
  /**
   * update when applying boosts
   */
  boosts: Boosts
  /**
   * update when applying boosts
   */
  defenceStrength: number
}

/**
 * Inter-tick creep data
 */
export const creepData: { [creepName: string]: Partial<CreepData> } = {}

/**
 * Handles cached data for creeps we own
 */
export class CreepDataProcs {
  static initCreep(creepName: string) {
    creepData[creepName] ??= {}
  }

  static updateCreeps() {
    for (const creepName in creepData) {
      this.updateCreep(creepName)
    }
  }

  private static updateCreep(creepName: string) {
    if (!Game.creeps[creepName]) {
      delete creepData[creepName]
      return
    }

    const data = creepData[creepName]

    /* .delete */

    if (Utils.isTickInterval(15)) {
    }
  }
}
