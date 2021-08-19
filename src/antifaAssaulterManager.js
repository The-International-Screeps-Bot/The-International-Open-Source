require("antifaFunctions")

function antifaAssaulterManager(room, creepsWithRole) {

    // Make sure there is something to attack

    const attackTarget = Memory.global.attackTarget

    if (!attackTarget) return "No attack target"

    for (let creep of creepsWithRole) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom
        const attackTarget = Memory.global.attackTarget

        const squad = creep.memory.squad


        if (room.name == attackTarget) {

            // Creep is in room to attack


        } else if (room.name == roomFrom) {

            // Creep is at home

            if (creep.isSquadFull(squad)) {


            } else {

                const anchorPoint = creep.room.memory.anchorPoint

                if (anchorPoint) {

                    if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) != 6) {

                        creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                        if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                            creep.advancedPathing({
                                origin: creep.pos,
                                goal: { pos: anchorPoint, range: 6 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: false,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        } else {

                            creep.advancedPathing({
                                origin: creep.pos,
                                goal: { pos: anchorPoint, range: 6 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: false,
                                avoidStages: [],
                                flee: true,
                                cacheAmount: 10,
                            })
                        }
                    }
                }
            }
        } else {

            // Creep is traveling to attackTarget

        }
    }
}

module.exports = antifaAssaulterManager