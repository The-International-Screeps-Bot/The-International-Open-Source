function communeDefenderManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("communeDefenderFunctions")

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

                let enemyCreeps = room.find(FIND_HOSTILE_CREEPS, {
                    filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM, HEAL])
                })

                if (enemyCreeps.length == 0) {

                    Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.memory.remoteRoom].enemy = false
                }

                let enemyCreepsObject = creep.findHostiles()

                creep.healMyCreeps(enemyCreepsObject.enemyAttacker)

                if (creep.advancedAttackHostiles(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyCreep, enemyCreepsObject.enemyAttacker)) continue

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

            let enemyCreepsObject = creep.findHostiles()

            creep.healMyCreeps(enemyCreepsObject.enemyAttacker)

            if (creep.defendRamparts(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyAttacker)) continue

            if (creep.advancedAttackHostiles(enemyCreepsObject.enemyCreeps, enemyCreepsObject.enemyCreep, enemyCreepsObject.enemyAttacker)) continue

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