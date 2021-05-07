let creepFunctions = require("module.creepFunctions")
let allyList = require("module.allyList")

module.exports = {
    run: function roles() {

        let roles = {}

        // import modules
        roles["harvester1"] = require('role.harvester')
        roles["harvester2"] = require('role.harvester')
        roles["generalHauler"] = require('role.generalHauler')
        roles["baseHauler"] = require('role.baseHauler')
        roles["containerHauler"] = require('role.containerHauler')
        roles["upgrader"] = require('role.upgrader')
        roles["builder"] = require('role.builder')
        roles["repairer"] = require('role.repairer')
        roles["upgradeHauler"] = require("role.upgradeHauler")
        roles["wallRepairer"] = require('role.wallRepairer')
        roles["claimer"] = require('role.claimer')
        roles["spawnBuilder"] = require('role.spawnBuilder')
        roles["rangedDefender"] = require('role.rangedDefender')
        roles["miner"] = require("role.miner")
        roles["scientist"] = require("role.scientist")
        roles["reserver"] = require("role.reserver")
        roles["robber"] = require("role.robber")
        roles["scout"] = require("role.scout")
        roles["serf"] = require("role.serf")
        roles["remoteDefender"] = require("role.remoteDefender")
        roles["remoteHarvester1"] = require("role.remoteHarvester")
        roles["remoteHarvester2"] = require("role.remoteHarvester")
        roles["remoteHauler"] = require("role.remoteHauler")
        roles["remoteBuilder"] = require("role.remoteBuilder")
        roles["bigBoyLeader"] = require("role.bigBoy")
        roles["bigBoyMember"] = require("role.bigBoy")

        for (let name in Game.creeps) {

            let creep = Game.creeps[name]
                //creep.suicide()

            if (creep && creep.memory.role) {
                if (creep.ticksToLive <= creep.body.length * 3) {

                    creep.memory.dying = true
                }

                roles[creep.memory.role].run(creep)

                console.log(creep.memory.role + ": " + Game.cpu.getUsed().toFixed(2))
            }
        }
    }
};