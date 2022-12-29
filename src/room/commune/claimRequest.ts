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

        if (!request) {
            delete room.memory.claimRequest
            return
        }

        if (!room.structures.spawn.length) {
            this.stopResponse(true)
            return
        }

        const type = Memory.rooms[requestName].T
        if (type !== 'neutral' && type !== 'commune' && type !== 'remote') {

            // Delete the combat so long as the new type isn't ally

            this.stopResponse(type !== 'ally')
            return
        }

        // The room is closed or is now a respawn or novice zone

        if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
            this.delete()
            return
        }

        // If the request has been abandoned, have the commune abandon it too

        if (request.data[ClaimRequestData.abandon] > 0) {

            this.stopResponse()
            return
        }

        if (room.energyCapacityAvailable < 650) {

            this.stopResponse()
            return
        }

        const requestRoom = Game.rooms[requestName]
        if (!requestRoom || !requestRoom.controller.my) {
            request.data[ClaimRequestData.claimer] = 1
            return
        }

        // If there is a spawn and we own it

        if (requestRoom.structures.spawn.length && requestRoom.structures.spawn.find(spawn => spawn.my)) {

            this.delete()
            return
        }

        // If there is an invader core

        const invaderCores = requestRoom.structures.invaderCore
        if (invaderCores.length) {
            // Abandon for the core's remaining existance plus the estimated reservation time

            this.abandon(invaderCores[0].effects[EFFECT_COLLAPSE_TIMER].ticksRemaining + CONTROLLER_RESERVE_MAX)
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
                this.abandon()
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

    private stopResponse(deleteCombat?: boolean) {
        const roomMemory = this.communeManager.room.memory
        const request = Memory.claimRequests[roomMemory.claimRequest]

        if (deleteCombat) this.deleteCombat()

        delete request.responder
        delete roomMemory.claimRequest
    }

    private delete() {
        const roomMemory = this.communeManager.room.memory

        this.deleteCombat()

        delete Memory.claimRequests[roomMemory.claimRequest]
        delete roomMemory.claimRequest
    }

    private abandon(abandonTime: number = 20000) {

        const roomMemory = this.communeManager.room.memory
        const request = Memory.claimRequests[roomMemory.claimRequest]

        this.deleteCombat()

        request.data[ClaimRequestData.abandon] = abandonTime
        delete request.responder
        delete roomMemory.claimRequest
    }

    private deleteCombat() {

        const claimRequestName = this.communeManager.room.memory.claimRequest
        const combatRequest = Memory.combatRequests[claimRequestName]
        if (!combatRequest) return

        if (combatRequest.responder) {

            const combatRequestResponder = Game.rooms[combatRequest.responder]
            combatRequestResponder.communeManager.deleteCombatRequest(combatRequest.responder, combatRequestResponder.memory.combatRequests.indexOf(claimRequestName))
            return
        }

        delete Memory.combatRequests[claimRequestName]
    }
}
