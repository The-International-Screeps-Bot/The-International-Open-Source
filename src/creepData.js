function creepData() {

    let remoteRoles = ["remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver"]

    let rolesList = ["jumpStarter", "harvester", "hauler", "stationaryHauler", "upgrader", "builder", "repairer", "barricadeUpgrader", "rangedDefender", "scientist", "upgradeHauler", "claimer", "revolutionaryBuilder", "miner", "robber", "scout", "communeDefender", "remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver", "remoteBuilder", "antifaSupporter", "antifaAssaulter"]

    let creepsOfRemoteRole = {}
    let creepsOfRole = {}
    let creepCollectionsOfRole = {}

    for (let name in Game.creeps) {

        let creep = Game.creeps[name]

        if (!creepCollectionsOfRole[creep.memory.role]) {

            creepCollectionsOfRole[[creep.memory.role, creep.memory.roomFrom]] = []
        }

        creepCollectionsOfRole[[creep.memory.role, creep.memory.roomFrom]].push({ name: creep.name, role: creep.memory.role, roomFrom: creep.memory.roomFrom })

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
        creepsOfRole: creepsOfRole,
        creepCollectionsOfRole: creepCollectionsOfRole,
    }
}

module.exports = creepData