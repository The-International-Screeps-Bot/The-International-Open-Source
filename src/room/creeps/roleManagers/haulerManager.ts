import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Creep = Game.creeps[creepName]

        creep.say('hey')
    }
}
