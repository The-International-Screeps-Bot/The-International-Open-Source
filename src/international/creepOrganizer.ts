import { creepClasses } from "room/creeps/creepClasses"
import { remoteNeedsIndex } from "./constants"
import { pack } from "./generalFunctions"

/**
 * Organizes creeps into properties for their communeName, and tracks total creep count
 */
export function creepOrganizer() {

    // Construct counter for creeps

    let totalCreepCount: number = 0

    // Loop through all of my creeps

    for (const creepName in Memory.creeps) {

        const creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {

            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            continue
        }

        // Get the creep's current room and the room it's from

        const room = creep.room,

        // Get the creep's role

        role = creep.memory.role,

        // Find the creep a class based on its role

        creepsClass = creepClasses[role]

        // Assign creep proper class

        Game.creeps[creepName] = new creepsClass(creep.id)

        // Organize creep in its room by its role

        room.myCreeps[role].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount++

        // Add the creep's name to the position in its room

        room.creepPositions[pack(creep.pos)] = creep.name

        // Get the commune the creep is from

        const commune = Game.rooms[creep.memory.communeName]

        // If there is vision in the commune

        if (commune) {

            // If the creep isn't dying, organize by its roomFrom and role

            if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)

            // Record that the creep's existence in its roomFrom

            commune.creepsFromRoomAmount++
        }

        // If the creep has a remote

        if (creep.memory.remoteName) {

            // If the creep is a remoteHarvester, reduce the needs for its remote's remoteHarvester needs by the creeps number of work parts * harvest power

            if (role == 'remoteHarvester') Memory.rooms[creep.memory.remoteName].needs[remoteNeedsIndex.remoteHarvester] -= creep.partsOfType(WORK)

            // Otherwise if the creep is a remoteHauler, reduce its remote's needs by their number of carry parts

            else if (role == 'remoteHauler') Memory.rooms[creep.memory.remoteName].needs[remoteNeedsIndex.remoteHauler] -= creep.partsOfType(CARRY)
        }

        // Increase total creep counter

        totalCreepCount += 1
    }

    // Record number of creeps

    Memory.creepCount = totalCreepCount
}
