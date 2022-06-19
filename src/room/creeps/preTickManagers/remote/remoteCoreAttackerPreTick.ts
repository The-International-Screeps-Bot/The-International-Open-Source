import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker } from 'room/creeps/creepClasses'

RemoteCoreAttacker.prototype.preTickManager = function () {

    const { remoteName } = this.memory
    if (!remoteName) return

    const { commune } = this.memory
    if (!commune) return

    const { role } = this.memory

    // Reduce remote need

    Memory.rooms[remoteName].needs[remoteNeedsIndex[role as 'remoteCoreAttacker']] -= 1

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    commune.creepsFromRoomWithRemote[remoteName][role].push(this.name)
}
