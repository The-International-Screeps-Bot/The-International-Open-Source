import { constants } from '../international/constants'

import './roomFunctions'

import './roomTaskManager'

import { remoteManager } from './remoteManager'
import { communeManager } from './communeManager'

import { roleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import { trafficManager } from './trafficManager'
import { generalFuncs } from 'international/generalFunctions'
import { roomVisualsManager } from './roomVisualsManager'

const specificRoomManagers: {[key: string]: Function} = {
    remote: remoteManager,
    commune: communeManager,
}

export function roomManager() {

    let i = 0

    for (let roomName in Game.rooms) {

        const room: Room = Game.rooms[roomName]

        generalFuncs.customLog('Room', room.name, Game.cpu.getUsed().toFixed(2), constants.colors.lightGrey)

        // Check if there is a roomManager for this room's type

        const specificRoomManager = specificRoomManagers[room.memory.type]
        if (specificRoomManager) {

            // Run specific manager

            specificRoomManager(room)
        }

        //

        roleManager(room)

        //

        trafficManager(room)

        //

        roomVisualsManager(room)

        // Testing

        let cpuUsed = Game.cpu.getUsed()

        cpuUsed = Game.cpu.getUsed() - cpuUsed
        /* generalFuncs.customLog('Testing CPU', cpuUsed.toFixed(2)) */

        i++
    }
}
