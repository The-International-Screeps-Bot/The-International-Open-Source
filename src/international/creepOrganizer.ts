import { creepClasses } from "room/creeps/creepClasses"
import { claimRequestNeedsIndex, remoteNeedsIndex, spawnByRoomRemoteRoles } from "./constants"
import { customLog, pack } from "./generalFunctions"
import { InternationalManager } from "./internationalManager"

import '../room/creeps/preTickManagers/international/scoutPreTickManager'

InternationalManager.prototype.creepOrganizer = function() {

    // Construct counter for creeps

    let totalCreepCount = 0

    // Loop through all of my creeps

    for (const creepName in Memory.creeps) {

        let creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {

            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            continue
        }

        // Increase total creep counter

        totalCreepCount += 1

        // Get the creep's current room and the room it's from

        const room = creep.room,

            // Get the creep's role

            role = creep.memory.role

        // Assign creep proper class

        creep = Game.creeps[creepName] = new creepClasses[role](creep.id)

        // Increase total creep counter

        totalCreepCount += 1

        // Organize creep in its room by its role

        room.myCreeps[role].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount++

        // Add the creep's name to the position in its room

        if (!creep.spawning) room.creepPositions[pack(creep.pos)] = creep.name

        // Get the commune the creep is from

        const commune = Game.rooms[creep.memory.communeName]

        creep.preTickManager()

        // If there is not vision in the commune, stop

        if (!commune) continue

        // If the creep isn't dying, organize by its roomFrom and role

        if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)

        // Record that the creep's existence in its roomFrom

        commune.creepsFromRoomAmount++

        // Get the creep's remoteName

        const remoteName = creep.memory.remoteName

        // If the creep has a remote

        if (remoteName && commune.memory.remotes.includes(remoteName)) {

            // If the creep is a source1RemoteHarvester

            if (role == 'source1RemoteHarvester') {

                // Reduce the needs for its remote's remoteHarvester needs by the creeps number of work parts * harvest power

                Memory.rooms[remoteName].needs[remoteNeedsIndex[role]] -= creep.partsOfType(WORK)

                // Add the creep to creepsFromRoomWithRemote relative to its remote

                commune.creepsFromRoomWithRemote[remoteName][role].push(creep.name)
                continue
            }

            // If the creep is a source2RemoteHarvester

            if (role == 'source2RemoteHarvester') {

                // Reduce the needs for its remote's remoteHarvester needs by the creeps number of work parts * harvest power

                Memory.rooms[remoteName].needs[remoteNeedsIndex[role]] -= creep.partsOfType(WORK)

                // Add the creep to creepsFromRoomWithRemote relative to its remote

                commune.creepsFromRoomWithRemote[remoteName][role].push(creep.name)
                continue
            }

            // Otherwise if the creep is a remoteHauler, reduce its remote's needs by their number of carry parts

            if (role == 'remoteHauler') {

                Memory.rooms[remoteName].needs[remoteNeedsIndex[role]] -= creep.partsOfType(CARRY)
                continue
            }

            // Otherwise if the creep is a remoteReserver

            if (role == 'remoteReserver') {

                // Reduce its remote's needs by 1

                Memory.rooms[remoteName].needs[remoteNeedsIndex[role]] -= 1

                // Add the creep to creepsFromRoomWithRemote relative to its remote

                commune.creepsFromRoomWithRemote[remoteName][role].push(creep.name)
                continue
            }

            // Otherwise if the creep is a remoteDefender

            if (role == 'remoteDefender') {

                // Reduduce the remote's defender need proportionate to the creep's strength

                Memory.rooms[remoteName].needs[remoteNeedsIndex[role]] -= creep.findStrength()
                continue
            }
        }
    }

    // Record number of creeps

    Memory.stats.creeps = totalCreepCount
}
