function robberManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        if (creep.avoidHostiles()) continue

        const roomFrom = creep.memory.roomFrom
        const targetRoom = creep.memory.targetRoom

        creep.isFull()

        if (creep.memory.isFull) {

            if (room.name != roomFrom) {

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation", "allyRoom"],
                    flee: false,
                    cacheAmount: 50,
                })

                continue
            }

            let storage = room.get("storage")

            if (storage && storage.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                for (let resourceType in creep.store) creep.advancedTransfer(storage, resourceType)

                continue
            }

            let terminal = room.get("terminal")

            if (terminal && terminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                for (let resourceType in creep.store) creep.advancedTransfer(terminal, resourceType)

                continue
            }

            continue
        }

        if (room.name != targetRoom) {

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, targetRoom), range: 1 },
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: creep.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation", "allyRoom"],
                flee: false,
                cacheAmount: 50,
            })

            continue
        }

        let storage = room.get("storage")

        if (storage && storage.store.getUsedCapacity() > 0) {

            for (let resourceType in storage.store) creep.advancedWithdraw(storage, resourceType)

            continue
        }

        let terminal = room.get("terminal")

        if (terminal && terminal.store.getUsedCapacity() > 0) {

            for (let resourceType in terminal.store) creep.advancedWithdraw(terminal, resourceType)

            continue
        }
    }
}