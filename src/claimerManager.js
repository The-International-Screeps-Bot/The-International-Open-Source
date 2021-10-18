require("claimerFunctions")

module.exports = function claimerManager(room, creepsWithRole) {

    // Stop if there are no creeps

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        if (creep.avoidEnemys()) continue

        const newCommune = Memory.global.newCommune

        // Stop if there is no newCommune

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