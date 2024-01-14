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
  data: { [creepName: string]: Partial<CreepData> } = {}

  updateCreeps() {
    if (utils.isTickInterval(15)) {
      for (const creepName in Game.creeps) {
        this.updateCreep(creepName)
      }
    }
  }

  private updateCreep(creepName: string) {
    const data = this.data[creepName]
    /* delete . */
  }
}

export const creepDataManager = new CreepDataManager()
