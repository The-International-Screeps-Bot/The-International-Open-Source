import { Maintainer } from "../creepClasses"

export function maintainerManager(room: Room, creepsOfRole: string[]) {

    // Loop through creep names of creeps of the manager's role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Maintainer = Game.creeps[creepName]

        //

        creep.advancedRepair()
    }
}
