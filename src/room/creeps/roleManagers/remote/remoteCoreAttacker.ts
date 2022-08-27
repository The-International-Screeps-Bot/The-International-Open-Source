import { RemoteNeeds } from 'international/constants'
import { getRange } from 'international/generalFunctions'
import { RemoteCoreAttacker } from 'room/creeps/creepClasses'

export function remoteCoreAttackerManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
        const creep: RemoteCoreAttacker = Game.creeps[creepName]

        // Try to find a remote

        if (!creep.findRemote()) {
            // If the room is the creep's commune

            if (room.name === creep.commune) {
                // Advanced recycle and iterate

                creep.advancedRecycle()
                continue
            }

            // Otherwise, have the creep make a moveRequest to its commune and iterate

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 25,
                },
            })

            continue
        }

        creep.say(creep.memory.remote)

        if (creep.advancedAttackCores()) continue

        // If the creep is its remote

        if (room.name === creep.memory.remote) {
            delete creep.memory.remote
            continue
        }

        // Otherwise, create a moveRequest to its remote

        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
        })
    }
}

RemoteCoreAttacker.prototype.findRemote = function () {
    const creep = this

    // If the creep already has a remote, inform true

    if (creep.memory.remote) return true

    // Otherwise, get the creep's role

    const role = creep.role as 'remoteCoreAttacker'

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
        roomMemory.needs[RemoteNeeds[role]] -= 1

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

    const closestCore = room.structures.invaderCore[0]

    // If the creep at the core

    if (getRange(this.pos.x, closestCore.pos.x, this.pos.y, closestCore.pos.y) === 1) {
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

RemoteCoreAttacker.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'remoteCoreAttacker'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs) Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= 1

    const commune = Game.rooms[this.commune]

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
