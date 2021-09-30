function antifaSupporterManager(room, assaulters, supporters) {

    const attackTarget = Memory.global.attackTarget

    for (let creep of supporters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom

        const assaulter = Game.creeps[creep.memory.assaulter]

        // Stop if creep is in a squad

        if (assaulter) continue

        if (room.name == roomFrom) {

            inRoomFrom()
            continue
        }

        inOtherRoom()
        continue

        function inRoomFrom() {

            // Try to find an assaulter

            if (creep.findAssaulter(assaulters)) return

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, roomFrom), range: 24 },
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })
        }

        function inOtherRoom() {

            creep.travel({
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

module.exports = antifaSupporterManager