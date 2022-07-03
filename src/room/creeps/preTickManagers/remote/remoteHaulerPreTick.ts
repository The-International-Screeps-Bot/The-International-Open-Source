import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker, RemoteHauler, RemoteReserver } from 'room/creeps/creepClasses'

RemoteHauler.prototype.preTickManager = function () {
     if (!this.memory.remoteName) return

     const role = this.memory.role as 'remoteHauler'

     // Reduce remote need

     if (Memory.rooms[this.memory.remoteName].needs)
          Memory.rooms[this.memory.remoteName].needs[remoteNeedsIndex[role]] -= this.parts.carry
}
