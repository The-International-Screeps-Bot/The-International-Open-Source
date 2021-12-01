import './mineralHarvesterFunctions'

export function mineralHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Creep = Game.creeps[creepName]

        creep.say('hey')
    }
}
