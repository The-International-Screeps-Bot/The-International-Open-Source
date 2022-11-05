import { ClaimRequestData, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/internationalManager'
import { CommuneManager } from './communeManager'
import { globalStatsUpdater } from 'international/statsManager'

export class ClaimRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }
    public run() {
        const { room } = this.communeManager

        if (!room.structures.spawn.length) return

        const requestName = room.memory.claimRequest
        if (!requestName) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        const request = Memory.claimRequests[requestName]

        // If the claimRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request) {
            delete room.memory.claimRequest
            return
        }

        const type = Memory.rooms[requestName].T
        if (type !== 'neutral' && type != 'commune' && type !== 'remote') {
            delete request.responder
            delete room.memory.claimRequest
            return
        }

        // The room is closed or is now a respawn or novice zone

        if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {

            delete request.responder
            delete room.memory.claimRequest
            return
        }

        // If the request has been abandoned, have the commune abandon it too

        if (request.data[ClaimRequestData.abandon] > 0) {
            delete request.responder
            delete room.memory.claimRequest
            return
        }

        if (room.energyCapacityAvailable < 650) {
            delete request.responder
            delete room.memory.claimRequest
            return
        }

        const requestRoom = Game.rooms[requestName]
        if (!requestRoom || !requestRoom.controller.my) {
            request.data[ClaimRequestData.claimer] = 1
            return
        }

        // If there is a spawn

        if (requestRoom.structures.spawn.length) {
            delete Memory.claimRequests[room.memory.claimRequest]
            delete room.memory.claimRequest
            return
        }

        // If there is an invader core

        const invaderCores = requestRoom.structures.invaderCore
        if (invaderCores.length) {
            // Abandon for its remaining existance plus the estimated reservation time

            request.data[ClaimRequestData.abandon] =
                invaderCores[0].effects[EFFECT_COLLAPSE_TIMER].ticksRemaining + CONTROLLER_RESERVE_MAX

            delete request.responder
            delete room.memory.claimRequest
            return
        }

        request.data[ClaimRequestData.vanguard] = requestRoom.structures.spawn.length ? 0 : 20

        request.data[ClaimRequestData.minDamage] = 0
        request.data[ClaimRequestData.minHeal] = 0

        if (!requestRoom.controller.safeMode) {
            // Increase the defenderNeed according to the enemy attackers' combined strength

            for (const enemyCreep of requestRoom.enemyAttackers) {
                if (enemyCreep.owner.username === 'Invader') continue

                request.data[ClaimRequestData.minDamage] += enemyCreep.healStrength
                request.data[ClaimRequestData.minHeal] += enemyCreep.attackStrength
            }

            // Decrease the defenderNeed according to ally combined strength

            for (const allyCreep of requestRoom.allyCreeps) {

                request.data[ClaimRequestData.minDamage] -= allyCreep.healStrength
                request.data[ClaimRequestData.minHeal] -= allyCreep.attackStrength
            }
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Claim Request Manager', cpuUsed.toFixed(2), myColors.white, myColors.lightBlue)
            const statName: RoomCommuneStatNames = 'clrmcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }
}
