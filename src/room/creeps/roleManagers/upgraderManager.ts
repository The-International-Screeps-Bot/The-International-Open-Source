import './upgraderFunctions'

export function upgraderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Creep = Game.creeps[creepName]

        creep.advancedUpgrade()
    }
}
