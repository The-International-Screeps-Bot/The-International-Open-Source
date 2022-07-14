import { remoteNeedsIndex } from 'international/constants'
import { RemoteDismantler } from 'room/creeps/creepClasses'

RemoteDismantler.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.memory.role as 'remoteDismantler'

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs) Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= 1

    const commune = Game.rooms[this.memory.commune]
    if (!commune) return

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
