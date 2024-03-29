import { Boosts, creepDataManager } from "./creepData"

export class MyCreepUtils {
  /**
   * provides a cached number of parts for creeps we own
   */
  parts(creep: Creep) {
    const data = creepDataManager.creepsData[creep.name].parts
    if (data) return data

    const parts: typeof data = {}

    // initialize each part
    for (const partType of BODYPARTS_ALL) parts[partType] = 0
    // +1 for every part to its type category
    for (const part of creep.body) parts[part.type] += 1

    creepDataManager.creepsData[creep.name].parts = parts
    return parts
  }

  boosts(creep: Creep) {
    const data = creepDataManager.creepsData[creep.name].boosts
    if (data) return data

    const boosts: typeof data = {}

    for (const part of creep.body) {
        const boost = part.boost as MineralBoostConstant
        if (!boost) continue

        if (!boosts[boost]) {

          boosts[boost] = 1
          continue
        }

        boosts[boost] += 1
    }

    creepDataManager.creepsData[creep.name].boosts = boosts
    return boosts
  }

  upgradeStrength(creep: Creep) {
    const data = creepDataManager.creepsData[creep.name].upgradeStrength
    if (data) return data

    const upgradeStrength = this.findUpgradeStrength(this.parts(creep).work, this.boosts(creep))

    creepDataManager.creepsData[creep.name].upgradeStrength = upgradeStrength
    return data
  }

  findUpgradeStrength(workParts: number, boosts: Boosts) {

    if (boosts.XGH2O > 0) {
      return (workParts * BOOSTS.work.XGH2O.upgradeController)
    }

    if (boosts.GH2O > 0) {
      return (workParts * BOOSTS.upgrade.GH2O.upgradeController)
    }

    if (boosts.GH > 0) {
      return (workParts * BOOSTS.upgrade.GH.upgradeController)
    }

    return workParts
  }
}

export const myCreepUtils = new MyCreepUtils()
