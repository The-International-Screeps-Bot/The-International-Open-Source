module.exports = function scientistManager(room, creepsWithRole) {

    // Stop if there are no creeps

    if (creepsWithRole.length == 0) return

    //

    let mineral = creep.room.find(FIND_MINERALS)[0]

    // Stop if no mineral

    if (!mineral) return

    let mineralContainer = room.get("mineralContainer")

    // Stop if no mineralContainer

    if (!mineralContainer) return

    for (let creep of creepsWithRole) {

        // Avoid enemy creeps

        if (creep.avoidEnemys()) continue

        creep.say("⛏️")

        if (creep.pos.getRangeTo(mineralContainer) != 0) {

            creep.travel({
                origin: creep.pos,
                goal: { pos: mineralContainer.pos, range: 0 },
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })

            return
        }

        if (creep.harvest(mineral) == 0) {

            creep.findMineralsHarvested(mineral)
            return
        }
    }
}