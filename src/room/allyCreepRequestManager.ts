import { AllyCreepRequestNeeds, ClaimRequestNeeds, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.allyCreepRequestManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    if (this.memory.allyCreepRequest) {
        /*
        if (Memory.allyCreepRequests[this.memory.allyCreepRequest].abandon > 0) {
            delete this.memory.allyCreepRequest
            return
        }
        */

        Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[AllyCreepRequestNeeds.allyVanguard] = 20

        const request = Game.rooms[this.memory.allyCreepRequest]

        if (!request) return

        // If the room is owned and not by an ally, delete the request

        if (
            request.controller &&
            request.controller.owner &&
            !Memory.allyList.includes(request.controller.owner.username)
        ) {
            Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[AllyCreepRequestNeeds.allyVanguard] += 1
            return
        }

        // If there are no longer ally construction sites

        if (!request.allyCSites.length) {
            delete Memory.allyCreepRequests[this.memory.allyCreepRequest]
            delete this.memory.allyCreepRequest

            return
        }

        if (request.enemyCreeps.length) {
            Memory.allyCreepRequests[this.memory.allyCreepRequest].abandon = 20000
            Memory.allyCreepRequests[this.memory.allyCreepRequest].needs[AllyCreepRequestNeeds.allyVanguard] = 0

            delete this.memory.allyCreepRequest
        }
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog(
            'Ally Creep Request Manager',
            (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
            undefined,
            myColors.lightGrey,
        )
}
