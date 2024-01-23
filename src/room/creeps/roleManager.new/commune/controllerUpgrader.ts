import { RoomMemoryKeys, creepRoles, packedPosLength } from 'international/constants'
import { CreepProcs } from 'room/creeps/creepProcs'
import { creepUtils } from 'room/creeps/creepUtils'
import { DefaultRoleManager } from 'room/creeps/defaultRoleManager'

class ControllerUpgraderManager extends DefaultRoleManager {
  role: CreepRoles = 'controllerUpgrader'

  isDying(creep: Creep) {
    // Stop if creep is spawning

    if (creep.spawning) return false

    // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

    if (
      creep.ticksToLive >
      creep.body.length * CREEP_SPAWN_TIME +
        creep.room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength
    )
      return false

    // Record creep as isDying

    return true
  }
  /*
// Not good enough, we need to account for downgrading; state machine
    shouldBuild(creep: Creep) {
        return !!creep.room.roomManager.cSiteTarget;
    }
 */

  /**
   * Runs when the creep is spawning
   */
  runSpawning(creep: Creep) {}

  runUpdate(creep: Creep) {
    creep.room.communeManager.upgradeStrength += creep.room.communeManager.upgradeStrength
  }

  initialRun(creep: Creep) {}

  run(creep: Creep) {
    /*         if (this.shouldBuild(creep)) {
            creep.advancedBuild();
            return;
        } */
    CreepProcs.advancedUpgradeController(creep)
  }
}

export const controllerUpgraderManager = new ControllerUpgraderManager()
