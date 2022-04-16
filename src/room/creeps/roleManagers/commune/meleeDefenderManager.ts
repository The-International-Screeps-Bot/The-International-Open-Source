import { MeleeDefender } from '../../creepClasses'
import './meleeDefenderFunctions'

export function meleeDefenderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: MeleeDefender = Game.creeps[creepName]

        creep.advancedDefend()
    }
}
