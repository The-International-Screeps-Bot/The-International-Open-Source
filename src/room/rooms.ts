import { customColors, roomTypesUsedForStats } from '../international/constants'

import './roomFunctions'

import './commune/commune'

import { CreepRoleManager } from './creeps/creepRoleManager'

import { PowerCreepRoleManager } from './creeps/powerCreepRoleManager'
import './roomVisuals'
import { createPosMap, customLog } from 'international/utils'
import { globalStatsUpdater, statsManager } from 'international/statsManager'
import './creeps/endTickCreepManager'
import { CommuneManager } from './commune/commune'
import { RoomManager } from './room'

export function roomsManager() {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()
    const statName: RoomCommuneStatNames = 'rocu'

    // Loop through room names in Game.rooms

    for (const roomName in Game.rooms) {
        // Get the CPU used at the start

        if (Memory.CPULogging === true) var roomCPUStart = Game.cpu.getUsed()

        // Get the room using the roomName

        const room = Game.rooms[roomName]
        const roomType = room.memory.T

        // If the room is a commune, run its specific manager

        if (room.memory.T === 'commune') room.communeManager.run()
        else room.roomManager.run()

        // Log room stats

        let logMessage = `Creeps: ${room.myCreepsAmount}`

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - roomCPUStart
            logMessage += `, CPU: ${cpuUsed.toFixed(2)}`
            globalStatsUpdater(roomName, statName, cpuUsed)
        }
        customLog(room.name + ' ' + roomType, logMessage, {
            textColor: customColors.white,
            bgColor: customColors.lightBlue,
            superPosition: 2,
        })
        if (Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType))
            statsManager.roomEndTick(room.name, roomType)
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging === true) {
        const cpuUsed = Game.cpu.getUsed() - managerCPUStart
        customLog('Room Manager', cpuUsed.toFixed(2), {
            textColor: customColors.white,
            bgColor: customColors.lightBlue,
            superPosition: 1,
        })
        const statName: InternationalStatNames = 'roomcu'
        globalStatsUpdater('', statName, cpuUsed, true)
    }
}
