import { claimRequestNeedsIndex } from "international/constants"
import { advancedFindDistance } from "international/generalFunctions"

Room.prototype.claimRequestManager = function() {

    // Every 50 or so ticks

    if (Game.time % Math.floor(Math.random() * 100) != 0) return

    if (Game.gcl.level <= Memory.communes.length) return

    // If there is an existing claimRequest and it's valid, check if there is claimer need

    if (this.memory.claimRequest && Memory.claimRequests[this.memory.claimRequest]) {

        const claimTarget = Game.rooms[this.memory.claimRequest]
        if (!claimTarget) {

            Memory.claimRequests[Memory.rooms[this.name].claimRequest].needs[claimRequestNeedsIndex.claimer]++
            return
        }

        if (claimTarget.controller.my) return

        Memory.claimRequests[Memory.rooms[this.name].claimRequest].needs[claimRequestNeedsIndex.claimer]++
        return
    }

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
