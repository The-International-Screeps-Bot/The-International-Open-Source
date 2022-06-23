import { remoteNeedsIndex } from 'international/constants'
import { RemoteDismantler } from 'room/creeps/creepClasses'

RemoteDismantler.prototype.preTickManager = function () {
     if (!this.memory.remoteName) return

     const role = this.memory.role as 'remoteDismantler'

     // Reduce remote need

     Memory.rooms[this.memory.remoteName].needs[remoteNeedsIndex[role]] -= 1

     const commune = Game.rooms[this.memory.communeName]
     if (!commune) return

     // Add the creep to creepsFromRoomWithRemote relative to its remote

     if (commune.creepsFromRoomWithRemote[this.memory.remoteName])commune.creepsFromRoomWithRemote[this.memory.remoteName][role].push(this.name)
}
