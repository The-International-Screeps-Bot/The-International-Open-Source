export function creepOrganizer() {

    // Loop through all of my creeps

    for (let creepName in Game.creeps) {

        let creep = Game.creeps[creepName]

        let room = creep.room

        // Organize creep by room and role

        room.myCreeps[creep.memory.role] = creep
    }
}
