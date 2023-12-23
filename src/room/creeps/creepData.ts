import { util } from "chai"
import { utils } from "utils/utils"

export type Boosts = Partial<{[ key in MineralBoostConstant]: number }>

export interface CreepData {
  parts?: Partial<{[key in BodyPartConstant]: number }>
  /**
   * update when applying boosts
   */
  upgradeStrength?: number
  /**
   * update when applying boosts
   */
  boosts?: Boosts
  /**
   * update when applying boosts
   */
  defenceStrength?: number
}
/**
 * Handles cached data for creeps we own
 */
export class CreepDataManager {
  creepsData: {[creepName: string]: CreepData } = {}

  run() {

    if (utils.isTickInterval(15)) {
      this.updateCreeps()
    }
  }

  updateCreeps() {

    for (const creepName in Game.creeps) {

      /* delete . */
    }
  }
}

export const creepDataManager = new CreepDataManager()
