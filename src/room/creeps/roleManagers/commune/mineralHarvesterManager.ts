import { MineralHarvester } from '../../creepClasses'
import './mineralHarvesterFunctions'

export function mineralHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: MineralHarvester = Game.creeps[creepName]

        creep.say('hey')
    }
}
