import {
  CreepMemoryKeys,
  packedPosLength,
  ReservedCoordTypes,
  Result,
  RoomLogisticsRequestTypes,
  RoomMemoryKeys,
  WorkTypes,
} from '../../../../constants/general'
import { RoomStatsKeys } from '../../../../constants/stats'
import { StatsManager } from 'international/stats'
import {
  findCoordsInsideRect,
  findObjectWithID,
  getRangeXY,
  getRange,
  scalePriority,
} from 'utils/utils'
import { packCoord, packPos, reversePosList, unpackPos } from 'other/codec'
import { Hauler } from './hauler'
import { CreepUtils } from 'room/creeps/creepUtils'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'
import { StructureUtils } from 'room/structureUtils'
import { CreepOps } from 'room/creeps/creepOps'

export class SourceHarvester extends Creep {
  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  public isDying() {
    // Stop if creep is spawning

    if (this.spawning) return false

    // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

    if (
      this.ticksToLive >
      this.body.length * CREEP_SPAWN_TIME +
        this.room.memory[RoomMemoryKeys.communeSourcePaths][
          this.memory[CreepMemoryKeys.sourceIndex]
        ].length /
          packedPosLength
    )
      return false

    return true
  }

  update() {
    const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
    if (packedCoord) {
      if (this.isDying()) {
        this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.dying)
      } else {
        this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
      }
    }
  }

  initRun() {
    const { room } = this

    if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined && !this.isDying())
      room.creepsOfSource[this.memory[CreepMemoryKeys.sourceIndex]].push(this.name)

    const source = this.room.roomManager.communeSources[this.memory[CreepMemoryKeys.sourceIndex]]

    if (getRange(this.pos, source.pos) <= 1) {
      CreepOps.harvestSource(this, source)
    }
  }

  buildContainer?() {}

  travelToSource?(): number {
    this.message = '🚬'

    // Unpack the harvestPos

    const harvestPos = CreepOps.findCommuneSourceHarvestPos(
      this,
      this.memory[CreepMemoryKeys.sourceIndex],
    )
    if (!harvestPos) return Result.fail

    this.actionCoord =
      this.room.roomManager.communeSources[this.memory[CreepMemoryKeys.sourceIndex]].pos

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRange(this.pos, harvestPos) === 0) return Result.success

    // If the creep's movement type is pull

    if (this.memory[CreepMemoryKeys.getPulled]) return Result.noAction

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    this.message = `⏩${this.memory[CreepMemoryKeys.sourceIndex]}`

    if (
      !this.room.memory[RoomMemoryKeys.communeSourcePaths][this.memory[CreepMemoryKeys.sourceIndex]]
    ) {
      throw Error('no path for sourceHarvester ' + this.room.name)
    }

    this.createMoveRequestByPath(
      {
        origin: this.pos,
        goals: [
          {
            pos: harvestPos,
            range: 0,
          },
        ],
        avoidEnemyRanges: true,
      },
      {
        packedPath: reversePosList(
          this.room.memory[RoomMemoryKeys.communeSourcePaths][
            this.memory[CreepMemoryKeys.sourceIndex]
          ],
        ),
      },
    )

    return Result.action
  }

  transferToSourceStructures?(): boolean {
    // If the creep is not nearly full, stop

    if (this.store.getCapacity() - this.nextStore.energy > 0) return false

    if (this.transferToSourceExtensions()) return true
    if (this.transferToSourceLink()) return true
    return false
  }

  transferToSourceExtensions?(): boolean {
    const { room } = this

    // If all spawningStructures are filled, inform false

    if (room.energyAvailable === room.energyCapacityAvailable) return false

    const structure = room.findStructureInRange(this.pos, 1, structure => {
      return (
        structure.structureType === STRUCTURE_EXTENSION &&
        (structure as AnyStoreStructure).store.getCapacity(RESOURCE_ENERGY) -
          structure.nextStore.energy >
          0
      )
    })
    if (!structure) return false

    const result = this.transfer(structure, RESOURCE_ENERGY)

    if (result !== OK) return false
    return true
  }

  transferToSourceLink?(): boolean {
    const { room } = this

    // Find the sourceLink for the creep's source, Inform false if the link doesn't exist

    const sourceLink = room.communeManager.sourceLinks[this.memory[CreepMemoryKeys.sourceIndex]]
    if (!sourceLink) return false

    // Try to transfer to the sourceLink and inform true

    const result = this.transfer(sourceLink, RESOURCE_ENERGY)

    if (result !== OK) return false
    return true
  }

  maintainContainer?(sourceContainer: StructureContainer): boolean {
    if (this.worked) return false
    const source = this.room.roomManager.communeSources[this.memory[CreepMemoryKeys.sourceIndex]]
    if (
      source.energy * ENERGY_REGEN_TIME >
      source.ticksToRegeneration * source.energyCapacity * 0.9
    )
      return false

    if (!sourceContainer) {
      if (this.nextStore.energy < MyCreepUtils.parts(this).work) {
        if (this.movedResource) return false

        const result = CreepOps.runRoomLogisticsRequestAdvanced(this, {
          resourceTypes: new Set([RESOURCE_ENERGY]),
          types: new Set<RoomLogisticsRequestTypes>([
            RoomLogisticsRequestTypes.withdraw,
            RoomLogisticsRequestTypes.pickup,
            RoomLogisticsRequestTypes.offer,
          ]),
          conditions: request => {
            getRange(findObjectWithID(request.targetID).pos, this.pos) <= 1
          },
        })
        if (result !== Result.success) return false
      }

      const cSite = this.room.findCSiteAtCoord(
        this.pos,
        cSite => cSite.structureType === STRUCTURE_CONTAINER,
      )
      if (!cSite) return false

      this.build(cSite)
      return true
    }

    const workPartCount = MyCreepUtils.parts(this).work

    // If the sourceContainer doesn't need repairing, inform false
    if (sourceContainer.hitsMax - sourceContainer.hits < workPartCount * REPAIR_POWER) return false

    // If the creep doesn't have enough energy and it hasn't yet moved resources, withdraw from the sourceContainer

    if (this.nextStore.energy < workPartCount) {
      if (this.movedResource) return false

      const result = CreepOps.runRoomLogisticsRequestAdvanced(this, {
        resourceTypes: new Set([RESOURCE_ENERGY]),
        types: new Set<RoomLogisticsRequestTypes>([
          RoomLogisticsRequestTypes.withdraw,
          RoomLogisticsRequestTypes.pickup,
          RoomLogisticsRequestTypes.offer,
        ]),
        conditions: request => {
          getRange(findObjectWithID(request.targetID).pos, this.pos) <= 1
        },
      })
      if (result !== Result.success) return false
    }

    // Try to repair the target

    const repairResult = this.repair(sourceContainer)

    // If the repair worked

    if (repairResult === OK) {
      // Record that the creep has worked

      this.worked = WorkTypes.repair

      // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

      const energySpentOnRepairs = Math.min(
        workPartCount,
        (sourceContainer.hitsMax - sourceContainer.hits) / REPAIR_POWER,
        this.store.energy,
      )

      // Add repair points to total repairPoints counter and say the success
      StatsManager.updateStat(
        this.room.name,
        RoomStatsKeys.EnergyOutputRepairOther,
        energySpentOnRepairs,
      )
      this.message = `🔧${energySpentOnRepairs * REPAIR_POWER}`

      // Inform success

      return true
    }

    // Inform failure

    return false
  }

  transferToNearbyCreep?(): boolean {
    const sourceContainer =
      this.room.roomManager.sourceContainers[this.memory[CreepMemoryKeys.sourceIndex]]
    if (sourceContainer) return false

    const sourceLink =
      this.room.communeManager.sourceLinks[this.memory[CreepMemoryKeys.sourceIndex]]
    if (sourceLink && StructureUtils.isRCLActionable(sourceLink)) return false

    // If the creep isn't full enough to justify a request

    if (this.nextStore.energy < this.store.getCapacity() * 0.5) return false

    this.room.createRoomLogisticsRequest({
      target: this,
      type: RoomLogisticsRequestTypes.withdraw,
      priority: 100,
    })
    return true
  }

  run?() {
    if (this.travelToSource() !== Result.success) return
    if (this.transferToSourceStructures()) return

    // Try to repair the sourceContainer

    this.maintainContainer(
      this.room.roomManager.sourceContainers[this.memory[CreepMemoryKeys.sourceIndex]],
    )

    if (this.transferToNearbyCreep()) return
  }

  static roleManager(room: Room, creepsOfRole: string[]): void | boolean {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
      const creep: SourceHarvester = Game.creeps[creepName]
      creep.run()
    }
  }
}
