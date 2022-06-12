import { FastFiller } from '../../creepClasses'
import './fastFillerFunctions'

export function fastFillerManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: FastFiller = Game.creeps[creepName]

          if (creep.travelToFastFiller()) continue

          if (creep.fillFastFiller()) continue

          if (creep.advancedRenew()) continue

          /* creep.say('🚬') */
     }
}
