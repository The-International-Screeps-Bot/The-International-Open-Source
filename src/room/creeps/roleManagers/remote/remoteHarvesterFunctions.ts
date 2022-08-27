import { minHarvestWorkRatio, RemoteNeeds } from 'international/constants'
import { findCarryPartsRequired, getRange, unpackAsPos } from 'international/generalFunctions'
import { RemoteHarvester } from 'room/creeps/creepClasses'

RemoteHarvester.prototype.findRemote = function () {
    const creep = this
    // If the creep already has a remote, inform true

    if (creep.memory.remote) return true

    // Otherwise, get the creep's role

    const role = creep.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'
    // Get remotes by their efficacy

    const remoteNamesByEfficacy: string[] = Game.rooms[creep.commune]?.get('remoteNamesByEfficacy')

    // Loop through each remote name

    for (const roomName of remoteNamesByEfficacy) {
        // Get the remote's memory using its name

        const roomMemory = Memory.rooms[roomName]

        // If the needs of this remote are met, iterate

        if (roomMemory.needs[RemoteNeeds[role]] <= 0) continue

        // Otherwise assign the remote to the creep and inform true

        creep.memory.remote = roomName
        roomMemory.needs[RemoteNeeds[role]] -= this.parts.work

        return true
    }

    // Inform false

    return false
}

RemoteHarvester.prototype.travelToSource = function (sourceIndex) {
    const creep = this
    const { room } = creep

    // Try to find a harvestPosition, inform false if it failed

    if (!creep.findSourcePos(sourceIndex)) return false

    creep.say('🚬')

    // Unpack the harvestPos

    const harvestPos = unpackAsPos(creep.memory.packedPos)

    // If the creep is at the creep's packedHarvestPos, inform false

    if (getRange(creep.pos.x, harvestPos.x, creep.pos.y, harvestPos.y) === 0) return false

    // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

    creep.say(`⏩ ${sourceIndex}`)

    creep.createMoveRequest({
        origin: creep.pos,
        goal: {
            pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
            range: 0,
        },
        avoidEnemyRanges: true,
    })

    return true
}

RemoteHarvester.prototype.isDying = function () {
    // Inform as dying if creep is already recorded as dying

    if (this.memory.dying) return true

    // Stop if creep is spawning

    if (!this.ticksToLive) return false

    let sourceIndex = 0
    if (this.role === 'source2RemoteHarvester') sourceIndex = 1

    if (this.memory.remote)
        if (
            this.ticksToLive >
            this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.remote].SE[sourceIndex] - 1
        )
            return false
        else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

    // Record creep as dying

    this.memory.dying = true
    return true
}

RemoteHarvester.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    const commune = Game.rooms[this.commune]
    const remoteMemory = Memory.rooms[this.memory.remote]

    // Reduce remote need

    if (remoteMemory.needs) {
        if (!this.isDying()) Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.work

        const possibleReservation = commune.energyCapacityAvailable >= 650

        let sourceIndex = 0
        if (role === 'source2RemoteHarvester') sourceIndex = 1

        const income =
            (possibleReservation ? 10 : 5) - Math.floor(remoteMemory.needs[RemoteNeeds[role]] * minHarvestWorkRatio)

        // Find the number of carry parts required for the source, and add it to the remoteHauler need

        remoteMemory.needs[RemoteNeeds.remoteHauler] += findCarryPartsRequired(remoteMemory.SE[sourceIndex], income) / 2
    }

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
