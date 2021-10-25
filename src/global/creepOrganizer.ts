export function creepOrganizer() {

    // Loop through all of my creeps

    for (let creepName in Game.creeps) {

        let creep = Game.creeps[creepName]

        let room = creep.room

        // Organize creep by room and role

        room.myCreeps[creep.memory.role].push(creep)

        // See if creep is dying

        if (creep.ticksToLive <= creep.body.length * 3 && !creep.memory.dying) {

            creep.memory.dying = true
        }

        // Stop if creep is dying

        if (creep.memory.dying) continue

        room.creepCount[creep.memory.role] += 1
    }
}
