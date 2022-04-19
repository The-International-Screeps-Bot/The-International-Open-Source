import { remoteNeedsIndex } from "international/constants"
import { RemoteDefender } from "room/creeps/creepClasses"

RemoteDefender.prototype.findRemote = function() {

    const creep = this
    // If the creep already has a remote, inform true

    if (creep.memory.remoteName) return true

    // Otherwise, get the creep's role

    const role = creep.memory.role as 'remoteDefender',

    // Get remotes by their efficacy

    remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

    // Loop through each remote name

    for (const roomName of remoteNamesByEfficacy) {

        // Get the remote's memory using its name

        const roomMemory = Memory.rooms[roomName]

        // If the needs of this remote are met, iterate

        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0) continue

        // Otherwise assign the remote to the creep and inform true

        creep.memory.remoteName = roomName
        roomMemory.needs[remoteNeedsIndex[role]] -= creep.partsOfType(WORK)

        return true
    }

    // Inform false

    return false
}

RemoteDefender.prototype.advancedAttackAttackers = function() {

    const creep = this,
    room = creep.room

    return false
}
