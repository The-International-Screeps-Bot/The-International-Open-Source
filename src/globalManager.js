let mapVisuals = require("mapVisuals")
require("roomFunctions")
require("globalFunctions")
require("globalVariables")

function globalManager() {

    // Remove dead creeps from memory

    if (Game.time % 10 == 0) {
        for (let creepName in Memory.creeps) {

            let creep = Game.creeps[creepName]

            if (!creep) delete Memory.creeps[creepName]
        }
    }

    // Configure global

    if (Memory.global.establishedRooms.length >= 10) {

        Memory.global.globalStage = 3

    } else if (Memory.global.establishedRooms.length >= 3) {

        Memory.global.globalStage = 2

    } else if (Memory.global.establishedRooms.length >= 1) {

        Memory.global.globalStage = 1

    } else {

        Memory.global.globalStage = 0
    }

    //

    for (let roomName in Game.rooms) {

        room = Game.rooms[roomName]

        if (!room.controller || !room.controller.my) continue

        Memory.global.totalEnergy += room.get("storedEnergy")
    }

    if (Game.shard.name == "shard2") {

        if (Game.cpu.bucket == 10000) {
            Game.cpu.generatePixel();
        }

        if (Game.resources.pixel > 10 && Object.values(Game.market.orders).length < 100) {

            Game.market.createOrder({ type: ORDER_SELL, resourceType: PIXEL, price: avgPrice(PIXEL) * 0.7, totalAmount: 10 })
        }
    }

    const anchorPoint = room.get("anchorPoint")

    // New commune logic

    if (Game.gcl.level > Memory.global.communes.length && Memory.global.claimableRooms.length > 0) {

        function findCommuneEstablisher(potentialNewCommune) {

            for (let stage = 8; stage != 0; stage--) {
                for (let maxDistance = 1; maxDistance < 11; maxDistance++) {

                    for (let roomName in Game.rooms) {

                        room = Game.rooms[roomName]

                        if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.stage >= 4 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 30000 && anchorPoint) {

                            let distance = room.findSafeDistance(anchorPoint, { pos: new RoomPosition(25, 25, potentialNewCommune), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"])

                            if (distance < maxDistance) {

                                console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                                return room.name
                            }
                        }
                    }
                }
            }

            return false
        }

        for (let potentialNewCommune of Memory.global.claimableRooms) {

            if (!findCommuneEstablisher(potentialNewCommune)) continue

            Memory.global.newCommune = potentialNewCommune
            Memory.global.communeEstablisher = findCommuneEstablisher(potentialNewCommune)
            break
        }
    }

    // Attack room logic



    mapVisuals()
}

module.exports = globalManager