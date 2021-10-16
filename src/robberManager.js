module.exports = function robberManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("robberFunctions")

    for (let creep of creepsWithRole) {

        if (creep.avoidEnemys()) continue

        const roomFrom = creep.memory.roomFrom
        const robTarget = creep.memory.robTarget

        creep.isFull()

        if (creep.memory.isFull) {

            if (room.name != roomFrom) {

                creep.say(roomFrom)

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation", "allyRoom"],
                    flee: false,
                    cacheAmount: 20,
                })

                continue
            }

            if (creep.transferToStorageOrTerminal()) continue

            continue
        }

        if (room.name != robTarget) {

            creep.say(robTarget)

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, robTarget), range: 1 },
                plainCost: 0,
                swampCost: 0,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation", "allyRoom"],
                flee: false,
                cacheAmount: 20,
            })

            continue
        }

        if (creep.withdrawRoomResources()) continue
    }
}