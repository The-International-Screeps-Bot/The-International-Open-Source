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

    if (Game.shard.name == "shard2") {

        // If bucket is full generate a pixel

        if (Game.cpu.bucket == 10000) Game.cpu.generatePixel()

        // If there are more than 10 pixels and no pixel sell orders

        if (Game.resources.pixel > 10 && findOrders(ORDER_SELL, PIXEL).length == 0) {

            // Make a pixel sell order

            Game.market.createOrder({ type: ORDER_SELL, resourceType: PIXEL, price: avgPrice(PIXEL) * 0.7, totalAmount: 10 })
        }
    }

    // New commune logic

    newCommuneFinder()

    function newCommuneFinder() {

        // Confirm that there isn't already a valid newCommune and communeEstablisher

        if (Memory.global.newCommune && Memory.global.communeEstablisher && Memory.global.communes.includes(Memory.global.communeEstablisher)) return

        // Make sure we have the GCL to claim a new room

        if (Game.gcl.level == Memory.global.communes.length) return

        // Make sure claimable rooms exist

        if (Memory.global.claimableRooms.length == 0) return

        // Get establishing information

        let establishingInfo = findBestNewCommune()

        // Make sure it is valid

        if (!establishingInfo) return

        // If so fulfill claim request data

        Memory.global.newCommune = establishingInfo.newCommune
        Memory.global.communeEstablisher = establishingInfo.communeEstablisher
    }

    // Attack room logic

    mapVisuals()

    // Record data

    Memory.data.marketAverages.energy = avgPrice(RESOURCE_ENERGY)
}

module.exports = globalManager