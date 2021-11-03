import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: Creep[]) {

    for (let creep of creepsOfRole) {

        creep.say('hey')
    }
}
