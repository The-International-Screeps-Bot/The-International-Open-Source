import { remoteNeedsIndex } from 'international/constants'
import { RemoteDefender } from 'room/creeps/creepClasses'

RemoteDefender.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'remoteDefender'

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.strength

    const commune = Game.rooms[this.commune]
    if (!commune) return

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
