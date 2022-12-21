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

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        /*
        if (Memory.allyCreepRequests[this.memory.allyCreepRequest].abandon > 0) {
            delete this.memory.allyCreepRequest
            return
        }
        */

        Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] = 20

        const request = Game.rooms[room.memory.allyCreepRequest]

        if (!request) return

        // If the room is owned and not by an ally, delete the request

        if (
            request.controller &&
            request.controller.owner &&
            !Memory.allyPlayers.includes(request.controller.owner.username)
        ) {
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] += 1
            return
        }

        // If there are no longer ally construction sites

        if (!request.allyCSites.length) {
            delete Memory.allyCreepRequests[room.memory.allyCreepRequest]
            delete room.memory.allyCreepRequest

            return
        }

        if (request.enemyCreeps.length) {
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.abandon] = 20000
            Memory.allyCreepRequests[room.memory.allyCreepRequest].data[AllyCreepRequestData.allyVanguard] = 0

            delete room.memory.allyCreepRequest
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Ally Creep Request Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'acrmcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }
}

Room.prototype.allyCreepRequestManager = function () {}
