import { ClaimRequestNeeds, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.claimRequestManager = function () {
    if (!this.memory.claimRequest) return

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    const request = Memory.claimRequests[this.memory.claimRequest]

    // If the claimRequest doesn't exist anymore somehow, stop trying to do anything with it

    if (!request) {
        delete this.memory.claimRequest
        return
    }

    // If the request has been abandoned, have the commune abandon it too

    if (request.abandon > 0) {
        delete request.responder
        delete this.memory.claimRequest
        return
    }

    if (this.energyCapacityAvailable < 650) {
        delete request.responder
        delete this.memory.claimRequest
        return
    }

    const requestRoom = Game.rooms[this.memory.claimRequest]
    if (!requestRoom || !requestRoom.controller.my) {
        request.needs[ClaimRequestNeeds.claimer] = 1
        return
    }

    // If there is a spawn

    if (requestRoom.structures.spawn.length) {
        delete Memory.claimRequests[this.memory.claimRequest]
        delete this.memory.claimRequest
        return
    }

    // If there is an invader core

    const invaderCores = requestRoom.structures.invaderCore
    if (invaderCores.length) {
        // Abandon for its remaining existance plus the estimated reservation time

        request.abandon = invaderCores[0].effects[EFFECT_COLLAPSE_TIMER].ticksRemaining + CONTROLLER_RESERVE_MAX

        delete request.responder
        delete this.memory.claimRequest
        return
    }

    request.needs[ClaimRequestNeeds.vanguard] = requestRoom.structures.spawn.length ? 0 : 20

    request.needs[ClaimRequestNeeds.minDamage] = 0
    request.needs[ClaimRequestNeeds.minHeal] = 0

    // Increase the defenderNeed according to the enemy attackers' combined strength

    for (const enemyCreep of requestRoom.enemyCreeps) {
        if (enemyCreep.owner.username === 'Invader') continue

        request.needs[ClaimRequestNeeds.minDamage] += 10 + enemyCreep.healStrength
        request.needs[ClaimRequestNeeds.minHeal] += enemyCreep.attackStrength
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog(
            'Claim Request Manager',
            (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
            undefined,
            myColors.lightGrey,
        )
}
