import {
  CreepMemoryKeys,
  ReservedCoordTypes,
  RoomMemoryKeys,
  packedPosLength,
} from '../../../../constants/general'
import { CreepOps } from 'room/creeps/creepOps'
import { CreepUtils } from 'room/creeps/creepUtils'
import { MyCreepUtils } from 'room/creeps/myCreepUtils'

export class ControllerUpgrader extends Creep {
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
        this.room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength
    )
      return false

    // Record creep as isDying

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
    this.room.communeManager.upgradeStrength += MyCreepUtils.upgradeStrength(this)
  }

  public static roleManager(room: Room, creepsOfRole: string[]) {
    // Loop through creepNames

    for (const creepName of creepsOfRole) {
      // Get the creep using its creepName

      const creep: ControllerUpgrader = Game.creeps[creepName]
      const creepMemory = Memory.creeps[creep.name]
      /*
            if (
                creepMemory[CreepMemoryKeys.targetID] === room.controller.id ||
                room.controller.ticksToDowngrade <
                    room.communeManager.controllerDowngradeUpgradeThreshold
            ) {
                creep.advancedUpgradeController()
                continue
            }

            if ((room.storage && room.storage.isRCLActionable) || (room.terminal && room.terminal.isRCLActionable)) {

                const cSiteTarget = creep.room.roomManager.cSiteTarget
                if (cSiteTarget && !creep.room.roomManager.enemyAttackers.length) {
                    creep.advancedBuild()
                    continue
                }
            }
 */
      CreepOps.advancedUpgradeController(creep)
    }
  }
}
