import { claimRequestNeedsIndex } from "international/constants"
import { advancedFindDistance } from "international/generalFunctions"

Room.prototype.claimRequestManager = function() {

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
            return
        }

        if (claimTarget.controller.my) return

        Memory.claimRequests[this.memory.claimRequest].needs[claimRequestNeedsIndex.claimer]++
        return
    }

    // Every 50 or so ticks

    if (Game.time % Math.floor(Math.random() * 100) != 0) return

    if (Game.gcl.level <= Memory.communes.length) return

    delete this.memory.claimRequest

    for (const roomName in Memory.claimRequests) {

        const distance = advancedFindDistance(this.name, roomName, {
            keeper: Infinity,
            enemy: Infinity,
            enemyRemote: Infinity,
            ally: Infinity,
            allyRemote: Infinity,
            highway: Infinity,
        })

        if (distance > 10) continue

        this.memory.claimRequest = roomName
        return
    }
}
