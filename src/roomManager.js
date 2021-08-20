let roomVariables = require("roomVariables")

require("roomFunctions")
require("creepFunctions")

let creepManager = require("creepManager")
let powerCreepManager = require("powerCreepManager")
    /* let antifa = require("antifa") */

let constants = require("constants")
let construction = require("construction")

let findAnchor = require("findAnchor")
let roomPlanner = require("roomPlanner")

let defenseManager = require("defenseManager")
let taskManager = require("taskManager")

let spawnManager = require("spawnManager")

let nukerManager = require("nukerManager")
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
            structures,
            constructionSites,
            specialStructures,
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
        ` + creepManagerConsoleMessage + `
        `
            //

        cpuUsed = Game.cpu.getUsed()

        /* let creepManagerConsoleMessage =  */
        powerCreepManager(room)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `powerCreepManager: ` + cpuUsed.toFixed(2) + `
                `

        /* consoleMessage += `
                 ` + creepManagerConsoleMessage.consoleMessage + `
                 ` */

        //

        cpuUsed = Game.cpu.getUsed()

        taskManager(room, creeps.myCreeps)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `taskManager: ` + cpuUsed.toFixed(2) + `
        `

        //

        /*         cpuUsed = Game.cpu.getUsed()

                antifa(room, creeps)

                totalCpuUsed += Game.cpu.getUsed()
                cpuUsed = Game.cpu.getUsed() - cpuUsed
                consoleMessage += `antifa: ` + cpuUsed.toFixed(2) + `
                ` */

        //

        /* trafficManager(room, creeps.myCreeps) */

        //

        cpuUsed = Game.cpu.getUsed()

        visuals(room, structures, specialStructures, constructionSites)

        totalCpuUsed += Game.cpu.getUsed()
        cpuUsed = Game.cpu.getUsed() - cpuUsed
        consoleMessage += `visuals: ` + cpuUsed.toFixed(2) + `
                    `

        // Commune only scripts

        if (room.controller && room.controller.my) {

            Memory.global.communes.push(room.name)

            //

            if (!room.memory.deposits) room.memory.deposits = {}

            for (let depositId in room.memory.deposits) {

                let deposit = room.memory.deposits[depositId]

                if (Game.time > deposit.decayBy) delete deposit
            }

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

            construction(room, specialStructures)

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

            towers(room)

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `towers: ` + cpuUsed.toFixed(2) + `
            `

            //

            cpuUsed = Game.cpu.getUsed()

            if (Game.time % 10 == 0) {

                terminals(room)
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

                roomPlanner(room, structures, constructionSites)
            }

            totalCpuUsed += Game.cpu.getUsed()
            cpuUsed = Game.cpu.getUsed() - cpuUsed
            consoleMessage += `roomPlanner: ` + cpuUsed.toFixed(2) + `
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