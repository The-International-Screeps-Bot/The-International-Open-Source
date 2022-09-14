import { myColors, roomTypesUsedForStats } from '../international/constants'

import './roomFunctions'

import './communeManager'

import { CreepRoleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import './roomVisuals'
import { createPosMap, customLog } from 'international/generalFunctions'
import { statsManager } from 'international/statsManager'
import './creeps/endTickCreepManager'
import { CommuneManager } from './communeManager'
import { RoomManager } from './roomManager'

export function roomsManager() {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Loop through room names in Game.rooms

    for (const roomName in Game.rooms) {
        // Get the CPU used at the start

        const roomCPUStart = Game.cpu.getUsed()

        // Get the room using the roomName

        const room = Game.rooms[roomName]
        const roomType = room.memory.T

        const statsActive = Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType)
        if (statsActive) statsManager.roomPreTick(room.name, roomType)

        room.roomManager = global.roomManagers[room.name]

        if (!room.roomManager) {
            room.roomManager = new RoomManager()
            global.roomManagers[room.name] = room.roomManager
        }

        room.roomManager.update(room)

        // If the room is a commune, run its specific manager

        if (room.memory.T === 'commune') room.communeManager.run()

        room.roomManager.run()

        // Log room stats

        let logMessage = `Creeps: ${room.myCreepsAmount}`

        if (Memory.CPULogging) logMessage += `, CPU: ${(Game.cpu.getUsed() - roomCPUStart).toFixed(2)}`

        customLog(room.name + ' ' + roomType, logMessage, undefined, myColors.midGrey)
        if (statsActive) statsManager.roomEndTick(room.name, roomType)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Room Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), myColors.white, myColors.lightBlue)
}
