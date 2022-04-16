import { Claimer } from '../../creepClasses'
import './claimerFunctions'

export function claimerManager(room: Room, creepsOfRole: string[]) {

    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Claimer = Game.creeps[creepName]

        creep.claimRoom()
    }
}
