import '../room/creeps/creepClasses'

export function creepOrganizer() {

    // Loop through all of my creeps

    for (const creepName in Game.creeps) {

        const creep: Creep = Game.creeps[creepName]

        const room: Room = creep.room

        // Organize creep by room and role

        room.myCreeps[creep.memory.role].push(new creepClasses[creep.memory.role]())

        // See if creep is dying

        creep.isDying()

        // Stop if creep is dying

        if (creep.memory.dying) continue

        room.creepCount[creep.memory.role] += 1
    }
}
