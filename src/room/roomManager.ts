import { constants } from '../international/constants'

import './roomFunctions'

import './roomTaskManager'

import { communeManager } from './communeManager'

import { roleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import { trafficManager } from './trafficManager'
import { roomVisualsManager } from './roomVisualsManager'
import { containerManager } from './containerManager'
import { customLog } from 'international/generalFunctions'
import { droppedResourceManager } from './droppedResourceManager'
import { taskManager } from './roomTaskManager'

const specificRoomManagers: {[key: string]: Function} = {
    commune: communeManager,
}

export function roomManager() {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // Loop through room names in Game.rooms

    for (const roomName in Game.rooms) {

        // Get the CPU used at the start

        const roomCPUStart = Game.cpu.getUsed(),

        // Get the room using the roomName

        room = Game.rooms[roomName]

        taskManager(room)

        // If there is a specific manager for this room's type, run it

        if (specificRoomManagers[room.memory.type]) specificRoomManagers[room.memory.type](room)

        droppedResourceManager(room)

        //

        containerManager(room)

        //

        roleManager(room)

        //

        trafficManager(room)

        //

        roomVisualsManager(room)

        // Testing
/* 
        let cpuUsed = Game.cpu.getUsed()

        cpuUsed = Game.cpu.getUsed() - cpuUsed
        customLog('Testing CPU', cpuUsed.toFixed(2))
 */
        // Log room stats

        let logMessage = 'Creeps: ' + room.myCreepsAmount

        if (Memory.cpuLogging) logMessage += ', CPU: ' + (Game.cpu.getUsed() - roomCPUStart).toFixed(2)

        customLog(room.name, logMessage, undefined, constants.colors.lightGrey)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Room Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
