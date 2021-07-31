function creepData() {

    let remoteRoles = ["remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver"]

    let rolesList = ["jumpStarter", "harvester", "hauler", "stationaryHauler", "upgrader", "builder", "repairer", "barricadeUpgrader", "rangedDefender", "scientist", "upgradeHauler", "claimer", "revolutionaryBuilder", "miner", "robber", "scout", "communeDefender", "remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver", "remoteBuilder", "antifaSupporter", "antifaAssaulter"]

    let creepsOfRemoteRole = {}
    let creepsOfRole = {}

    for (let name in Game.creeps) {

        let creep = Game.creeps[name]

        if (creep.memory.dying != true) {

            if (!creepsOfRole[[creep.memory.role, creep.memory.roomFrom]]) {

                creepsOfRole[[creep.memory.role, creep.memory.roomFrom]] = 0
            }

            creepsOfRole[[creep.memory.role, creep.memory.roomFrom]] += 1

            if (creep.memory.remoteRoom) {

                if (!creepsOfRemoteRole[[creep.memory.role, creep.memory.remoteRoom]]) {

                    creepsOfRemoteRole[[creep.memory.role, creep.memory.remoteRoom]] = 0
                }

                creepsOfRemoteRole[[creep.memory.role, creep.memory.remoteRoom]] += 1
            }
        }
    }

    return {
        rolesList: rolesList,
        remoteRoles: remoteRoles,
        creepsOfRemoteRole: creepsOfRemoteRole,
        creepsOfRole: creepsOfRole
    }
}

module.exports = creepData