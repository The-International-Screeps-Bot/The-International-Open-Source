function remoteBuilderManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("remoteBuilderFunctions")

    for (let creep of creepsWithRole) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        for (let remoteRoomName in Memory.rooms[roomFrom].remoteRooms) {

            let remoteRoomMemory = Memory.rooms[roomFrom].remoteRooms[remoteRoomName]

            if (!remoteRoomMemory.builderNeed) continue

            remoteRoom = remoteRoomName
            break
        }

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {
            if (room.name == remoteRoom) {

                let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

                let lowEcoStructures = room.find(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax - creep.findParts(WORK) * 100
                })

                if (mySites.length == 0 && lowEcoStructures.length == 0) {

                    remoteRoomMemory.builderNeed = true
                }



                continue
            }

            creep.say(remoteRoom)

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                flee: false,
                cacheAmount: 10,
            })

            continue
        }
        if (room.name == roomFrom) {

            if (creep.wait()) continue

            continue
        }

        creep.say(roomFrom)

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
            flee: false,
            cacheAmount: 10,
        })
    }
}

module.exports = remoteBuilderManager