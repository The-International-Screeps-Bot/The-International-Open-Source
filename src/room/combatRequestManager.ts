import { CombatRequestData, ClaimRequestNeeds, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.combatRequestManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    for (let index = 0; index < this.memory.combatRequests.length; index++) {
        const requestName = this.memory.combatRequests[index]
        const request = Memory.combatRequests[requestName]

        request.data[CombatRequestData.rangedAttack] = 10
        request.data[CombatRequestData.attack] = 10
        request.data[CombatRequestData.dismantle] = 5
        request.data[CombatRequestData.minDamage] = 5
        request.data[CombatRequestData.minHeal] = 6

        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) continue
/*
        // If there are enemyAttackers, abandon and stop the request

        if (requestRoom.enemyAttackers.length) {
            request.data[CombatRequestData.abandon] = 1500
            request.data[CombatRequestData.rangedAttack] = 0

            this.memory.combatRequests.splice(index, 1)
            delete request.responder
        }

        if (!requestRoom.enemyCreeps.length) {
            request.data[CombatRequestData.abandon] = 1500
            request.data[CombatRequestData.rangedAttack] = 0

            this.memory.combatRequests.splice(index, 1)
            delete request.responder
        }
 */
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
