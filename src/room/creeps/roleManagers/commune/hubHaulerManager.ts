import { HubHauler } from '../../creepClasses'
import './hubHaulerFunctions'

export function hubHaulerManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
        const creep: HubHauler = Game.creeps[creepName]

        // Try to travel to the hub, iterate if there was movement

        if (creep.travelToHub()) continue

        // Try balancing storing structures, iterating if there were resources moved

        if (creep.balanceStoringStructures()) continue

        // Try filling the hubLink, iterating if there were resources moved

        if (creep.fillHubLink()) continue

        creep.say('🚬')
    }
}
