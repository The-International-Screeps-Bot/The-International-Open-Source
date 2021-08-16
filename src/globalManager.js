let mapVisuals = require("mapVisuals")
require("roomFunctions")
require("globalFunctions")

function globalManager() {

    // Global data configuration

    Memory.global.colors = {
        communeBlue: '#2b92f1',
        allyGreen: "#00e600",
        neutralYellow: "#F4E637",
        invaderOrange: "#ffa31a",
        enemyRed: '#ff3300',
    }

    if (Game.time % 10 == 0) {
        for (let name in Memory.creeps) {

            if (Game.creeps[name] == undefined) {

                delete Memory.creeps[name];
            }
        }
    }

    if (Memory.global.establishedRooms.length >= 10) {

        Memory.global.globalStage = 3

    } else if (Memory.global.establishedRooms.length >= 3) {

        Memory.global.globalStage = 2

    } else if (Memory.global.establishedRooms.length >= 1) {

        Memory.global.globalStage = 1

    } else {

        Memory.global.globalStage = 0
    }

    // Commands

    if (Game.shard.name == "shard2") {

        if (Game.cpu.bucket == 10000) {
            Game.cpu.generatePixel();
        }

        if (Game.resources.pixel > 10) {

            Game.market.createOrder({ type: ORDER_SELL, resourceType: PIXEL, price: avgPrice(PIXEL) * 0.9, totalAmount: 10 })
        }
    }

    if (Game.shard.name == "shard2") {

        var commands = {
            /* attackTarget: "E28N8", */
        }
    } else {

        var commands = {
            /* attackTarget: "W6N3", */
        }
    }

    // New commune logic

    if (Game.gcl.level == Memory.global.communes.length) Memory.global.newCommunes = []

    if (!Memory.global.newCommunes) Memory.global.newCommunes = []

    if (Memory.global.newCommunes.length > 0) {

        const newCommune = Memory.global.newCommunes[0]

        if (Memory.rooms[newCommune].stage >= 2) {

            Memory.global.newCommunes = Memory.global.newCommunes.slice(1, Memory.global.newCommunes.length)
        }

        Memory.global.newCommune = newCommune
        Memory.global.communeEstablisher = findCommuneEstablisher(newCommune)

        function findCommuneEstablisher(newCommune) {

            for (let stage = 8; stage != 0; stage--) {
                for (let maxDistance = 1; maxDistance < 11; maxDistance++) {

                    for (let roomName in Game.rooms) {

                        room = Game.rooms[roomName]

                        if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.stage >= 3 && room.memory.anchorPoint) {

                            let distance = room.findSafeDistance(room.memory.anchorPoint, { pos: new RoomPosition(25, 25, newCommune), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"])

                            if (distance < maxDistance) {

                                console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                                return room.name
                            }
                        }
                    }
                }
            }
        }
    } else {

        Memory.global.newCommune = undefined
        Memory.global.communeEstablisher = undefined
    }

    // Attack room logic

    let attackingRoom = findAttackingRooms()
    Memory.global.attackingRoom = attackingRoom

    function findAttackingRooms() {

        if (!commands.attackTarget) return

        Memory.global.attackTarget = commands.attackTarget

        for (let stage = 8; stage != 0; stage--) {
            for (let maxDistance = 1; maxDistance <= 10; maxDistance++) {

                for (let room of Object.keys(Game.rooms)) {

                    room = Game.rooms[room]

                    if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.totalEnergy && room.memory.totalEnergy >= 30000) {

                        let distance = Game.map.getRoomLinearDistance(commands.attackTarget, room.name)

                        if (distance < maxDistance) {

                            console.log("AT, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                            return room.name
                        }
                    }
                }
            }
        }
    }

    mapVisuals()
}

module.exports = globalManager