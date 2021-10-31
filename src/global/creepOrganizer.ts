import * as creepClasses from '../room/creeps/creepClasses'

export function creepOrganizer() {

    // Loop through all of my creeps

    for (const creepName in Game.creeps) {

        const creep: Creep = Game.creeps[creepName]

        const room: Room = creep.room

        // Construct object for role if it doesn't exist

        if (!room.myCreeps[creep.memory.role]) room.myCreeps[creep.memory.role] = []

        // Organize creep by room and role

        room.myCreeps[creep.memory.role].push(new creepClasses[creep.memory.role](creep))

        // See if creep is dying

        creep.isDying()

        // Stop if creep is dying

        if (creep.memory.dying) continue

        // Increase creepCount for this role

        room.creepCount[creep.memory.role] += 1
    }
}
