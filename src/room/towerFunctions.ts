Room.prototype.healCreeps = function(towers) {

    const room: Room = this

    // Construct heal targets from my and allied damaged creeps in the room

    const healTargets = room.get('myDamagedCreeps').concat(room.get('damagedAllyCreeps'))

    // Track iterations

    let i = 0

    // Iterate through towers that haven't yet done an intent

    for (const tower of room.actionableTowers) {

        // Get the first heal target

        const creep = Game.creeps[healTargets[0]]

        // Try to heal the creep

        const healResult = tower.heal(creep)

        // If the heal failed

        if (healResult != 0) {

            // Record iteration and iterate

            i++
            continue
        }

        // Otherwise remove the tower from actionableTowers

        delete room.actionableTowers[i]

        // Remove healTarget if it is fully healed

        if (creep.hitsMax - creep.hits == 0) delete healTargets[0]

        // And iterate

        continue
    }
}
