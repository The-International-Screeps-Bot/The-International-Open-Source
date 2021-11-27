import './roomFunctions'

import './taskManager'

import './spawnManager'

import { remoteManager } from './remoteManager'
import { communeManager } from './communeManager'

import { spawnManager } from './spawning/spawnManager'

import { roleManager } from './creeps/roleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'

export function roomManager() {

    let i = 0

    for (let roomName in Game.rooms) {

        const room: Room = Game.rooms[roomName]

        const controller = room.controller

        new CustomLog('Room', room.name, undefined, global.colors.lightGrey)

        //

        roleManager(room)

        // Iterate if there is no controller or we don't own the controller

        if (!controller || !controller.my) continue

        //

        communeManager(room)

        //

        spawnManager(room)

        // Testing

        let cpuUsed = Game.cpu.getUsed()

        const harvPositions = room.get('source1HarvestPositions')
        new CustomLog('HarvestPositions', harvPositions)

        cpuUsed = Game.cpu.getUsed() - cpuUsed
        new CustomLog('HarvestPositions CPU', cpuUsed.toFixed(2))

        i++
    }
}
