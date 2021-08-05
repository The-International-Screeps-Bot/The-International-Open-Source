let roomVariables = require("roomVariables")
let roomFunctions = require("roomFunctions")

let creepManager = require("creepManager")
let powerCreeps = require("powerCreeps")
let antifa = require("antifa")

let constants = require("constants")
let construction = require("construction")

let findAnchor = require("findAnchor")
let roomPlanner = require("roomPlanner")

let defenseManager = require("defenseManager")
let taskManager = require("taskManager")

let spawnManager = require("spawnManager")

let towers = require("towers")
let links = require("links")
let labs = require("labs")
let terminals = require("terminals")
let factories = require("factories")
let powerSpawns = require("powerSpawns")

let visuals = require("visuals")

function roomManager() {

    let totalCpuUsed = Game.cpu.getUsed()

    let consoleMessage = ``

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        // CPU tracking values

        let roomCpuUsed = Game.cpu.getUsed()

        let cpuUsed = Game.cpu.getUsed()

        consoleMessage += `
        ` + room.name + `
        --------------------------------------------------------
        `

        // Run room scripts

        //

        cpuUsed = Game.cpu.getUsed()

        let {
            creeps,
            powerCreeps,
            structures,
            constructionSites,
            specialStructures,
            costMatrixes,
        } = roomVariables(room)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `roomVariables: ` + cpuUsed.toFixed(2) + `
        `

        //

        cpuUsed = Game.cpu.getUsed()

        let creepManagerConsoleMessage = creepManager(room, creeps.myCreeps)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `creepManager: ` + cpuUsed.toFixed(2) + `
        `

        consoleMessage += `
        ` + creepManagerConsoleMessage.consoleMessage + `
        `

        //

        cpuUsed = Game.cpu.getUsed()

        taskManager(room, creeps.myCreeps)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `taskManager: ` + cpuUsed.toFixed(2) + `
        `

        //

        cpuUsed = Game.cpu.getUsed()

        antifa(room, creeps)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `antifa: ` + cpuUsed.toFixed(2) + `
        `

        //

        //trafficManager(room, creeps.myCreeps)

        // Commune only scripts

        if (room.controller && room.controller.my) {

            Memory.global.communes.push(room.name)

            //

            cpuUsed = Game.cpu.getUsed()

            if (Game.time % 10 == 0) {

                constants(room, structures)
            }

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `constants: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            construction(room)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `construction: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            defenseManager(room, creeps)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `defenseManager: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            spawnManager(room, structures.spawns, specialStructures)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `spawnManager: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            towers(room, structures.towers, creeps)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `towers: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            if (Game.time % 10 == 0) {

                terminals(room, structures.terminal)
            }

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `terminals: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            factories(structures.factory)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `factories: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            powerSpawns(structures.powerSpawn)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `powerSpawns: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            links(room, specialStructures.links)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `links: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            labs(room, structures, specialStructures)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `labs: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            findAnchor(room)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `findAnchor: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            if (Game.time % 100 == 0) {

                roomPlanner(room)
            }

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `roomPlanner: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            visuals(room, structures, specialStructures, constructionSites)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `visuals: ` + cpuUsed.toFixed(2) + `
            `
        }

        Memory.data.roomManager[room.name] = {}
        Memory.data.roomManager[room.name].cpuUsage = Game.cpu.getUsed() - roomCpuUsed
    }

    return {
        consoleMessage: consoleMessage,
    }
}

module.exports = roomManager