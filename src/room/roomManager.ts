import { constants } from '../international/constants'

import './roomFunctions'

import './roomTaskManager'

import { remoteManager } from './remoteManager'
import { communeManager } from './communeManager'

import { roleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import { trafficManager } from './trafficManager'
import { roomVisualsManager } from './roomVisualsManager'
import { containerManager } from './containerManager'
import { customLog } from 'international/generalFunctions'

const specificRoomManagers: {[key: string]: Function} = {
    remote: remoteManager,
    commune: communeManager,
}

export function roomManager() {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // Loop through room names in Game.rooms

    for (const roomName in Game.rooms) {

        // Get the CPU used at the start

        const roomCPUStart = Game.cpu.getUsed()

        // Get the room using the roomName

        const room = Game.rooms[roomName]

        // If there is a specific manager for this room's type, run it

        if (specificRoomManagers[room.memory.type]) specificRoomManagers[room.memory.type](room)

        //

        containerManager(room)

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

        // Log room stats

        customLog(room.name, 'Creeps: ' + room.myCreepsAmount + ', CPU: ' + (Game.cpu.getUsed() - roomCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Room Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
