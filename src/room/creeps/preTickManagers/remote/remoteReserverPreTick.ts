import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker, RemoteReserver } from 'room/creeps/creepClasses'

RemoteReserver.prototype.preTickManager = function () {
    if (!this.memory.remoteName) return

    const role = this.memory.role as 'remoteReserver'

    // Reduce remote need

    if (Memory.rooms[this.memory.remoteName].needs)
        Memory.rooms[this.memory.remoteName].needs[remoteNeedsIndex[role]] -= 1

    const commune = Game.rooms[this.memory.commune]
    if (!commune) return

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remoteName])
        commune.creepsFromRoomWithRemote[this.memory.remoteName][role].push(this.name)
}
