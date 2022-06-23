import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker, RemoteHarvester, RemoteHauler, RemoteReserver } from 'room/creeps/creepClasses'

RemoteHarvester.prototype.preTickManager = function () {
     if (!this.memory.remoteName) return

     const role = this.memory.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

     // Reduce remote need

     Memory.rooms[this.memory.remoteName].needs[remoteNeedsIndex[role]] -= this.parts.work

     const commune = Game.rooms[this.memory.communeName]
     if (!commune) return

     // Add the creep to creepsFromRoomWithRemote relative to its remote

     commune.creepsFromRoomWithRemote[this.memory.remoteName][role].push(this.name)
}
