import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker, RemoteHauler, RemoteReserver } from 'room/creeps/creepClasses'

RemoteHauler.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'remoteHauler'

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.carry
}
