import '../creepClasses'
import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: RoleHauler[]) {

    for (const creep of creepsOfRole) {

        creep.say('hey')
    }
}
