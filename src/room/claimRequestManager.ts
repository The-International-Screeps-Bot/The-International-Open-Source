import { autoClaim, claimRequestNeedsIndex, constants } from "international/constants"
import { advancedFindDistance, customLog } from "international/generalFunctions"
import { internationalManager } from "international/internationalManager"

Room.prototype.claimRequestManager = function() {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // If there is an existing claimRequest and it's valid, check if there is claimer need

    if (this.memory.claimRequest) {

        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.vanguard] = 20

        const claimTarget = Game.rooms[this.memory.claimRequest]
        if (!claimTarget) {

            Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer]++
            return
        }

        const spawns: StructureSpawn[] = claimTarget.get('spawn')

        // If there are no spawns, delete the claimRequest

        if (spawns.length) {

            delete Memory.claimRequests[this.memory.claimRequest]
            delete this.memory.claimRequest

            return
        }

        if (claimTarget.controller.my) return

        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer]++
        return
    }

    // Every 50 or so ticks

    /* if (Game.time % Math.floor(Math.random() * 100) != 0) return */

    // If autoClaim is disabled

    if (!autoClaim) return

    // If there are enough communes for the GCL

    if (Game.gcl.level <= Memory.communes.length) return

    // If a claimer can't be spawned

    if (this.energyCapacityAvailable < 750) return

    for (const roomName of internationalManager.findClaimRequestsByScore()) {

        const distance = advancedFindDistance(this.name, roomName, {
            keeper: Infinity,
            enemy: Infinity,
            enemyRemote: Infinity,
            ally: Infinity,
            allyRemote: Infinity,
        })

        if (distance > 10) continue

        this.memory.claimRequest = roomName
        return
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Claim Request Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
