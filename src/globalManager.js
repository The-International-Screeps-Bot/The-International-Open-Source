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

    // New commune logic

    newCommuneFinder()

    function newCommuneFinder() {

        if ((!Memory.global.newCommune || !Memory.global.communeEstablisher) && Game.gcl.level > Memory.global.communes.length && Memory.global.claimableRooms.length > 0) {

            let establishingInfo = findBestNewCommune()

            if (!establishingInfo) return

            Memory.global.newCommune = establishingInfo.newCommune
            Memory.global.communeEstablisher = establishingInfo.communeEstablisher
        }

    }

    // Attack room logic

    mapVisuals()

    // Record data

    Memory.data.marketAverages.energy = avgPrice(RESOURCE_ENERGY)
}

module.exports = globalManager