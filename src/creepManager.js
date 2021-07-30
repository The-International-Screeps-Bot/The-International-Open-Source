require("creepFunctions")

function creepManager(room, myCreeps, creepCpuUsed) {

    let roles = {}

    // Import creep roles

    roles["harvester"] = require('role.harvester')
    roles["hauler"] = require("role.hauler")
    roles["upgrader"] = require('role.upgrader')
    roles["builder"] = require('role.builder')
    roles["repairer"] = require('role.repairer')
    roles["upgradeHauler"] = require("role.upgradeHauler")
    roles["barricadeUpgrader"] = require('role.barricadeUpgrader')
    roles["claimer"] = require('role.claimer')
    roles["revolutionaryBuilder"] = require('role.revolutionaryBuilder')
    roles["rangedDefender"] = require('role.rangedDefender')
    roles["miner"] = require("role.miner")
    roles["scientist"] = require("role.scientist")
    roles["reserver"] = require("role.reserver")
    roles["robber"] = require("role.robber")
    roles["scout"] = require("role.scout")
    roles["stationaryHauler"] = require("role.stationaryHauler")
    roles["communeDefender"] = require("role.communeDefender")
    roles["remoteHarvester1"] = require("role.remoteHarvester")
    roles["remoteHarvester2"] = require("role.remoteHarvester")
    roles["remoteHauler"] = require("role.remoteHauler")
    roles["remoteBuilder"] = require("role.remoteBuilder")

    let cpuUsed

    for (let creep of myCreeps) {

        cpuUsed = Game.cpu.getUsed()

        //creep.suicide()

        if (creep && creep.memory.role) {
            if (creep.ticksToLive <= creep.body.length * 3 + 10) {

                creep.memory.dying = true
            }

            try {

                roles[creep.memory.role].run(creep)

            } catch (err) {

                creep.say("Err")
            }

            cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

            console.log(creep.memory.role + ": " + cpuUsed)
        }
    }

    Memory.data.cpuPerCreep += cpuUsed / myCreeps.length
}

module.exports = creepManager