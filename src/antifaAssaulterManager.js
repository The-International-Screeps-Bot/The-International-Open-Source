const findAnchor = require("./findAnchor")

function antifaAssaulterManager(room, assaulters) {

    for (let creep of assaulters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom
        const attackTarget = Memory.global.attackTarget

        const type = creep.memory.type
        const size = creep.memory.size
        const amount = creep.memory.amount
        const requiredAmount = creep.memory.amount
        const part = creep.memory.part

        const supporter = Game.creeps[creep.memory.supporter]
        const secondLeader = Game.creeps[creep.memory.secondAssaulter]
        const secondSupporter = Game.creeps[creep.memory.secondSupporter]

        const members = [creep, supporter, secondLeader, secondSupporter]

        console.log(JSON.stringify(members))

        creep.findAmount(members)

        if (room.name == attackTarget) {

            // Creep is in room to attack


        } else if (room.name == roomFrom) {

            // Creep is at home

            if (creep.isSquadFull()) {

                creep.say("Full")

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
                    } else {

                        if (size == "quad" && supporter && creep.pos.getRangeTo(supporter) == 1) {

                            creep.findDuo(assaulters)
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