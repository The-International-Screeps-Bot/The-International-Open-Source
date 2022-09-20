import { CombatRequestData, ClaimRequestNeeds, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.combatRequestManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    for (let index = 0; index < this.memory.combatRequests.length; index++) {
        const requestName = this.memory.combatRequests[index]
        const request = Memory.combatRequests[requestName]

        const requestRoom = Game.rooms[requestName]
        if (!requestRoom) continue

        if (Game.time % Math.floor(Math.random() * 100) === 0) {

            const structures = this.dismantleableStructures

            let totalHits = 0
            for (const structure of structures) totalHits += structure.hits
            
            if (structures.length > 0) request.data[CombatRequestData.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 100), 20)
        }

        // If there are threats to our hegemony, temporarily abandon the request

        const threateningAttacker = requestRoom.enemyAttackers.find(creep => creep.attackStrength > 0)

        if (threateningAttacker) {
            request.data[CombatRequestData.abandon] = 1500

            this.memory.combatRequests.splice(index, 1)
            delete request.responder
        }

        // If there are no enemyCreeps, delete the combatRequest

        if (!requestRoom.enemyCreeps.length) {
            delete Memory.combatRequests[requestName]
            this.memory.combatRequests.splice(index, 1)
            delete request.responder
        }
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
