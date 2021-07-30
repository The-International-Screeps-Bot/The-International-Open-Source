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

    let creepCpuUsed = 0

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
            costMatrixes,
        } = roomVariables(room)

        creepManager(room, creeps.myCreeps)

        taskManager(room, creeps.myCreeps)

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

        Memory.data.roomManager[room.name] = {}
        Memory.data.roomManager[room.name].cpuUsage = Game.cpu.getUsed() - roomCpuUsed
    }

    return {
        cpuUsed: totalCpuUsed,
    }
}

module.exports = roomManager