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

        let cpuUsage = {}

        cpuUsage["harvester1"]
        cpuUsage["harvester2"]
        cpuUsage["generalHauler"]
        cpuUsage["baseHauler"]
        cpuUsage["containerHauler"]
        cpuUsage["upgrader"]
        cpuUsage["builder"]
        cpuUsage["repairer"]
        cpuUsage["wallRepairer"]
        cpuUsage["claimer"]
        cpuUsage["spawnBuilder"]
        cpuUsage["rangedDefender"]
        cpuUsage["miner"]
        cpuUsage["scientist"]
        cpuUsage["reserver"]
        cpuUsage["robber"]
        cpuUsage["scout"]
        cpuUsage["serf"]
        cpuUsage["remoteDefender"]
        cpuUsage["remoteHarvester1"]
        cpuUsage["remoteHarvester2"]
        cpuUsage["remoteHauler"]
        cpuUsage["remoteBuilder"]
        cpuUsage["bigBoy"]

        for (let name in Game.creeps) {

            let creep = Game.creeps[name]
            //creep.suicide()
            
            //console.log(creep.body.length * 3)
            
            if (creep.ticksToLive <= creep.body.length * 3) {
                
                creep.memory.dying = true
            }

            roles[creep.memory.role].run(creep)

            console.log(creep.memory.role + ": " + Game.cpu.getUsed().toFixed(2))
        }
    }
};