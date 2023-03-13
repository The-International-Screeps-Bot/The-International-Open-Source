import { AllyCreepRequestData, customColors } from 'international/constants'
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

        if (!room.memory.allyCreepRequest) return

        /*
        if (Memory.allyCreepRequests[this.memory.allyCreepRequest].abandon > 0) {
            delete this.memory.allyCreepRequest
            return
        }
        */

        const requestName = room.memory.allyCreepRequest
        if (!requestName) return

        const request = Memory.allyCreepRequests[requestName]

        // If the claimRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request) {
            delete room.memory.allyCreepRequest
            return
        }

        Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] = 20

        const requestRoom = Game.rooms[room.memory.allyCreepRequest]
        if (!request) return

        // If the room is owned and not by an ally, delete the request

        if (
            requestRoom.controller &&
            requestRoom.controller.owner &&
            !Memory.allyPlayers.includes(requestRoom.controller.owner.username)
        ) {
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] += 1
            return
        }

        // If there are no longer ally construction sites

        if (!requestRoom.allyCSites.length) {
            delete Memory.allyCreepRequests[room.memory.allyCreepRequest]
            delete room.memory.allyCreepRequest

            return
        }

        if (requestRoom.enemyCreeps.length) {
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.abandon] = 20000
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] = 0

            delete room.memory.allyCreepRequest
        }
    }
}
