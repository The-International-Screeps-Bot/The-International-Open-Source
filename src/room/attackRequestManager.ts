import { AttackRequestNeeds, ClaimRequestNeeds, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.attackRequestManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    for (let index = 0; index < this.memory.attackRequests.length; index++) {
        const roomName = this.memory.attackRequests[index]

        Memory.attackRequests[roomName].needs[AttackRequestNeeds.ranged] = 10

        const request = Game.rooms[roomName]

        if (!request) return

        // If there are enemyAttackers, abandon and stop the request

        if (request.enemyAttackers.length) {
            Memory.attackRequests[roomName].abandon = 1500
            Memory.attackRequests[roomName].needs[AttackRequestNeeds.ranged] = 0

            this.memory.attackRequests.splice(index, 1)
        }

        if (!request.enemyCreeps.length) {
            Memory.attackRequests[roomName].abandon = 1500
            Memory.attackRequests[roomName].needs[AttackRequestNeeds.ranged] = 0

            this.memory.attackRequests.splice(index, 1)
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
