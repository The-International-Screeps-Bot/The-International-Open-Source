import { PlayerMemoryKeys, RoomLogisticsRequestTypes } from '../../constants/general'
import { RoomStatsKeys } from '../../constants/stats'
import { PlayerManager } from 'international/players'
import { StatsManager } from 'international/stats'
import { packCoord } from 'other/codec'
import { StructureUtils } from 'room/structureUtils'
import {
  findWithHighestScore,
  findObjectWithID,
  randomTick,
  findWithLowestScore,
  scalePriority,
  Utils,
} from 'utils/utils'
import { CommuneUtils } from './communeUtils'
import { TowerUtils } from './towerUtils'

export class TowerProcs {
  static run(room: Room) {
    const towers = room.roomManager.structures.tower.filter(tower =>
      StructureUtils.isRCLActionable(tower),
    )
    if (!towers.length) {
      room.towerInferiority = room.roomManager.notMyCreeps.enemy.length > 0
      return
    }

    const actionableTowerIDs = []

    for (const tower of towers) {
      if (tower.nextStore.energy < TOWER_ENERGY_COST) continue

      actionableTowerIDs.push(tower.id)
    }

    this.createRoomLogisticsRequests(room)

    if (this.attackEnemyCreeps(room, actionableTowerIDs)) return

    if (room.roomManager.enemyAttackers.length) {
      if (this.healCreeps(room, actionableTowerIDs)) return
      if (this.repairRamparts(room, actionableTowerIDs)) return
      if (this.repairGeneral(room, actionableTowerIDs)) return
    }
  }

  private static trackEnemySquads() {}

  private static considerAttackTargets(room: Room) {
    const enemyCreeps = room.roomManager.notMyCreeps.enemy

    if (!room.communeManager.towerAttackTarget) {
      const [score, target] = findWithHighestScore(enemyCreeps, enemyCreep => {
        const damage = enemyCreep.netTowerDamage

        if (enemyCreep.owner.username === 'Invader') {
          if (damage <= 0) {
            if (room.towerInferiority) return false
            room.towerInferiority = true
            this.createPowerTasks(room)
            return false
          }
        } else {
          const playerMemory =
            Memory.players[enemyCreep.owner.username] ||
            PlayerManager.initPlayer(enemyCreep.owner.username)
          const weight = playerMemory[PlayerMemoryKeys.rangeFromExitWeight]

          if (/* findWeightedRangeFromExit(enemyCreep.pos, weight) *  */ damage < enemyCreep.hits) {
            if (room.towerInferiority) return false
            room.towerInferiority = true
            this.createPowerTasks(room)
            return false
          }
        }

        return damage
      })
      if (!target) return false

      room.communeManager.towerAttackTarget = target
    }

    // If we might be under attack from a swarm, record that the tower needs help

    if (enemyCreeps.length >= 15) {
      this.createPowerTasks(room)
      room.towerInferiority = true
    }

    return room.communeManager.towerAttackTarget
  }

  private static attackEnemyCreeps(room: Room, actionableTowerIDs: Id<StructureTower>[]) {
    if (Game.flags.disableTowerAttacks) {
      room.towerInferiority = room.roomManager.enemyAttackers.length > 0
      return false
    }
    if (!actionableTowerIDs.length) return false
    if (!room.roomManager.notMyCreeps.enemy.length) return false

    const attackTarget = this.considerAttackTargets(room)
    if (!attackTarget) {
      return this.scatterShot(room, actionableTowerIDs)
    }

    for (let i = actionableTowerIDs.length - 1; i >= 0; i--) {
      const tower = findObjectWithID(actionableTowerIDs[i])

      if (tower.attack(attackTarget) !== OK) continue

      actionableTowerIDs.splice(i, 1)

      attackTarget.reserveHits -= TowerUtils.estimateDamageNet(tower, attackTarget)
      if (attackTarget.reserveHits <= 0) return true
    }

    return true
  }

  /**
   * @description Distribute fire amoung enemies
   * Maybe we can mess up healing
   */
  private static scatterShot(room: Room, actionableTowerIDs: Id<StructureTower>[]) {
    if (actionableTowerIDs.length <= 1) return false
    if (!randomTick(200)) return false

    const enemyCreeps = room.roomManager.notMyCreeps.enemy
    if (enemyCreeps.length < Math.min(4, actionableTowerIDs.length)) return false

    let targetIndex = 0

    for (let i = actionableTowerIDs.length - 1; i >= 0; i--) {
      const tower = findObjectWithID(actionableTowerIDs[i])
      const attackTarget = enemyCreeps[targetIndex]

      if (tower.attack(attackTarget) !== OK) continue

      actionableTowerIDs.splice(i, 1)
      attackTarget.reserveHits -= TowerUtils.estimateDamageNet(tower, attackTarget)

      if (targetIndex >= enemyCreeps.length - 1) {
        targetIndex = 0
        continue
      }

      targetIndex += 1
    }

    return true
  }

  private static healCreeps(room: Room, actionableTowerIDs: Id<StructureTower>[]) {
    if (!actionableTowerIDs.length) return false

    const healTarget = TowerUtils.findHealTarget(room)
    if (!healTarget) return false

    for (let i = actionableTowerIDs.length - 1; i >= 0; i--) {
      const tower = findObjectWithID(actionableTowerIDs[i])

      if (tower.heal(healTarget) !== OK) continue

      actionableTowerIDs.splice(i, 1)
    }

    return true
  }

  private static repairRamparts(room: Room, actionableTowerIDs: Id<StructureTower>[]) {
    if (!actionableTowerIDs.length) return false

    const repairTarget = TowerUtils.findRampartRepairTarget(room)
    if (!repairTarget) return false

    for (let i = actionableTowerIDs.length - 1; i >= 0; i--) {
      const tower = findObjectWithID(actionableTowerIDs[i])
      if (tower.repair(repairTarget) !== OK) continue

      StatsManager.updateStat(
        room.name,
        RoomStatsKeys.EnergyOutputRepairWallOrRampart,
        TOWER_ENERGY_COST,
      )
      actionableTowerIDs.splice(i, 1)
    }

    return true
  }

  private static repairGeneral(room: Room, actionableTowerIDs: Id<StructureTower>[]) {
    if (!actionableTowerIDs.length) return false

    const structures = TowerUtils.findGeneralRepairTargets(room)
    if (!structures.length) return false

    for (let i = actionableTowerIDs.length - 1; i >= 0; i--) {
      const tower = findObjectWithID(actionableTowerIDs[i])

      const target = structures[structures.length - 1]

      if (tower.repair(target) !== OK) continue

      structures.pop()

      actionableTowerIDs.splice(i, 1)
    }

    return true
  }

  private static createPowerTasks(room: Room) {
    if (!room.myPowerCreeps.length) return

    for (const tower of room.roomManager.structures.tower) {
      room.createPowerRequest(tower, PWR_OPERATE_TOWER, 1)
    }
  }

  private static createRoomLogisticsRequests(room: Room) {
    for (const structure of room.roomManager.structures.tower) {
      // If don't have enough energy, request more

      if (structure.usedReserveStore < structure.store.getCapacity(RESOURCE_ENERGY) * 0.8) {
        room.createRoomLogisticsRequest({
          target: structure,
          type: RoomLogisticsRequestTypes.transfer,
          priority: scalePriority(
            structure.store.getCapacity(RESOURCE_ENERGY),
            structure.reserveStore.energy,
            20,
          ),
        })
      }

      // If there are no attackers and the tower has some energy, make offer request

      if (structure.usedReserveStore > structure.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
        room.createRoomLogisticsRequest({
          target: structure,
          maxAmount: structure.usedReserveStore - 100,
          onlyFull: true,
          type: RoomLogisticsRequestTypes.offer,
          priority: 100 /* scalePriority(
                    structure.store.getCapacity(RESOURCE_ENERGY),
                    structure.usedReserveStore,
                    10,
                    true,
                ), */,
        })
      }
    }
  }
}
