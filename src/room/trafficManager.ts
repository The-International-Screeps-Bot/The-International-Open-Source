export function trafficManager(room: Room) {

    // Loop through moveRequests

    for (const stringPos in room.moveRequests) {
        const pos = JSON.parse(stringPos)
        room.visual.circle(pos.x, pos.y)
    }

    for (const stringPos in room.creepPositions) {
        const pos = JSON.parse(stringPos)
        room.visual.circle(pos.x, pos.y)
        global.customLog('test2', stringPos)
    }

    for (const stringPos in room.moveRequests) {

        const creepNames = room.moveRequests[stringPos]

        // Record iterations

        for (const creepName of creepNames) {

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            // Find the pos stringPos represents

            const pos = JSON.parse(stringPos)

            // Try to find creepPositions at pos

            const creepNameAtPos = room.creepPositions[stringPos]
            global.customLog('test', stringPos)
            if (!creepNameAtPos) {

                // Operate if there are no creeps at pos
                creep.say('RMR')
                creep.runMoveRequest(pos)
                break
            }

            // If there is a creep name at the moveRequest pos

            if (creepNameAtPos) {

                // Get the creep with the name

                const creepAtPos = Game.creeps[creepNameAtPos]
                creepAtPos.say('hi')
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
