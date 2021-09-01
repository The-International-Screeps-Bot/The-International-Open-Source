require("communeDefenderFunctions")

function communeDefenderManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        for (let remoteRoomName in Memory.rooms[roomFrom].remoteRooms) {

            let remoteRoomMemory = Memory.rooms[roomFrom].remoteRooms[remoteRoomName]

            if (!remoteRoomMemory.enemy) continue

            remoteRoom = remoteRoomName
            break
        }

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {
            if (room.name == remoteRoom) {

                let enemyCreepsObject = creep.findHostile()

                creep.heal(enemyCreepsObject.enemyAttacker)

                if (creep.attackHostiles(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyCreep, enemyCreepsObject.enemyAttacker)) continue

                /* if (creep.findAndAttackInvaderCores()) continue */

                continue
            }

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

            let enemyCreepsObject = creep.findHostile()

            creep.heal(enemyCreepsObject.enemyAttacker)

            if (creep.defendRamparts(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyAttacker)) continue

            if (creep.attackHostiles(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyCreep, enemyCreepsObject.enemyAttacker)) continue

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

module.exports = communeDefenderManager