import { ClaimRequestData, customColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { globalStatsUpdater } from 'international/statsManager'

export class ClaimRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        const { room } = this.communeManager

        // create a claimRequet if needed

        if (room.structures.spawn.length) return

        if (Memory.claimRequests[room.name]) return

        const request = (Memory.claimRequests[room.name] = {
            data: [0],
        })

        request.data[ClaimRequestData.score] = 0
    }

    public run() {
        const { room } = this.communeManager

        const requestName = room.memory.claimRequest
        if (!requestName) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        const request = Memory.claimRequests[requestName]

        // If the claimRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request || !room.structures.spawn.length) {
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

        // If there is a spawn and we own it

        if (requestRoom.structures.spawn.length && requestRoom.structures.spawn.find(spawn => spawn.my)) {
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

                request.data[ClaimRequestData.minDamage] += enemyCreep.combatStrength.heal
                request.data[ClaimRequestData.minHeal] += enemyCreep.combatStrength.ranged
            }

            // Decrease the defenderNeed according to ally combined strength

            for (const allyCreep of requestRoom.allyCreeps) {
                request.data[ClaimRequestData.minDamage] -= allyCreep.combatStrength.heal
                request.data[ClaimRequestData.minHeal] -= allyCreep.combatStrength.ranged
            }

            if (request.data[ClaimRequestData.minDamage] > 0 || request.data[ClaimRequestData.minHeal] > 0)
                request.data[ClaimRequestData.abandon] = 20000
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Claim Request Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'clrmcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }
}
