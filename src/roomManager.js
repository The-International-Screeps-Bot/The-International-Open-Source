let roomVariables = require("roomVariables")

let creepManager = require("creepManager")
let powerCreeps = require("powerCreeps")
let antifa = require("antifa")

let constants = require("constants")
let visuals = require("visuals")
let construction = require("construction")
let defenseManager = require("defenseManager")
let taskManager = require("taskManager")

let spawnManager = require("spawnManager")

let towers = require("towers")
let links = require("links")
let labs = require("labs")
let terminals = require("terminals")
let factories = require("factories")
let powerSpawns = require("powerSpawns")

function roomManager() {

    let totalCpuUsed = Game.cpu.getUsed()

    let consoleMessage = ""

    for (let roomName in Game.rooms) {

        let roomCpuUsed = Game.cpu.getUsed()

        let cpuUsed = Game.cpu.getUsed()

        let room = Game.rooms[roomName]

        // All room scripts

        let {
            creeps,
            structures,
            specialStructures,
            costMatrixes,
        } = roomVariables(room)

        creepManager(room, creeps.myCreeps)

        taskManager(room, creeps.myCreeps)

        antifa(room, creeps)

        //trafficManager(room, creeps.myCreeps)

        // Commune only scripts

        if (room.controller && room.controller.my) {

            if (Game.time % 10 == 0) {

                constants(room, structures)
            }

            if (Game.time % 100 == 0) {

                construction(room)
            }

            defenseManager(room, creeps)

            spawnManager(room, structures.spawns)

            towers(room, structures.towers, creeps)

            if (Game.time % 10 == 0) {

                terminals(room, structures.terminal)
            }

            factories(structures.factory)

            powerSpawns(structures.powerSpawn)

            links(room, structures.labs, specialStructures.labs.primaryLabs, specialStructures.labs.secondaryLabs, specialStructures.labs.tertiaryLabs)

            labs(room, structures.labs)

            visuals(room, structures.spawns, structures.towers, structures.links, structures.labs, structures.containers)
        }

        Memory.data.roomManager[room.name] = {}
        Memory.data.roomManager[room.name].cpuUsage = Game.cpu.getUsed() - roomCpuUsed
    }

    return {
        consoleMessage: consoleMessage,
    }
}

module.exports = roomManager