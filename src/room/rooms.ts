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
import { statsManager } from 'international/statsManager'
import './creeps/endTickCreepManager'
import { CommuneManager } from './commune/commune'
import { RoomManager } from './room'
import { LogTypes, customLog } from 'utils/logging'

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

        for (const roomName in Game.rooms) {

            const room = Game.rooms[roomName]
            room.roomManager.run()

            // Log room stats

            const roomMemory = Memory.rooms[room.name]
            const roomType = roomMemory[RoomMemoryKeys.type]

            customLog(
                `<a style="cursor: pointer;color:inherit; text-decoration:underline;" href="#!/room/${Game.shard.name}/${room.name}">${room.name}</a>`,
                `Type: ${RoomTypes[roomType]} Creeps: ${room.myCreepsAmount}`,
                {
                    type: LogTypes.info,
                    position: 2,
                },
            )
        }
    }
}

export const roomsManager = new RoomsManager()
