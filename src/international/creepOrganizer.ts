import { creepClasses } from 'room/creeps/creepClasses'
import { myColors, spawnByRoomRemoteRoles } from './constants'
import { customLog, pack } from './generalFunctions'
import { InternationalManager } from './internationalManager'

import '../room/creeps/preTickManagers/international/scoutPreTick'

import '../room/creeps/preTickManagers/remote/remoteHarvesterPreTick'
import '../room/creeps/preTickManagers/remote/remoteHaulerPreTick'
import '../room/creeps/preTickManagers/remote/remoteReserverPreTick'
import '../room/creeps/preTickManagers/remote/remoteDefenderPreTick'
import '../room/creeps/preTickManagers/remote/remoteCoreAttackerPreTick'
import '../room/creeps/preTickManagers/remote/remoteDismantlerPreTick'

InternationalManager.prototype.creepOrganizer = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

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

        // Get the creep's role

        const { role } = creep
        if (!role) continue

        // Assign creep a class based on role

        creep = Game.creeps[creepName] = new creepClasses[role](creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        // Organize creep in its room by its role

        room.myCreeps[role].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount += 1

        // Add the creep's name to the position in its room

        if (!creep.spawning) room.creepPositions[pack(creep.pos)] = creep.name

        creep.preTickManager()

        creep.reservationManager()

        // Get the commune the creep is from

        const commune = Game.rooms[creep.commune]

        // If there is not vision in the commune, stop

        if (!commune) continue

        // If the creep isn't dying, organize by its roomFrom and role

        if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)

        // Record that the creep's existence in its roomFrom

        commune.creepsFromRoomAmount += 1
    }

    if (Memory.cpuLogging)
        customLog('Creep Organizer', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
}
