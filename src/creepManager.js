function creepManager(room, myCreeps) {

    if (myCreeps.length == 0) return

    let managers = {}

    // Import managers

    managers["jumpStarter"] = { import: require("jumpStarterManager"), creeps: [] }
    managers["harvester"] = { import: require("harvesterManager"), creeps: [] }
    managers["builder"] = { import: require("builderManager"), creeps: [] }
    managers["scout"] = { import: require("scoutManager"), creeps: [] }

    managers["claimer"] = { import: require("claimerManager"), creeps: [] }

    managers["communeDefender"] = { import: require("communeDefenderManager"), creeps: [] }
    managers["coreAttacker"] = { import: require("coreAttackerManager"), creeps: [] }

    managers["remoteHarvester1"] = { import: require("remoteHarvesterManager"), creeps: [] }
    managers["remoteHarvester2"] = { import: require("remoteHarvesterManager"), creeps: [] }

    managers["rampartUpgrader"] = { import: require("rampartUpgraderManager"), creeps: [] }
    managers["meleeDefender"] = { import: require("meleeDefenderManager"), creeps: [] }

    managers["antifaManager"] = { import: require("antifaManager"), assaulters: [], supporters: [] }

    // Get creeps for each manager

    for (let creep of myCreeps) {

        if (managers[creep.memory.role]) managers[creep.memory.role].creeps.push(creep)

        if (creep.memory.role == "antifaAssaulter") managers.antifaManager.assaulters.push(creep)
        if (creep.memory.role == "antifaSupporter") managers.antifaManager.supporters.push(creep)
    }

    // Run each manager

    for (let object in managers) {

        let manager = managers[object]

        if (manager.creeps && manager.creeps.length > 0) manager.import(room, manager.creeps)
    }

    let antifaManager = managers.antifaManager
    antifaManager.import(room, antifaManager.assaulters, antifaManager.supporters)

    let roles = {}

    // Import creep roles

    roles["hauler"] = require("role.hauler")
    roles["upgrader"] = require('role.upgrader')
    roles["repairer"] = require('role.repairer')
        /* roles["claimer"] = require('role.claimer') */
    roles["revolutionaryBuilder"] = require('role.revolutionaryBuilder')
    roles["rangedDefender"] = require('role.rangedDefender')
    roles["miner"] = require("role.miner")
    roles["scientist"] = require("role.scientist")
    roles["reserver"] = require("role.reserver")
    roles["robber"] = require("role.robber")
    roles["stationaryHauler"] = require("role.stationaryHauler")
    roles["remoteHauler"] = require("role.remoteHauler")
    roles["remoteBuilder"] = require("role.remoteBuilder")

    let totalCpuUsed = 0
    let cpuUsed

    let consoleMessage = ``

    consoleMessage += `
    Creeps`

    for (let creep of myCreeps) {

        cpuUsed = Game.cpu.getUsed()

        if (creep && creep.memory.role) {
            if (creep.ticksToLive <= creep.body.length * 3) {

                creep.memory.dying = true
            }

            if (roles[creep.memory.role]) roles[creep.memory.role].run(creep)

            cpuUsed = Game.cpu.getUsed() - cpuUsed
            totalCpuUsed += cpuUsed

            consoleMessage += `
    ` + creep.memory.role + ": " + (cpuUsed).toFixed(2) + ``
        }
    }

    Memory.data.cpuPerCreep = (totalCpuUsed / myCreeps.length).toFixed(2)
    consoleMessage += `
    `

    return consoleMessage
}

module.exports = creepManager