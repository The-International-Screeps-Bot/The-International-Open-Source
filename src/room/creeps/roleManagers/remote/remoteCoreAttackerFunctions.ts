import { remoteNeedsIndex } from 'international/constants'
import { getRange } from 'international/generalFunctions'
import { creepClasses, RemoteCoreAttacker } from 'room/creeps/creepClasses'

RemoteCoreAttacker.prototype.findRemote = function () {
    const creep = this

    // If the creep already has a remote, inform true

    if (creep.memory.remoteName) return true

    // Otherwise, get the creep's role

    const role = creep.memory.role as 'remoteCoreAttacker'

    // Get remotes by their efficacy

    const remoteNamesByEfficacy: string[] = Game.rooms[
        creep.memory.communeName
    ]?.get('remoteNamesByEfficacy')

    // Loop through each remote name

    for (const roomName of remoteNamesByEfficacy) {
        // Get the remote's memory using its name

        const roomMemory = Memory.rooms[roomName]

        // If the needs of this remote are met, iterate

        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0) continue

        // Otherwise assign the remote to the creep and inform true

        creep.memory.remoteName = roomName
        roomMemory.needs[remoteNeedsIndex[role]] -= 1

        return true
    }

    // Inform false

    return false
}

RemoteCoreAttacker.prototype.advancedAttackCores = function () {
    const { room } = this

    // If there are no cores

    if (!room.structures.invaderCore.length) return false

    // Find the closest core

    const closestCore = this.pos.findClosestByRange(room.structures.invaderCore)

    // If the creep at the core

    if (
        getRange(
            this.pos.x - closestCore.pos.x,
            this.pos.y - closestCore.pos.y
        ) === 1
    ) {
        this.say('🗡️C')

        this.attack(closestCore)
        return true
    }

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    this.say('⏩C')

    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: closestCore.pos, range: 1 },
        avoidEnemyRanges: true,
    })

    return true
}
