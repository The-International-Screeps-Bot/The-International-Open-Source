import { generalFuncs } from "international/generalFunctions"

export function trafficManager(room: Room) {

    function canRunMoveRequest() {


    }

    // Loop through moveRequests

    for (const stringPos in room.moveRequests) {

        // Get creeps making move requests to this pos

        const creepNames = room.moveRequests[stringPos]

        // Loop through those creeps

        for (const creepName of creepNames) {

            // Get the creep with the name of creepName

            const creep = Game.creeps[creepName]

            // Find the pos stringPos represents

            const pos: Pos = JSON.parse(stringPos)

            // Try to find the name of the creep at pos

            const creepNameAtPos = room.creepPositions[stringPos]

            // If there is no creep at the pos

            if (!creepNameAtPos) {

                // Operate and stop loop if there are no creeps at pos

                creep.runMoveRequest(pos)
                break
            }

            // Otherwise

            // Get the creep with the name

            const creepAtPos = Game.creeps[creepNameAtPos]

            // If the creepAtPos has a moveRequest

            if (creepAtPos.moveRequest) {

                // Enforce the creepAtPos's moveRequest

                creepAtPos.runMoveRequest(creep.pos)

                // Enforce the creep's moveRequest

                creep.runMoveRequest(pos)

                // And stop the loop

                break
            }

            // Otherwise

            // if the creepAtPos is meant to be pulled, stop the loop

            if (creepAtPos.memory.getPulled) break

            // If the creep is fatigued, stop the loop

            if(creepAtPos.fatigue > 0) break

            // If the creep's final path pos is the same as the pos

            if (creep.memory.getPulled) {

                // Remove information about previous move requests

                delete creep.moveRequest
                delete creep.memory.goalPos

                // Try to path to the targetPos while avoiding the creep

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: creep.pathOpts.goal,
                    avoidImpassibleStructures: true,
                    avoidEnemyRanges: true,
                    weightPositions: {
                        255: [pos]
                    },
                })

                // Operate the moveRequest and stop the loop

                creep.runMoveRequest(creep.memory.path[0])
                break
            }

            // If the creep is pulling or the last pos in the creep's path has creepAtPos

            if (creep.pulling || generalFuncs.arePositionsEqual(creep.memory.path[creep.memory.path.length - 1], pos)) {

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

                // If creepAtPos generated a new path, operate its moveRequest

                if (creepAtPos.memory.path.length > 0) creepAtPos.runMoveRequest(creepAtPos.memory.path[0])

                // Operate the creep's moveRequest and stop the loop

                creep.runMoveRequest(pos)
                break
            }

            // Otherwise have the creeps trade positions

            // Enforce the creepAtPos's moveRequest

            creepAtPos.runMoveRequest(creep.pos)

            // Enforce the creep's moveRequest

            creep.runMoveRequest(pos)

            // And stop the loop

            break

            /* // If the creep is responding to a pull request

            if (global[creep.id]) {

                // Push the creepAtPos

                creepAtPos.getPushed()

                // Have the creep move to the pos

                creep.runMoveRequest(pos)

                // And stop the loop

                break
            } */
        }
    }
}
