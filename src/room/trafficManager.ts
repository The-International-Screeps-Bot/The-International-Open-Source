export function trafficManager(room: Room) {

    // Loop through moveRequests

    for (const [pos, creepNames] of room.moveRequests) {

        // Record iterations

        for (const creepName of creepNames) {

            // Try to find creepPositions at pos. Iterate if there are none

            const creepNameAtPos = room.creepPositions.get(pos)
            if (!creepNameAtPos) continue

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            // If there is a creep name at the moveRequest pos

            if (creepNameAtPos) {

                // Get the creep with the name

                const creepAtPos = Game.creeps[creepNameAtPos]

                // If there aren't making a moveRequest

                if (!creepAtPos.moveRequest) {

                    // Move to the creep's position

                    creepAtPos.runMoveRequest(creep.pos)
                }

                // Otherwise operate the moveRequest

                creepAtPos.runMoveRequest(creep.pos)
            }

            // operate the moveRequest

            creep.runMoveRequest(pos)
            break
        }
    }
}
