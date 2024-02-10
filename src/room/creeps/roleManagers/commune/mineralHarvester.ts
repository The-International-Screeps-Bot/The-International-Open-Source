import {
  CreepMemoryKeys,
  ReservedCoordTypes,
  Result,
  RoomMemoryKeys,
} from '../../../../constants/general'
import { RoomStatsKeys } from '../../../../constants/stats'
import { StatsManager } from 'international/stats'
import { getRangeXY, getRange, areCoordsEqual } from 'utils/utils'
import { reversePosList, unpackPos } from 'other/codec'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'
import { CreepOps } from 'room/creeps/creepOps'

export class MineralHarvester extends Creep {
  update() {
    const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
    if (packedCoord) {
      this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
    }
  }

  initRun() {
    this.room.communeManager.mineralHarvestStrength +=
      MyCreepUtils.parts(this).work * HARVEST_MINERAL_POWER
  }

  advancedHarvestMineral?(mineral: Mineral) {
    this.message = '🚬'

    // Unpack the creep's packedHarvestPos

    const harvestPos = CreepOps.findMineralHarvestPos(this)
    if (!harvestPos) return Result.fail

    this.actionCoord = this.room.roomManager.mineral.pos

    // If the creep is not standing on the harvestPos

    if (getRange(this.pos, harvestPos) > 0) {
      this.message = '⏩M'

      // Make a move request to it

      this.createMoveRequestByPath(
        {
          origin: this.pos,
          goals: [{ pos: harvestPos, range: 0 }],
          avoidEnemyRanges: true,
        },
        {
          packedPath: reversePosList(this.room.memory[RoomMemoryKeys.mineralPath]),
          loose: true,
        },
      )

      return Result.action
    }

    // Harvest the mineral, informing the result if it didn't succeed

    if (this.harvest(mineral) !== OK) return Result.fail

    // Find amount of minerals harvested and record it in data

    const mineralsHarvested = Math.min(
      MyCreepUtils.parts(this).work * HARVEST_MINERAL_POWER,
      mineral.mineralAmount,
    )
    this.reserveStore[mineral.mineralType] += mineralsHarvested
    StatsManager.updateStat(this.room.name, RoomStatsKeys.MineralsHarvested, mineralsHarvested)

    this.message = `⛏️${mineralsHarvested}`
    return Result.success
  }

  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
      const creep: MineralHarvester = Game.creeps[creepName]

      // Get the mineral

      const mineral = room.roomManager.mineral

      if (mineral.mineralAmount === 0) {
        creep.advancedRecycle()
        continue
      }

      if (creep.advancedHarvestMineral(mineral) !== Result.success) continue

      const mineralContainer = room.roomManager.mineralContainer
      if (
        mineralContainer &&
        // No need to transfer if we're on top of the container
        !areCoordsEqual(mineralContainer.pos, creep.pos) &&
        creep.reserveStore[mineral.mineralType] >= creep.store.getCapacity()
      ) {
        creep.transfer(mineralContainer, mineral.mineralType)
      }
    }
  }
}
