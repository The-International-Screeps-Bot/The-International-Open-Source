import { customColors, HaulRequestKeys, CombatRequestKeys, RoomMemoryKeys } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { updateStat } from 'international/statsManager'

export class HaulRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public preTickRun() {
        const { room } = this.communeManager
        return
        for (let index = 0; index < room.memory[RoomMemoryKeys.haulRequests].length; index++) {
            const requestName = room.memory[RoomMemoryKeys.haulRequests][index]
            const request = Memory.haulRequests[requestName]

            if (
                !request ||
                !room.roomManager.structures.spawn.length ||
                room.resourcesInStoringStructures.energy < this.communeManager.minStoredEnergy
            ) {
                this.communeManager.room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
                delete Memory.haulRequests[requestName]
                room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
                delete request[HaulRequestKeys.responder]
                return
            }

            const val = HaulRequestKeys.type
            const val2 = request[val]

            const val3 = request[0]

            if (request[HaulRequestKeys.type] === 'transfer') this.preTickTransferRequest(requestName, index)
            this.withdrawRequest(requestName, index)
        }
    }

    private preTickTransferRequest(requestName: string, index: number) {}

    public run() {
        const { room } = this.communeManager
        return
        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        for (let index = 0; index < room.memory[RoomMemoryKeys.haulRequests].length; index++) {
            const requestName = room.memory[RoomMemoryKeys.haulRequests][index]
            const request = Memory.haulRequests[requestName]

            if (!request) {
                this.communeManager.room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
                delete Memory.haulRequests[requestName]
                room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
                delete request[HaulRequestKeys.responder]
                return
            }

            if (request[HaulRequestKeys.type] === 'transfer') this.transferRequest(requestName, index)
            this.withdrawRequest(requestName, index)
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Haul Request Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'cormcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    private transferRequest(requestName: string, index: number) {
        const { room } = this.communeManager
        const request = Memory.haulRequests[requestName]
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        // If there are threats to our hegemony, temporarily abandon the request
        /*
        if (requestRoom.enemyAttackers.length > 0) {
            request[CombatRequestKeys.abandon] = 1500

            room.memory.haulRequests.splice(index, 1)
            delete request.responder
            return
        }
 */

        // If there is a controller and it's in safemode, abandon until it ends

        if (requestRoom.controller && requestRoom.controller.safeMode) {
            request[HaulRequestKeys.abandon] = requestRoom.controller.safeMode

            room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
            delete request[HaulRequestKeys.responder]
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length && (!requestRoom.controller || !requestRoom.controller.owner)) {
            delete Memory.haulRequests[requestName]
            room.memory[RoomMemoryKeys.haulRequests].splice(index, 1)
            delete request[HaulRequestKeys.responder]
            return
        }
    }
    private withdrawRequest(requestName: string, index: number) {
        const { room } = this.communeManager
        const request = Memory.haulRequests[requestName]
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        return
    }
}
