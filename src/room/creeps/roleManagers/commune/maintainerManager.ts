import { Maintainer } from '../../creepClasses'
import './maintainerFunctions'

export function maintainerManager(room: Room, creepsOfRole: string[]) {
     // Loop through creep names of creeps of the manager's role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: Maintainer = Game.creeps[creepName]

          // Try to maintain structures, iterating if success

          if (creep.advancedMaintain()) continue

          // Otherwise, try to maintain at feet, iterating if success

          if (creep.maintainNearby()) continue
     }
}
