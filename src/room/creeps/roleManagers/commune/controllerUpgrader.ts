import { ControllerUpgrader } from '../../creepClasses'

export function controllerUpgraderManager(room: Room, creepsOfRole: string[]) {
     // Loop through creepNames

     for (const creepName of creepsOfRole) {
          // Get the creep using its creepName

          const creep: ControllerUpgrader = Game.creeps[creepName]

          creep.advancedUpgradeController()
     }
}

ControllerUpgrader.prototype.isDying = function () {
     // Inform as dying if creep is already recorded as dying

     if (this.memory.dying) return true

     // Stop if creep is spawning

     if (!this.ticksToLive) return false

     // If the creep's remaining ticks are more than the estimated spawn time plus travel time, inform false

     if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + (this.room.upgradePathLength - 3))
          return false

     // Record creep as dying

     this.memory.dying = true
     return true
}
