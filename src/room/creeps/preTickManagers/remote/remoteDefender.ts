import { remoteNeedsIndex } from 'international/constants'
import { RemoteDefender } from 'room/creeps/creepClasses'

RemoteDefender.prototype.preTickManager = function () {

    const { remoteName } = this.memory
    if (!remoteName) return

    const { commune } = this.memory
    if (!commune) return

    const { role } = this.memory

    // Reduce remote need

    Memory.rooms[remoteName].needs[remoteNeedsIndex[role as 'remoteDefender']] -= this.strength

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    commune.creepsFromRoomWithRemote[remoteName][role].push(this.name)
}
