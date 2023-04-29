import { WorkRequestKeys, CombatRequestKeys, RoomMemoryKeys, RoomTypes, customColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { updateStat } from 'international/statsManager'

export class WorkRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        const { room } = this.communeManager

        // create a workRequest if needed

        if (room.roomManager.structures.spawn.length) return

        let request = Memory.workRequests[room.name]
        if (request) {
            request[WorkRequestKeys.priority] = 0
            return
        }

        request = Memory.workRequests[room.name] = {
            [WorkRequestKeys.priority]: 0,
        }
    }

    public run() {
        const { room } = this.communeManager

        const requestName = room.memory[RoomMemoryKeys.workRequest]
        if (!requestName) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        const request = Memory.workRequests[requestName]

        // If the workRequest doesn't exist anymore somehow, stop trying to do anything with it

        if (!request) {
            delete room.memory[RoomMemoryKeys.workRequest]
            return
        }

        if (!room.roomManager.structures.spawn.length) {
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

        if (request[WorkRequestKeys.abandon] > 0) {
            this.stopResponse()
            return
        }

        if (room.energyCapacityAvailable < 650) {
            this.stopResponse()
            return
        }

        const requestRoom = Game.rooms[requestName]
        if (!request[WorkRequestKeys.forAlly] && (!requestRoom || !requestRoom.controller.my)) {
            request[WorkRequestKeys.claimer] = 1
            return
        }

        // If there is a spawn and we own it

        if (
            requestRoom.roomManager.structures.spawn.length &&
            requestRoom.roomManager.structures.spawn.find(spawn => spawn.my)
        ) {
            this.delete()
            return
        }

        // If there is an invader core

        const invaderCores = requestRoom.roomManager.structures.invaderCore
        if (invaderCores.length) {
            // Abandon for the core's remaining existance plus the estimated reservation time

            this.abandon(invaderCores[0].effects[EFFECT_COLLAPSE_TIMER].ticksRemaining + CONTROLLER_RESERVE_MAX)
            return
        }

        if (request[WorkRequestKeys.forAlly]) {
            request[WorkRequestKeys.allyVanguard] = requestRoom.roomManager.structures.spawn.length ? 0 : 20
        } else {
            request[WorkRequestKeys.vanguard] = requestRoom.roomManager.structures.spawn.length ? 0 : 20
        }

        /*
        request[WorkRequestKeys.minDamage] = 0
        request[WorkRequestKeys.minHeal] = 0

        if (!requestRoom.controller.safeMode) {
            // Increase the defenderNeed according to the enemy attackers' combined strength

            for (const enemyCreep of requestRoom.enemyAttackers) {
                if (enemyCreep.owner.username === 'Invader') continue

                request[WorkRequestKeys.minDamage] += enemyCreep.combatStrength.heal
                request[WorkRequestKeys.minHeal] += enemyCreep.combatStrength.ranged
            }

            // Decrease the defenderNeed according to ally combined strength

            for (const allyCreep of requestRoom.allyCreeps) {
                request[WorkRequestKeys.minDamage] -= allyCreep.combatStrength.heal
                request[WorkRequestKeys.minHeal] -= allyCreep.combatStrength.ranged
            }

            if (request[WorkRequestKeys.minDamage] > 0 || request[WorkRequestKeys.minHeal] > 0) this.abandon()
        } */

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Claim Request Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'clrmcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    private stopResponse(deleteCombat?: boolean) {
        const roomMemory = this.communeManager.room.memory
        const request = Memory.workRequests[roomMemory[RoomMemoryKeys.workRequest]]

        if (deleteCombat) this.deleteCombat()

        delete request[WorkRequestKeys.responder]
        delete roomMemory[RoomMemoryKeys.workRequest]
    }

    private delete() {
        const roomMemory = this.communeManager.room.memory

        this.deleteCombat()

        delete Memory.workRequests[roomMemory[RoomMemoryKeys.workRequest]]
        delete roomMemory[RoomMemoryKeys.workRequest]
    }

    private abandon(abandonTime: number = 20000) {
        const roomMemory = this.communeManager.room.memory
        const request = Memory.workRequests[roomMemory[RoomMemoryKeys.workRequest]]

        this.deleteCombat()

        request[WorkRequestKeys.abandon] = abandonTime
        delete request[WorkRequestKeys.responder]
        delete roomMemory[RoomMemoryKeys.workRequest]
    }

    private deleteCombat() {
        const workRequestName = this.communeManager.room.memory[RoomMemoryKeys.workRequest]
        const combatRequest = Memory.combatRequests[workRequestName]
        if (!combatRequest) return

        if (combatRequest[CombatRequestKeys.responder]) {
            const combatRequestResponder = Game.rooms[combatRequest[CombatRequestKeys.responder]]
            combatRequestResponder.communeManager.deleteCombatRequest(
                combatRequest[CombatRequestKeys.responder],
                combatRequestResponder.memory[RoomMemoryKeys.combatRequests].indexOf(workRequestName),
            )
            return
        }

        delete Memory.combatRequests[workRequestName]
    }
}
