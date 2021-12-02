import creepClasses from '../room/creeps/creepClasses'

/**
 * Organizes creeps into properties for their roomFrom, and tracks total creep count
 */
export function creepOrganizer() {

    // Construct counter for creeps

    let totalCreepCount: number = 0

    // Loop through all of my creeps

    for (const creepName in Memory.creeps) {

        const creep: Creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {

            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            continue
        }

        // Find class for creep's role

        const creepsClass = creepClasses[creep.memory.role[0].toUpperCase()]

        // Assign creep proper class

        Game.creeps[creepName] = new creepsClass(creep)

        //

        const room: Room = creep.roomFrom

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
