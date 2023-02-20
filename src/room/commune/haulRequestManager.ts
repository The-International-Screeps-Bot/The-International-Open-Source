import { customColors, HaulRequestData, CombatRequestData } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { globalStatsUpdater } from 'international/statsManager'

export class HaulRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public preTickRun() {
        const { room } = this.communeManager
        return
        for (let index = 0; index < room.memory.combatRequests.length; index++) {
            const requestName = room.memory.combatRequests[index]
            const request = Memory.combatRequests[requestName]

            if (
                !request ||
                !room.structures.spawn.length ||
                room.resourcesInStoringStructures.energy < this.communeManager.minStoredEnergy
            ) {
                this.communeManager.room.memory.combatRequests.splice(index, 1)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
                delete Memory.combatRequests[requestName]
                room.memory.combatRequests.splice(index, 1)
                delete request.responder
                return
            }

            if (request.data[HaulRequestData.transfer]) this.preTickTransferRequest(requestName, index)
            this.withdrawRequest(requestName, index)
        }
    }

    private preTickTransferRequest(requestName: string, index: number) {}

    public run() {
        const { room } = this.communeManager
        return
        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        for (let index = 0; index < room.memory.combatRequests.length; index++) {
            const requestName = room.memory.combatRequests[index]
            const request = Memory.combatRequests[requestName]

            if (!request) {
                this.communeManager.room.memory.combatRequests.splice(index, 1)
                continue
            }

            // The room is closed or is now a respawn or novice zone

            if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
                delete Memory.combatRequests[requestName]
                room.memory.combatRequests.splice(index, 1)
                delete request.responder
                return
            }

            if (request.data[HaulRequestData.transfer]) this.transferRequest(requestName, index)
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
            globalStatsUpdater(room.name, statName, cpuUsed)
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
            request.data[CombatRequestData.abandon] = 1500

            room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
 */

        // If there is a controller and it's in safemode, abandon until it ends

        if (requestRoom.controller && requestRoom.controller.safeMode) {
            request.data[HaulRequestData.abandon] = requestRoom.controller.safeMode

            room.memory.combatRequests.splice(index, 1)
            delete request.responder
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length && (!requestRoom.controller || !requestRoom.controller.owner)) {
            delete Memory.combatRequests[requestName]
            room.memory.combatRequests.splice(index, 1)
            delete request.responder
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
