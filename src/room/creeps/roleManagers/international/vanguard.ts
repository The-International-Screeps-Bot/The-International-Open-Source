import {
  WorkRequestKeys,
  CreepMemoryKeys,
  Result,
  RoomTypes,
  ReservedCoordTypes,
} from '../../../../constants/general'
import { findObjectWithID, getRangeXY, getRange } from 'utils/utils'
import { unpackCoord } from 'other/codec'
import { CreepUtils } from 'room/creeps/creepUtils'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'
import { CreepOps } from 'room/creeps/creepOps'

export class Vanguard extends Creep {
  constructor(creepID: Id<Creep>) {
    super(creepID)
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
    if (this.isDying()) return

    if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined)
      this.room.creepsOfSource[this.memory[CreepMemoryKeys.sourceIndex]].push(this.name)

    const request = Memory.workRequests[this.memory[CreepMemoryKeys.workRequest]]
    if (!request) return

    request[WorkRequestKeys.vanguard] -= MyCreepUtils.parts(this).work
  }

  /**
   *
   */
  travelToSource?(sourceIndex: number): boolean {
    const { room } = this

    this.message = '🚬'

    const harvestPos = CreepOps.findCommuneSourceHarvestPos(
      this,
      this.memory[CreepMemoryKeys.sourceIndex],
    )
    if (!harvestPos) return true

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRange(this.pos, harvestPos) === 0) return false

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    this.message = `⏩ ${sourceIndex}`

    this.createMoveRequest({
      origin: this.pos,
      goals: [
        {
          pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
          range: 0,
        },
      ],
      avoidEnemyRanges: true,
    })

    return true
  }

  upgradeRoom?(conditions?: () => boolean) {
    if (conditions && !conditions()) return false

    const { controller } = this.room
    Memory.creeps[this.name][CreepMemoryKeys.targetID] = controller.id

    if (getRange(this.pos, controller.pos) > 3) {
      this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: controller.pos, range: 3 }],
      })

      return true
    }

    this.upgradeController(controller)

    if (this.store.energy - MyCreepUtils.parts(this).work * UPGRADE_CONTROLLER_POWER <= 0) {
      delete Memory.creeps[this.name][CreepMemoryKeys.targetID]
    }

    return true
  }

  findRampartTarget?() {
    const creepMemory = Memory.creeps[this.name]
    if (creepMemory[CreepMemoryKeys.targetID]) {
      const rampartTarget = Game.getObjectById(
        creepMemory[CreepMemoryKeys.targetID],
      ) as StructureRampart
      if (rampartTarget && rampartTarget instanceof StructureRampart) {
        return rampartTarget
      }
    }

    const rampartTarget = this.room.roomManager.structures.rampart.find(
      rampart => rampart.hits < 20000,
    )

    return rampartTarget
  }

  repairRampart?() {
    const rampartTarget = this.findRampartTarget()
    if (!rampartTarget) return false

    const creepMemory = Memory.creeps[this.name]
    creepMemory[CreepMemoryKeys.targetID] = rampartTarget.id

    if (getRange(this.pos, rampartTarget.pos) > 3) {
      this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: rampartTarget.pos, range: 3 }],
      })

      return true
    }

    this.repair(rampartTarget)

    if (this.store.energy - MyCreepUtils.parts(this).work * REPAIR_POWER * REPAIR_COST <= 0) {
      delete creepMemory[CreepMemoryKeys.targetID]
    }
    return true
  }

  run?() {
    const creepMemory = Memory.creeps[this.name]
    this.message = creepMemory[CreepMemoryKeys.workRequest]

    if (
      this.room.name === creepMemory[CreepMemoryKeys.workRequest] ||
      !creepMemory[CreepMemoryKeys.workRequest]
    ) {
      if (!this.room.communeManager) return

      if (this.needsResources()) {
        // Define the creep's sourceName

        if (!this.findCommuneSourceIndex()) return

        const sourceIndex = creepMemory[CreepMemoryKeys.sourceIndex]

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceIndex)) return

        // Try to normally harvest. Iterate if creep harvested

        const source = this.room.roomManager.communeSources[sourceIndex]
        if (CreepOps.harvestSource(this, source) === Result.success) {
          return
        }
        return
      }

      delete creepMemory[CreepMemoryKeys.sourceIndex]
      delete creepMemory[CreepMemoryKeys.packedCoord]

      if (
        this.upgradeRoom(() => {
          if (creepMemory[CreepMemoryKeys.targetID] === this.room.controller.id) return true
          if (
            this.room.controller.ticksToDowngrade <=
            this.room.communeManager.controllerDowngradeUpgradeThreshold
          )
            return true
          if (this.room.controller.level < 2) return true

          return false
        })
      )
        return
      if (this.repairRampart()) return
      if (
        this.room.roomManager.cSiteTarget &&
        this.advancedBuildCSite(this.room.roomManager.cSiteTarget)
      )
        return
      if (this.upgradeRoom()) return
      return
    }

    // Otherwise if the creep is not in the claimTarget

    if (
      this.createMoveRequest({
        origin: this.pos,
        goals: [
          {
            pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.workRequest]),
            range: 25,
          },
        ],
        avoidEnemyRanges: true,
        typeWeights: {
          [RoomTypes.enemy]: Infinity,
          [RoomTypes.ally]: Infinity,
          [RoomTypes.sourceKeeper]: Infinity,
        },
      }) === Result.fail
    ) {
      const request = Memory.workRequests[this.memory[CreepMemoryKeys.workRequest]]
      if (request) request[WorkRequestKeys.abandon] = 20000
    }
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
      // Get the creep using its name

      const creep: Vanguard = Game.creeps[creepName]
      creep.run()
    }
  }
}
