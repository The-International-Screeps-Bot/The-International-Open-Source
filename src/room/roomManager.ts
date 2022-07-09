import { constants, myColors } from '../international/constants'

import './roomFunctions'

import { taskManager } from './roomTaskManager'

import { communeManager } from './communeManager'

import { creepRoleManager } from './creeps/creepRoleManager'

import { powerCreepManager } from './powerCreeps/powerCreepManager'
import { trafficManager } from './trafficManager'
import { roomVisualsManager } from './roomVisualsManager'
import { containerManager } from './containerManager'
import { createPackedPosMap, customLog } from 'international/generalFunctions'
import { droppedResourceManager } from './droppedResourceManager'
import { statsManager } from 'international/statsManager'

const specificRoomManagers: { [key: string]: Function } = {
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
          const roomType = room.memory.type

          const saveStats = Memory.roomStats > 0 && constants.roomTypesUsedForStats.includes(roomType)
          if (saveStats) statsManager.roomPreTick(room.name, roomType)

          taskManager(room)

          // If there is a specific manager for this room's type, run it

          if (specificRoomManagers[roomType]) specificRoomManagers[roomType](room)

          droppedResourceManager(room)

          //

          containerManager(room)

          //

          creepRoleManager(room)

          //

          trafficManager(room)

          //

          roomVisualsManager(room)

          // Log room stats

          let logMessage = `Creeps: ${room.myCreepsAmount}`

          if (Memory.cpuLogging) logMessage += `, CPU: ${(Game.cpu.getUsed() - roomCPUStart).toFixed(2)}`

          if (saveStats) statsManager.roomEndTick(room.name, roomType, room)
          customLog(room.name + ' ' + roomType, logMessage, undefined, myColors.midGrey)
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Room Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               myColors.white,
               myColors.lightBlue,
          )
}
