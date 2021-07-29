let roomVariables = require("roomVariables")

let creepManager = require("creepManager")
let powerCreeps = require("powerCreeps")

let constants = require("constants")
let visuals = require("visuals")
let construction = require("construction")

let spawns = require("spawns")
let towers = require("towers")
let links = require("links")
let labs = require("labs")
let terminals = require("terminals")
let factories = require("factories")
let powerSpawns = require("powerSpawns")

function roomManager() {

    let consoleMessage = ""

    let cpuUsed = Game.cpu.getUsed()

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        // All room scripts

        let {
            creeps,
            structures,
            costMatrixes,
        } = roomVariables(room)

        creepManager(room, creeps.myCreeps)

        //taskManger(room, creeps.myCreeps)

        //trafficManager(room, creeps.myCreeps)

        if (Game.time % 100 == 0) {

            construction(room)
        }

        // Commune only scripts

        if (room.controller && room.controller.my) {

            constants(room, structures)

            spawns(room, structures.spawns)

            towers(room, structures.towers)

            if (Game.time % 10 == 0) {

                terminals(room, structures.terminal)
            }

            factories(structures.factory)

            powerSpawns(structures.powerSpawn)

            links(room, structures.links)

            labs(room, structures.labs)

            visuals(room, structures.spawns, structures.towers, structures.links, structures.labs, structures.containers)
        }
    }

    return {
        cpuUsed: cpuUsed,
    }
}

module.exports = roomManager