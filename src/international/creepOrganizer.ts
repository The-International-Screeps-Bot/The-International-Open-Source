import * as creepClasses from '../room/creeps/creepClasses'

/**
 * Organizes creeps into properties for their roomFrom, and tracks total creep count
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
        const roomFrom = Game.rooms[creep.memory.roomFrom]

        // Assign the creep a class based on its role

        const creepClassName = creep.memory.role[0].toUpperCase()
        const creepsClass = creepClasses[creepClassName as keyof typeof creepClasses]

        // Assign creep proper class

        Game.creeps[creepName] = new creepsClass(creep.id)

        // Create an empty array of the role if there isn't one already

        if (!room.myCreeps[creep.memory.role]) room.myCreeps[creep.memory.role] = []

        // Organize creep by room and role

        room.myCreeps[creep.memory.role].push(creepName)

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
