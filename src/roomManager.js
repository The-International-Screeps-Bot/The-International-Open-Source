let roomVariables = require("roomVariables")

let creepManager = require("creepManager")
let powerCreeps = require("powerCreeps")

let constants = require("constants")
let visuals = require("visuals")
let construction = require("construction")
let defenseManager = require("defenseManager")
let taskManager = require("taskManager")

let spawns = require("spawns")
let towers = require("towers")
let links = require("links")
let labs = require("labs")
let terminals = require("terminals")
let factories = require("factories")
let powerSpawns = require("powerSpawns")

function roomManager() {

    let consoleMessage = ""

    let totalCpuUsed = Game.cpu.getUsed()

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

        taskManager(room, creeps.myCreeps)

        //trafficManager(room, creeps.myCreeps)

        // Commune only scripts

        if (room.controller && room.controller.my) {

            constants(room, structures)

            if (Game.time % 100 == 0) {

                construction(room)
            }

            defenseManager(room, creeps)

            spawns(room, structures.spawns)

            towers(room, structures.towers, creeps)

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

    Memory.data.roomManager[room.name].cpuUsage = Game.cpu.getUsed() - totalCpuUsed

    return {
        cpuUsed: cpuUsed,
    }
}

module.exports = roomManager