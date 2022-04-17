import { constants, remoteNeedsIndex } from "international/constants";
import { getRangeBetween } from "international/generalFunctions";
import { RemoteHarvester } from "room/creeps/creepClasses";

RemoteHarvester.prototype.findRemote = function() {

    const creep = this
    // If the creep already has a remote, inform true

    if (creep.memory.remoteName) return true

    // Otherwise, get the creep's role

    const role = creep.memory.role as ('source1RemoteHarvester' | 'source2RemoteHarvester'),

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

RemoteHarvester.prototype.travelToSource = function(sourceName) {

    const creep = this,
    room = creep.room

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findSourceHarvestPos(sourceName)) return false

    creep.say('🚬')

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRangeBetween(creep.pos.x, creep.pos.y, Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50)) == 0) return false

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say('⏩ ' + sourceName)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: new RoomPosition(Math.floor(creep.memory.packedHarvestPos / constants.roomDimensions), Math.floor(creep.memory.packedHarvestPos % 50), room.name), range: 0 },
        avoidEnemyRanges: true,
        weightGamebjects: {
            1: room.get('road')
        }
    })

    return true
}
