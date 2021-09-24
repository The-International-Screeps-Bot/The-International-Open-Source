module.exports = function robberManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        if (creep.avoidHostiles()) continue

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

            let storage = room.get("storage")

            if (storage && storage.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                creep.say("S")

                for (let resourceType in creep.store) {

                    creep.advancedTransfer(storage, resourceType)
                    continue
                }
            }

            let terminal = room.get("terminal")

            if (terminal && terminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                creep.say("T")

                for (let resourceType in creep.store) {

                    creep.advancedTransfer(terminal, resourceType)
                    continue
                }
            }

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

        let storage = room.get("storage")

        if (storage && storage.store.getUsedCapacity() > 0) {

            creep.say("S")

            for (let resourceType in storage.store) {

                creep.advancedWithdraw(storage, resourceType)
                continue
            }
        }

        let terminal = room.get("terminal")

        if (terminal && terminal.store.getUsedCapacity() > 0) {

            creep.say("T")

            for (let resourceType in terminal.store) {

                creep.advancedWithdraw(terminal, resourceType)
                continue
            }
        }
    }
}