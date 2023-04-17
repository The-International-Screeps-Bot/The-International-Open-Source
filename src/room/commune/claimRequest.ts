import { ClaimRequestKeys, CombatRequestKeys, RoomMemoryKeys, RoomTypes, customColors } from 'international/constants'
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

        // create a claimRequest if needed

        if (room.structures.spawn.length) return

        let request = Memory.claimRequests[room.name]
        if (request) {
            request[ClaimRequestKeys.priority] = 0
            return
        }

        request = Memory.claimRequests[room.name] = {
            [ClaimRequestKeys.priority]: 0
        }
    }

    public run() {
        const { room } = this.communeManager

        const requestName = room.memory[RoomMemoryKeys.claimRequest]
        if (!requestName) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        const request = Memory.claimRequests[requestName]

        // If the claimRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request) {
            delete room.memory[RoomMemoryKeys.claimRequest]
            return
        }

        if (!room.structures.spawn.length) {
            this.stopResponse(true)
            return
        }

        const type = Memory.rooms[requestName][RoomMemoryKeys.type]
        if (type !== RoomTypes.neutral && type !== RoomTypes.commune && type !== RoomTypes.remote) {
            // Delete the request so long as the new type isn't ally

            this.stopResponse(type !== RoomTypes.ally)
            return
        }

        // The room is closed or is now a respawn or novice zone

        if (Game.map.getRoomStatus(requestName).status !== Game.map.getRoomStatus(room.name).status) {
            this.delete()
            return
        }

        // If the request has been abandoned, have the commune abandon it too

        if (request[ClaimRequestKeys.abandon] > 0) {
            this.stopResponse()
            return
        }

        if (room.energyCapacityAvailable < 650) {
            this.stopResponse()
            return
        }

        const requestRoom = Game.rooms[requestName]
        if (!requestRoom || !requestRoom.controller.my) {
            request[ClaimRequestKeys.claimer] = 1
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

        request[ClaimRequestKeys.vanguard] = requestRoom.structures.spawn.length ? 0 : 20
        /*
        request[ClaimRequestKeys.minDamage] = 0
        request[ClaimRequestKeys.minHeal] = 0

        if (!requestRoom.controller.safeMode) {
            // Increase the defenderNeed according to the enemy attackers' combined strength

            for (const enemyCreep of requestRoom.enemyAttackers) {
                if (enemyCreep.owner.username === 'Invader') continue

                request[ClaimRequestKeys.minDamage] += enemyCreep.combatStrength.heal
                request[ClaimRequestKeys.minHeal] += enemyCreep.combatStrength.ranged
            }

            // Decrease the defenderNeed according to ally combined strength

            for (const allyCreep of requestRoom.allyCreeps) {
                request[ClaimRequestKeys.minDamage] -= allyCreep.combatStrength.heal
                request[ClaimRequestKeys.minHeal] -= allyCreep.combatStrength.ranged
            }

            if (request[ClaimRequestKeys.minDamage] > 0 || request[ClaimRequestKeys.minHeal] > 0) this.abandon()
        } */

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
        const request = Memory.claimRequests[roomMemory[RoomMemoryKeys.claimRequest]]

        if (deleteCombat) this.deleteCombat()

        delete request[ClaimRequestKeys.responder]
        delete roomMemory[RoomMemoryKeys.claimRequest]
    }

    private delete() {
        const roomMemory = this.communeManager.room.memory

        this.deleteCombat()

        delete Memory.claimRequests[roomMemory[RoomMemoryKeys.claimRequest]]
        delete roomMemory[RoomMemoryKeys.claimRequest]
    }

    private abandon(abandonTime: number = 20000) {
        const roomMemory = this.communeManager.room.memory
        const request = Memory.claimRequests[roomMemory[RoomMemoryKeys.claimRequest]]

        this.deleteCombat()

        request[ClaimRequestKeys.abandon] = abandonTime
        delete request[ClaimRequestKeys.responder]
        delete roomMemory[RoomMemoryKeys.claimRequest]
    }

    private deleteCombat() {
        const claimRequestName = this.communeManager.room.memory[RoomMemoryKeys.claimRequest]
        const combatRequest = Memory.combatRequests[claimRequestName]
        if (!combatRequest) return

        if (combatRequest[CombatRequestKeys.responder]) {
            const combatRequestResponder = Game.rooms[combatRequest[CombatRequestKeys.responder]]
            combatRequestResponder.communeManager.deleteCombatRequest(
                combatRequest[CombatRequestKeys.responder],
                combatRequestResponder.memory[RoomMemoryKeys.combatRequests].indexOf(claimRequestName),
            )
            return
        }

        delete Memory.combatRequests[claimRequestName]
    }
}
