export function trafficManager(room: Room) {

    // Loop through moveRequests

    for (const [pos, creepNames] of room.moveRequests) {

        // Record iterations

        for (const creepName of creepNames) {

            // Try to find creepPositions at pos. Iterate if there are none

            const creepNameAtPos = room.creepPositions.get(pos)
            if (!creepNameAtPos) continue

            // If there is a creep name at the moveRequest pos

            if (creepNameAtPos) {

                // Get the creep with the name

                const creepAtPos = Game.creeps[creepNameAtPos]

                // Iterate if they aren't making a moveRequest

                if (!creepAtPos.moveRequest) continue

                // Otherwise operate the moveRequest

                creepAtPos.runMoveRequest(pos)
            }

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            // operate the moveRequest

            creep.runMoveRequest(pos)
            break
        }
    }
}
