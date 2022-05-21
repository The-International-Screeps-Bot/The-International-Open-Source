import { ControllerUpgrader } from '../../creepClasses'
import './controllerUpgraderFunctions'

export function controllerUpgraderManager(room: Room, creepsOfRole: string[]) {
     // Loop through creepNames

     for (const creepName of creepsOfRole) {
          // Get the creep using its creepName

          const creep: ControllerUpgrader = Game.creeps[creepName]

          creep.advancedUpgradeController()
     }
}
