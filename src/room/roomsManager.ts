import { myColors, roomTypesUsedForStats } from '../international/constants'

import './roomFunctions'

import './communeManager'

import { creepRoleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import './roomVisualsManager'
import { createPosMap, customLog } from 'international/generalFunctions'
import { statsManager } from 'international/statsManager'
import './trafficManager'

export function roomManager() {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Loop through room names in Game.rooms

    for (const roomName in Game.rooms) {
        // Get the CPU used at the start

        const roomCPUStart = Game.cpu.getUsed()

        // Get the room using the roomName

        const room = Game.rooms[roomName]
        const roomType = room.memory.type

        const saveStats = Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType)
        if (saveStats) statsManager.roomPreTick(room.name, roomType)

        // If there is a specific manager for this room's type, run it

        if (room.memory.type === 'commune') room.communeManager()

        //

        creepRoleManager(room)

        //

        room.trafficManager()

        //

        room.roomVisualsManager()

        // Log room stats

        let logMessage = `Creeps: ${room.myCreepsAmount}`

        if (Memory.CPULogging) logMessage += `, CPU: ${(Game.cpu.getUsed() - roomCPUStart).toFixed(2)}`

        if (saveStats) statsManager.roomEndTick(room.name, roomType as 'commune' | 'remote', room)
        customLog(room.name + ' ' + roomType, logMessage, undefined, myColors.midGrey)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Room Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), myColors.white, myColors.lightBlue)
}
