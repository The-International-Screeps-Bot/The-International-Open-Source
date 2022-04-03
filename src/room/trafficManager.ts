

export function trafficManager(room: Room) {

    // Loop through moveRequests

    for (const stringPos in room.moveRequests) {

        // Get creeps making move requests to this pos

        const creepNames = room.moveRequests[stringPos]

        // Loop through those creeps

        for (const creepName of creepNames) {

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            // Handle traffic for this position

            creep.recurseMoveRequest(stringPos)

            /* // Find the pos stringPos represents

            const pos: Pos = JSON.parse(stringPos)

            // Try to find the name of the creep at pos

            const creepNameAtPos = room.creepPositions[stringPos]

            // If there is no creep at the pos

            if (!creepNameAtPos) {

                // If there are no creeps at the pos, operate the moveRequest and stop the loop

                creep.runMoveRequest(pos)
                break
            }

            // Otherwise

            // Get the creep with the name

            const creepAtPos = Game.creeps[creepNameAtPos] */

            // If there is a creep that moves through pull is in the way and it isn't actively getting pulled

            /* if (creepAtPos.memory.getPulled && !creepAtPos.gettingPulled) {

                // Remove information about previous move requests from the creep

                delete creep.moveRequest

                // If the creep has no goalPos in memory, stop the loop

                if (creep.memory.goalPos) break

                // Otherwise try to path to the targetPos while avoiding the pos

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: creep.pathOpts.goal,
                    avoidImpassibleStructures: true,
                    avoidEnemyRanges: true,
                    weightPositions: {
                        255: [pos]
                    },
                })

                // If the creep generated a new path, enforce a moveRequest using it

                if (creep.memory.path.length > 0) creep.runMoveRequest(creep.memory.path[0])

                // And stop the loop

                break
            }

            // If the creep is pulling

            if (creep.pulling) {

                // Remove information about previous move requests from creepAtPos

                delete creepAtPos.moveRequest

                // If the creepAtPos has a goalPos in memory

                if (creepAtPos.memory.goalPos) {

                    // Force creepAtPos to repath to its target while avoiding the creep

                    creepAtPos.createMoveRequest({
                        origin: creepAtPos.pos,
                        goal: { pos: creepAtPos.memory.goalPos, range: 1 },
                        avoidImpassibleStructures: true,
                        avoidEnemyRanges: true,
                        weightPositions: {
                            255: [pos, creep.pos]
                        },
                    })

                    // If the creepAtPos failed to generate a new path, push the it

                    if (creepAtPos.memory.path.length == 0) creepAtPos.getPushed()

                    // OOtherwise operate creepAtPos's moveRequest

                    else creepAtPos.runMoveRequest(creepAtPos.memory.path[0])
                }

                // Otherwise push the creepAtPos

                else creepAtPos.getPushed()

                // Operate the creep's moveRequest and stop the loop

                creep.runMoveRequest(pos)
                break
            } */

            /* // If the creepAtPos has a moveRequest

            if (creepAtPos.moveRequest) {

                // Enforce the creepAtPos's moveRequest

                creepAtPos.runMoveRequest(creepAtPos.memory.path[0])

                // Enforce the creep's moveRequest

                creep.runMoveRequest(pos)

                // And stop the loop

                break
            }

            // If the creepAtPos is fatigued, stop the loop

            if(creepAtPos.fatigue > 0) break */

            /* // If the last pos in the creep's path has creepAtPos

            if (arePositionsEqual(creep.memory.path[creep.memory.path.length - 1], pos)) {

                // If the creepAtPos has a goalPos in memory

                if (creepAtPos.memory.goalPos) {

                    // If creepAtPos is in range to its goalPos

                    if (creepAtPos.pos.getRangeTo(creepAtPos.memory.goalPos)) {


                    }

                    // Force creepAtPos to repath to its target while avoiding the creep

                    creepAtPos.createMoveRequest({
                        origin: creepAtPos.pos,
                        goal: { pos: creepAtPos.memory.goalPos, range: 1 },
                        avoidImpassibleStructures: true,
                        avoidEnemyRanges: true,
                        weightPositions: {
                            255: [pos, creep.pos]
                        },
                    })

                    // If the creepAtPos failed to generate a new path, push the creep

                    if (creepAtPos.memory.path.length == 0) creepAtPos.getPushed()

                    // Otherwise operate creepAtPos's moveRequest

                    else creepAtPos.runMoveRequest(creepAtPos.memory.path[0])
                }

                // Otherwise push the creepAtPos

                else creepAtPos.getPushed()

                // Operate the creep's moveRequest and stop the loop

                creep.runMoveRequest(pos)
                break
            } */

            /* creep.tradePositions(creepAtPos)

            // And stop the loop

            break */
        }
    }
}
