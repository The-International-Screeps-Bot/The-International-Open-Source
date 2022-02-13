Room.prototype.towersHealCreeps = function() {

    const room = this

    // Stop if there are no actionable towers left

    if (room.get('tower').length == 0) return

    // Construct heal targets from my and allied damaged creeps in the room

    const healTargets: Creep[] = room.get('myDamagedCreeps').concat(room.get('damagedAllyCreeps'))

    // Get the room's towers

    const towers: StructureTower[] = room.get('tower')

    // Loop through the room's towers

    for (const tower of towers) {

        // Iterate if the tower is not actionable

        if (!tower.actionable) continue

        // Otherwise, get the first heal target

        const creep = healTargets[0]

        // Try to heal the creep

        const healResult = tower.heal(creep)

        // If the heal failed, iterate

        if (healResult != OK) continue

        // Otherwise record that the tower is no longer actionable

        tower.actionable = false

        // Remove healTarget if it is fully healed

        if (creep.hitsMax - creep.hits == 0) delete healTargets[0]

        // And iterate

        continue
    }
}
