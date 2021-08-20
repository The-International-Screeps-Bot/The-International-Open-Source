function antifaSupporterManager(room, assaulters, supporters) {

    const attackTarget = Memory.global.attackTarget

    for (let creep of supporters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom

        const assaulter = Game.creeps[creep.memory.assaulter]

        if (room.name == attackTarget) {

            // Creep is in room to attack


        } else if (room.name == roomFrom) {

            // Creep is at home

            if (assaulter) {

                creep.say("HA")

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: assaulter.pos, range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })
            } else {

                creep.say("FA")

                creep.findAssaulter(assaulters)
            }
        } else {

            // Creep is traveling to attackTarget

        }
    }
}

module.exports = antifaSupporterManager