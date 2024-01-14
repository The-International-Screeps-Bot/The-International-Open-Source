import { towerPowers } from "international/constants"
import { findWithLowestScore, getRange } from "utils/utils"
import { communeDataManager } from "./communeData"
import { communeUtils } from "./communeUtils"
import { packCoord } from "other/codec"

const minTowerRampartRepairTreshold = RAMPART_DECAY_AMOUNT * 1.5

export class TowerUtils {
  /**
   * Estimate the damage a normal tower would do over a given distance. Does not account for effects
   */
  estimateRangeDamage(origin: Coord, goal: Coord) {
    let damage = TOWER_POWER_ATTACK

    let range = getRange(origin, goal)

    if (range > TOWER_OPTIMAL_RANGE) {
      if (range > TOWER_FALLOFF_RANGE) range = TOWER_FALLOFF_RANGE

      damage -=
        (damage * TOWER_FALLOFF * (range - TOWER_OPTIMAL_RANGE)) /
        (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE)
    }

    return Math.floor(damage)
  }

  estimateDamageGross(tower: StructureTower, targetCoord: Coord) {
    let damage = this.estimateRangeDamage(tower.pos, targetCoord)

    for (const powerType of towerPowers) {
      const effect = tower.effectsData.get(powerType) as PowerEffect
      if (!effect) continue

      damage *= Math.floor(POWER_INFO[powerType].effect[effect.level - 1])
    }

    return Math.floor(damage)
  }

  estimateDamageNet(tower: StructureTower, target: Creep) {
    let damage = this.estimateDamageGross(tower, target.pos)
    damage *= target.defenceStrength

    damage -= target.macroHealStrength
    return Math.floor(damage)
  }

  getRampartRepairTreshold(room: Room) {
    const data = communeDataManager.data[room.name]
      if (data.towerRampartRepairTreshold !== undefined) return data.towerRampartRepairTreshold

      let rampartRepairTreshold = minTowerRampartRepairTreshold

      const enemySquadData = room.roomManager.enemySquadData
      rampartRepairTreshold += enemySquadData.highestDismantle
      // Melee damage includes ranged
      rampartRepairTreshold += enemySquadData.highestMeleeDamage

      data.towerRampartRepairTreshold = rampartRepairTreshold
      return rampartRepairTreshold
  }

  findHealTarget(room: Room) {

    if (room.roomManager.enemyAttackers.length) {
      return room.roomManager.myDamagedCreeps.find(creep => {
        return !creep.isOnExit && !room.roomManager.enemyThreatCoords.has(packCoord(creep.pos))
      })
    }

    let healTargets: (Creep | PowerCreep)[] = []

    // Construct heal targets from my and allied damaged creeps in the this

    healTargets = room.roomManager.myDamagedCreeps.concat(room.roomManager.allyDamagedCreeps)
    healTargets = healTargets.concat(room.roomManager.myDamagedPowerCreeps)

    return healTargets.find(creep => !creep.isOnExit)
  }

  findRampartRepairTarget(room: Room) {
    const ramparts = room.roomManager.enemyAttackers.length
      ? room.communeManager.defensiveRamparts
      : communeUtils.getRampartRepairTargets(room)

    const [score, rampart] = findWithLowestScore(ramparts, rampart => {
      let score = rampart.hits
      // Account for decay amount: percent of time to decay times decay amount
      score -= Math.floor(
        (RAMPART_DECAY_AMOUNT * (RAMPART_DECAY_TIME - rampart.ticksToDecay)) / RAMPART_DECAY_TIME,
      )

      return score
    })

    const rampartRepairThreshold = towerUtils.getRampartRepairTreshold(room)

    // Make sure the rampart is below the treshold
    if (score > rampartRepairThreshold) return false
    return rampart
  }

  findGeneralRepairTargets(room: Room) {
    let structures: Structure[] = room.roomManager.structures.spawn
    structures = structures.concat(room.roomManager.structures.tower)

    return structures
  }
}

export const towerUtils = new TowerUtils()
