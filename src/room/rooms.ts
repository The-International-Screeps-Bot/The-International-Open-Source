import {
    RoomMemoryKeys,
    RoomTypes,
    customColors,
    roomTypesUsedForStats,
} from '../international/constants'

import './roomFunctions'

import './commune/commune'

import { CreepRoleManager } from './creeps/creepRoleManager'

import { PowerCreepRoleManager } from './creeps/powerCreepRoleManager'
import './roomVisuals'
import { createPosMap } from 'utils/utils'
import { updateStat, statsManager } from 'international/statsManager'
import './creeps/endTickCreepManager'
import { CommuneManager } from './commune/commune'
import { RoomManager } from './room'
import { LogTypes, log } from 'utils/logging'

class RoomsManager {
    constructor() {}
    updateRun() {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName]

            room.roomManager = RoomManager.roomManagers[room.name]

            if (!room.roomManager) {
                room.roomManager = new RoomManager()
                RoomManager.roomManagers[room.name] = room.roomManager
            }

            room.roomManager.update(room)
        }
    }
    initRun() {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName]
            room.roomManager.initRun()
        }
    }
    run() {
        // Loop through room names in Game.rooms

        for (const roomName in Game.rooms) {
            // Get the room using the roomName

            const room = Game.rooms[roomName]
            const roomMemory = Memory.rooms[room.name]
            const roomType = roomMemory[RoomMemoryKeys.type]

            // If the room is a commune, run its specific manager

            room.roomManager.run()

            // Log room stats

            let logMessage = `Type: ${RoomTypes[roomType]} Creeps: ${room.myCreepsAmount}`

            log(
                `<a style="cursor: pointer;color:inherit" href="https://screeps.com/a/#!/room/${Game.shard.name}/${room.name}">${room.name}</a>`,
                logMessage,
                {
                    type: LogTypes.info,
                    position: 2,
                },
            )
            if (global.settings.roomStats > 0 && roomTypesUsedForStats.includes(roomType))
                statsManager.roomEndTick(room.name, roomType)
        }
    }
}

export const roomsManager = new RoomsManager()
