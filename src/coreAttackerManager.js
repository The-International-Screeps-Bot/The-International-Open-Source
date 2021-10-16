require("coreAttackerFunctions")

function coreAttackerManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        for (let remoteRoomName in Memory.rooms[roomFrom].remoteRooms) {

            let remoteRoomMemory = Memory.rooms[roomFrom].remoteRooms[remoteRoomName]

            if (!remoteRoomMemory.invaderCore) continue

            remoteRoom = remoteRoomName
            break
        }

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {
            if (room.name == remoteRoom) {

                let invaderCores = room.find(FIND_HOSTILE_STRUCTURES, {
                    filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
                })

                if (invaderCores.length == 0) {

                    Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.memory.remoteRoom].invaderCore = false
                }

                if (creep.findAndAttackInvaderCores()) continue

                continue
            }

            creep.travel({
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

            let enemyCreepsObject = creep.findEnemies()

            if (creep.defendRamparts(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyAttacker)) continue

            if (creep.advancedAttackEnemys(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyCreep, enemyCreepsObject.enemyAttacker)) continue

            if (creep.wait()) continue

            continue
        }

        creep.say(roomFrom)

        creep.travel({
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

module.exports = coreAttackerManager