import { remoteNeedsIndex } from 'international/constants'
import { RemoteDefender } from 'room/creeps/creepClasses'

RemoteDefender.prototype.preTickManager = function () {
     if (!this.memory.remoteName) return

     const role = this.memory.role as 'remoteDefender'

     // Reduce remote need

     if (Memory.rooms[this.memory.remoteName].needs)
          Memory.rooms[this.memory.remoteName].needs[remoteNeedsIndex[role]] -= this.strength

     const commune = Game.rooms[this.memory.communeName]
     if (!commune) return

     // Add the creep to creepsFromRoomWithRemote relative to its remote

     if (commune.creepsFromRoomWithRemote[this.memory.remoteName])
          commune.creepsFromRoomWithRemote[this.memory.remoteName][role].push(this.name)
}
