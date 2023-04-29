import { CombatRequestKeys, RoomMemoryKeys, customColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/utils'
import { internationalManager } from 'international/international'
import { CommuneManager } from './commune'
import { updateStat } from 'international/statsManager'

export class CombatRequestManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public run() {
        const { room } = this.communeManager

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        for (let index = room.memory[RoomMemoryKeys.combatRequests].length - 1; index >= 0; index -= 1) {
            const requestName = room.memory[RoomMemoryKeys.combatRequests][index]
            const request = Memory.combatRequests[requestName]

            // The request has been deleted by soemthing else

            if (!request) {
                room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
                continue
            }

            // We have no way to make creeps

            if (!room.roomManager.structures.spawn.length) {
                delete request[CombatRequestKeys.responder]
                room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
                continue
            }

            // We don't have enough energy to respond to the request

            if (!this.canKeepRequest()) {
                delete request[CombatRequestKeys.responder]
                room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
            }

            this[`${request[CombatRequestKeys.type]}Request`](requestName, index)
        }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Combat Request Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'cormcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    private canKeepRequest() {
        const { room } = this.communeManager

        // Ensure we aren't responding to too many requests for our energy level

        if (room.storage && room.controller.level >= 4) {
            if (room.memory[RoomMemoryKeys.combatRequests].length >= room.communeManager.maxCombatRequests) return false
        }

        if (room.memory[RoomMemoryKeys.combatRequests].length >= room.communeManager.estimatedEnergyIncome / 10)
            return false
        return true
    }

    private attackRequest(requestName: string, index: number) {
        const { room } = this.communeManager
        const request = Memory.combatRequests[requestName]
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        // If there are threats to our hegemony, temporarily abandon the request
        /*
        if (requestRoom.enemyAttackers.length > 0) {
            request[CombatRequestKeys.abandon] = 1500

            room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
 */

        // If there is a controller and it's in safemode, abandon until it ends

        if (requestRoom.controller && requestRoom.controller.safeMode) {
            request[CombatRequestKeys.abandon] = requestRoom.controller.safeMode

            this.manageAbandonment(requestName, index)
            return
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length && (!requestRoom.controller || !requestRoom.controller.owner)) {
            this.communeManager.deleteCombatRequest(requestName, index)
            return
        }
    }

    private harassRequest(requestName: string, index: number) {
        const { room } = this.communeManager
        const request = Memory.combatRequests[requestName]
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return
        /*
        if (Game.time % Math.floor(Math.random() * 100) === 0) {
            const structures = requestRoom[CreepMemoryKeys.structureTarget]s

            let totalHits = 0
            for (const structure of structures) totalHits += structure.hits

            if (structures.length > 0)
                request[CombatRequestKeys.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
        }
 */
        // If there are threats to our hegemony, temporarily abandon the request

        const threateningAttacker = requestRoom.enemyAttackers.find(
            creep => creep.combatStrength.ranged + creep.combatStrength.ranged > 0,
        )

        if (threateningAttacker) {
            request[CombatRequestKeys.abandon] = 1500

            room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
            delete request[CombatRequestKeys.responder]
            return
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length) {
            request[CombatRequestKeys.abandon] = 1500
            request[CombatRequestKeys.abandonments] += 1
            this.manageAbandonment(requestName, index)
            return
        }
    }

    private defendRequest(requestName: string, index: number) {
        const { room } = this.communeManager
        const request = Memory.combatRequests[requestName]
        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) return

        if (requestRoom.controller && requestRoom.controller.safeMode) {
            request[CombatRequestKeys.abandon] = requestRoom.controller.safeMode

            this.manageAbandonment(requestName, index)
            return
        }

        for (const enemyCreep of requestRoom.enemyAttackers) {
            if (enemyCreep.combatStrength.ranged > request[CombatRequestKeys.minRangedHeal] * 4)
                request[CombatRequestKeys.minRangedHeal] = enemyCreep.combatStrength.ranged + 1

            if (enemyCreep.combatStrength.heal > request[CombatRequestKeys.minDamage] * enemyCreep.defenceStrength * 4)
                request[CombatRequestKeys.minDamage] = enemyCreep.combatStrength.heal + 1
        }

        if (!requestRoom.enemyDamageThreat) {
            request[CombatRequestKeys.inactionTimer] -= 1
            this.manageInaction(requestName, index)
        } else request[CombatRequestKeys.inactionTimer] = request[CombatRequestKeys.inactionTimerMax]
    }

    private manageInaction(requestName: string, index: number) {
        const request = Memory.combatRequests[requestName]

        if (request[CombatRequestKeys.inactionTimer] <= 0) {
            this.communeManager.deleteCombatRequest(requestName, index)
            return
        }
    }

    private manageAbandonment(requestName: string, index: number) {
        const request = Memory.combatRequests[requestName]

        if (request[CombatRequestKeys.abandonments] >= 3) {
            // Delete the request

            this.communeManager.deleteCombatRequest(requestName, index)
            return
        }

        if (request[CombatRequestKeys.abandon] > 0) {
            // Stop responding to the request

            this.communeManager.room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
            delete request[CombatRequestKeys.responder]
            return
        }
    }
}
