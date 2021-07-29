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

    mapVisuals()
}

module.exports = globalManager