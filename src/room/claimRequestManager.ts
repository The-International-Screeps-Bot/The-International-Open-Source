import { claimRequestNeedsIndex, myColors } from 'international/constants'
import { advancedFindDistance, customLog } from 'international/generalFunctions'
import { internationalManager } from 'international/internationalManager'

Room.prototype.claimRequestManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // If there is an existing claimRequest and it's valid, check if there is claimer need

    if (this.memory.claimRequest) {
        if (Memory.claimRequests[this.memory.claimRequest].abandon > 0) {

            delete Memory.claimRequests[this.memory.claimRequest].responder
            delete this.memory.claimRequest
            return
        }

        if (this.energyCapacityAvailable < 750) {

            delete Memory.claimRequests[this.memory.claimRequest].responder
            delete this.memory.claimRequest
            return
        }

        const claimTarget = Game.rooms[this.memory.claimRequest]
        if (!claimTarget || !claimTarget.controller.my) {
            Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer] += 1
            return
        }

        // If there is a spawn

        if (claimTarget.structures.spawn.length) {
            delete Memory.claimRequests[this.memory.claimRequest]
            delete this.memory.claimRequest

            return
        }

        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguard] = claimTarget.structures
            .spawn.length
            ? 0
            : 20

        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] = 0

        // Get enemyCreeps in the room and loop through them

        for (const enemyCreep of claimTarget.enemyCreeps) {

            // If the enemy is an invader

            if (enemyCreep.owner.username === 'Invader') continue

            // Increase the defenderNeed according to the creep's strength

            Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguardDefender] +=
                enemyCreep.strength
        }

        return
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
