import { AllyCreepRequestKeys, RoomMemoryKeys, customColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { globalStatsUpdater } from 'international/statsManager'

export class AllyCreepRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        const { room } = this.communeManager

        if (!room.structures.spawn.length) return

        if (!room.memory[RoomMemoryKeys.allyCreepRequest]) return

        /*
        if (Memory.allyCreepRequests[this.memory[RoomMemoryKeys.allyCreepRequest]].abandon > 0) {
            delete this.memory[RoomMemoryKeys.allyCreepRequest]
            return
        }
        */

        const requestName = room.memory[RoomMemoryKeys.allyCreepRequest]
        if (!requestName) return

        const request = Memory.allyCreepRequests[requestName]

        // If the workRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request) {
            delete room.memory[RoomMemoryKeys.allyCreepRequest]
            return
        }

        Memory.allyCreepRequests[room.memory[RoomMemoryKeys.allyCreepRequest]][AllyCreepRequestKeys.allyVanguard] = 20

        const requestRoom = Game.rooms[room.memory[RoomMemoryKeys.allyCreepRequest]]
        if (!request) return

        // If the room is owned and not by an ally, delete the request

        if (
            requestRoom.controller &&
            requestRoom.controller.owner &&
            !Memory.allyPlayers.includes(requestRoom.controller.owner.username)
        ) {
            Memory.allyCreepRequests[room.memory[RoomMemoryKeys.allyCreepRequest]][
                AllyCreepRequestKeys.allyVanguard
            ] += 1
            return
        }

        // If there are no longer ally construction sites

        if (!requestRoom.allyCSites.length) {
            delete Memory.allyCreepRequests[room.memory[RoomMemoryKeys.allyCreepRequest]]
            delete room.memory[RoomMemoryKeys.allyCreepRequest]

            return
        }

        if (requestRoom.enemyCreeps.length) {
            Memory.allyCreepRequests[room.memory[RoomMemoryKeys.allyCreepRequest]][AllyCreepRequestKeys.abandon] = 20000
            Memory.allyCreepRequests[room.memory[RoomMemoryKeys.allyCreepRequest]][
                AllyCreepRequestKeys.allyVanguard
            ] = 0

            delete room.memory[RoomMemoryKeys.allyCreepRequest]
        }
    }
}
