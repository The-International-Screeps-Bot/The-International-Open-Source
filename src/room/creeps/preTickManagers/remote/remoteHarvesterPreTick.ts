import { remoteNeedsIndex } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import { RemoteCoreAttacker, RemoteHarvester, RemoteHauler, RemoteReserver } from 'room/creeps/creepClasses'

RemoteHarvester.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {

        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs)
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.work

    const commune = Game.rooms[this.commune]

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
