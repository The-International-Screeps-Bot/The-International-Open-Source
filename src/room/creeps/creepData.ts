import { util } from "chai"
import { utils } from "utils/utils"

export type Boosts = Partial<{[ key in MineralBoostConstant]: number }>

export interface CreepData {
  parts: Partial<{[key in BodyPartConstant]: number }>
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
 * Handles cached data for creeps we own
 */
export class CreepDataManager {
  static data: { [creepName: string]: Partial<CreepData> } = {}

  static initCreep(creepName: string) {
    this.data[creepName] ??= {}
  }

  static updateCreeps() {
    for (const creepName in this.data) {
      this.updateCreep(creepName)
    }
  }

  private static updateCreep(creepName: string) {
    if (!Game.creeps[creepName]) {
      delete this.data[creepName]
      return
    }

    const data = this.data[creepName]

    /* .delete */

    if (utils.isTickInterval(15)) {
    }
  }
}
