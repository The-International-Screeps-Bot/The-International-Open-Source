export function trafficManager(room: Room) {

    const creepPositions = room.creepPositions
    const moveRequests = room.moveRequests

    for (const [pos, creepNames] of moveRequests) {

        // Record iterations

        let i = -1

        while (i < creepNames.length) {

            // Increase i

            i++

            // Try to find creepPositions at pos. Iterate if there are none

            const creepNamesAtPos = creepPositions.get(pos)
            if (!creepNamesAtPos) continue

            // Try to find the name of the creep at the pos. Iterate if there is none

            const creepNameAtPos = creepNamesAtPos[i]
            if (!creepNamesAtPos) continue

            // Get the creep with the name

            const creepAtPos: Creep = Game.creeps[creepNameAtPos]

            // If there is a creep at the requested move pos

            if (creepAtPos.length > 0) {

                // Iterate if they aren't making a moveRequest

                if (!creepAtPos.moveRequest) continue

                // Otherwise operate the moveRequest

                creepAtPos.runMoveRequest(pos)
            }

            // Get the creep's name

            const creepName = moveRequests.get(pos)[i]

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            //

            creep.runMoveRequest(pos)
            break
        }
    }
}
