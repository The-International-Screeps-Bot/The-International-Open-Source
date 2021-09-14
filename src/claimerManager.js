function claimerManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("claimerFunctions")

    for (let creep of creepsWithRole) {

        if (creep.avoidHostiles()) continue

        const newCommune = Memory.global.newCommune

        if (!newCommune) continue

        if (room.name == newCommune) {

            creep.advancedClaim()

        } else {

            creep.say("NC " + newCommune)

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, newCommune), range: 1 },
                plainCost: 1,
                swampCost: 1,
                defaultCostMatrix: false,
                avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                flee: false,
                cacheAmount: 10,
            })
        }
    }
}

module.exports = claimerManager