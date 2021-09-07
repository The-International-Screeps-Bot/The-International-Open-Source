function antifaSupporterManager(room, assaulters, supporters) {

    const attackTarget = Memory.global.attackTarget

    for (let creep of supporters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom

        const assaulter = Game.creeps[creep.memory.assaulter]

        if (room.name == attackTarget) {

            // Creep is in room to attack 

            if (creep.isEdge()) {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, creep.room.name), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 1,
                })
            } else if (assaulter) {

                creep.say("A")

                if (creep.pos.getRangeTo(assaulter) > 1) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: assaulter.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                } else {

                    creep.move(creep.pos.getDirectionTo(assaulter))
                }
            } else {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        } else if (room.name == roomFrom) {

            // Creep is at home

            if (assaulter) {

                creep.say("A")

                if (creep.pos.getRangeTo(assaulter) > 1) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: assaulter.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                } else {

                    creep.move(creep.pos.getDirectionTo(assaulter))
                }
            } else {

                creep.say("FA")

                creep.findAssaulter(assaulters)
            }
        } else {

            // Creep is traveling to attackTarget

            if (creep.isEdge()) {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, creep.room.name), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 1,
                })
            } else if (assaulter) {

                creep.say("A")

                if (creep.pos.getRangeTo(assaulter) > 1) {

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: assaulter.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                } else {

                    creep.move(creep.pos.getDirectionTo(assaulter))
                }
            } else {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        }
    }
}

module.exports = antifaSupporterManager