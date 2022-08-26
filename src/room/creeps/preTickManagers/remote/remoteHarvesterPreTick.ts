import { minHarvestWorkRatio, remoteHarvesterRoles, remoteNeedsIndex } from 'international/constants'
import { customLog, findCarryPartsRequired } from 'international/generalFunctions'
import {
    creepClasses,
    RemoteCoreAttacker,
    RemoteHarvester,
    RemoteHauler,
    RemoteReserver,
} from 'room/creeps/creepClasses'

RemoteHarvester.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    const commune = Game.rooms[this.commune]
    const remoteMemory = Memory.rooms[this.memory.remote]

    // Reduce remote need

    if (remoteMemory.needs) {
        if (!this.isDying()) Memory.rooms[this.memory.remote].needs[remoteNeedsIndex[role]] -= this.parts.work

        const possibleReservation = commune.energyCapacityAvailable >= 650

        let sourceIndex = 0
        if (role === 'source2RemoteHarvester') sourceIndex = 1

        const income =
            (possibleReservation ? 10 : 5) -
            Math.floor(remoteMemory.needs[remoteNeedsIndex[role]] * minHarvestWorkRatio)

        // Find the number of carry parts required for the source, and add it to the remoteHauler need

        remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(remoteMemory.SE[sourceIndex], income) / 2
    }

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
