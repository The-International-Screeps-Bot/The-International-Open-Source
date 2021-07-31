let mapVisuals = require("mapVisuals")

function globalManager() {

    Memory.global.colors = {
        communeBlue: '#2b92f1',
        enemyRed: '#ff3300',
        invaderOrange: "#ffa31a",
        allyGreen: "#00e600",
        neutralYellow: "#F4E637",
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

    //

    if (Game.shard.name == "shard2") {

        var commands = {
            //newCommune: "E28N8",
            //attackTarget: "E28N8",
        }
    } else {

        var commands = {
            //newCommune: "E28N8",
            //attackTarget: "E27N17",
        }
    }

    let communeEstablisher = findCommuneEstablisher()
    Memory.global.communeEstablisher = communeEstablisher

    function findCommuneEstablisher() {
        if (!commands.newCommune) {

            return
        }

        Memory.global.newCommune = commands.newCommune

        for (let maxDistance = 1; maxDistance <= 12; maxDistance++) {

            for (let room of Object.keys(Game.rooms)) {

                room = Game.rooms[room]

                if (room.controller && room.controller.my && room.memory.stage >= 3) {

                    let distance = Game.map.getRoomLinearDistance(commands.newCommune, room.name)

                    if (distance < maxDistance) {

                        console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                        return room
                    }
                }
            }
        }
    }

    let attackingRoom = findAttackingRooms()
    Memory.global.attackingRoom = attackingRoom

    function findAttackingRooms() {

        if (!commands.attackTarget) {

            return
        }

        Memory.global.attackTarget = commands.attackTarget

        for (let stage = 8; stage != 0; stage--) {
            for (let maxDistance = 1; maxDistance <= 10; maxDistance++) {

                for (let room of Object.keys(Game.rooms)) {

                    room = Game.rooms[room]

                    if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.totalEnergy && room.memory.totalEnergy >= 30000) {

                        let distance = Game.map.getRoomLinearDistance(commands.attackTarget, room.name)

                        if (distance < maxDistance) {

                            console.log("AT, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                            return room
                        }
                    }
                }
            }
        }
    }

    //mapVisuals()
}

module.exports = globalManager