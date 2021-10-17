module.exports = function stationaryHaulerManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("stationaryHaulerFunctions")

    let anchorPoint = room.get("anchorPoint")

    for (let creep of creepsWithRole) {

        if (creep.pos.getRangeTo(anchorPoint) > 0) {

            creep.say("TA")

            creep.travel({
                origin: creep.pos,
                goal: { pos: anchorPoint, range: 0 },
                plainCost: 1,
                swampCost: 1,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })

            continue
        }
    }
}