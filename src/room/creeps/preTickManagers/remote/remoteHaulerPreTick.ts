import { remoteNeedsIndex } from 'international/constants'
import { RemoteCoreAttacker, RemoteHauler, RemoteReserver } from 'room/creeps/creepClasses'

RemoteHauler.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'remoteHauler'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {

        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.carry
}
