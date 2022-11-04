import { CombatRequestData, ClaimRequestData, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/internationalManager'
import { CommuneManager } from './communeManager'
import { globalStatsUpdater } from 'international/statsManager'

export class CombatRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        const { room } = this.communeManager

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        if (!room.structures.spawn.length) return

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

            this[`${request.T}Request`](request, requestName, index)
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Attack Request Manager', cpuUsed.toFixed(2), myColors.white, myColors.lightBlue)
            const statName: RoomCommuneStatNames = 'cormcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }

    private attackRequest(request: CombatRequest, requestName: string, index: number) {
        const { room } = this.communeManager
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
            request.data[CombatRequestData.abandon] = requestRoom.controller.safeMode

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
    private harassRequest(request: CombatRequest, requestName: string, index: number) {
        const { room } = this.communeManager
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        if (Game.time % Math.floor(Math.random() * 100) === 0) {
            const structures = requestRoom.dismantleTargets

            let totalHits = 0
            for (const structure of structures) totalHits += structure.hits

            if (structures.length > 0)
                request.data[CombatRequestData.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
        }

        // If there are threats to our hegemony, temporarily abandon the request

        const threateningAttacker = requestRoom.enemyAttackers.find(creep => creep.attackStrength > 0)

        if (threateningAttacker) {
            request.data[CombatRequestData.abandon] = 1500

            room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length) {
            delete Memory.combatRequests[requestName]
            room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
    }
    private defendRequest(request: CombatRequest, requestName: string, index: number) {}
}
