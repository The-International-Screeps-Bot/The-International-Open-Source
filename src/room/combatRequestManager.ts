import { CombatRequestData, ClaimRequestData, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/internationalManager'
import { CommuneManager } from './communeManager'

export class CombatRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        for (let index = 0; index < this.communeManager.room.memory.combatRequests.length; index++) {
            const requestName = this.communeManager.room.memory.combatRequests[index]
            const request = Memory.combatRequests[requestName]

            this[`${request.T}Request`](request, requestName, index)
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging)
            customLog(
                'Attack Request Manager',
                (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
                undefined,
                myColors.lightGrey,
            )
    }
    private attackRequest(request: CombatRequest, requestName: string, index: number) {
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        // If there are threats to our hegemony, temporarily abandon the request

        if (requestRoom.enemyAttackers.length > 0) {
            request.data[CombatRequestData.abandon] = 1500

            this.communeManager.room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length && (!requestRoom.controller || !requestRoom.controller.owner)) {
            delete Memory.combatRequests[requestName]
            this.communeManager.room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
    }
    private harassRequest(request: CombatRequest, requestName: string, index: number) {
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        if (Game.time % Math.floor(Math.random() * 100) === 0) {
            const structures = requestRoom.dismantleableStructures

            let totalHits = 0
            for (const structure of structures) totalHits += structure.hits

            if (structures.length > 0)
                request.data[CombatRequestData.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
        }

        // If there are threats to our hegemony, temporarily abandon the request

        const threateningAttacker = requestRoom.enemyAttackers.find(creep => creep.attackStrength > 0)

        if (threateningAttacker) {
            request.data[CombatRequestData.abandon] = 1500

            this.communeManager.room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length) {
            delete Memory.combatRequests[requestName]
            this.communeManager.room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
    }
    private defendRequest(request: CombatRequest, requestName: string, index: number) {}
}
