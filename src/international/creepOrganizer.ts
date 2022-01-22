import { creepClasses } from "room/creeps/creepClasses"

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

        const room = creep.room
        const communeName = Game.rooms[creep.memory.communeName]

        // Assign the creep a class based on its role

        const creepClassName = creep.memory.role
        const creepsClass = creepClasses[creepClassName]

        // Assign creep proper class

        Game.creeps[creepName] = new creepsClass(creep.id)

        // Create an empty array of the role if there isn't one already

        if (!room.myCreeps[creep.memory.role]) room.myCreeps[creep.memory.role] = []

        // Organize creep by room and role

        room.myCreeps[creep.memory.role].push(creepName)

        // Add the creep's name to the position in its room

        room.creepPositions[JSON.stringify(creep.pos)] = creep.name

        // See if creep is dying

        creep.isDying()

        // Stop if creep is dying

        if (creep.memory.dying) continue

        // Increase creepCount for this role

        room.creepCount[creep.memory.role] += 1

        // Increase total creep counter

        totalCreepCount += 1
    }

    // Record number of creeps

    Memory.creepCount = totalCreepCount
}
