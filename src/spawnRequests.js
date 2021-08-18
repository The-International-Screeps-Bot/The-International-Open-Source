let creepData = require("creepData")

function spawnRequests(room, spawns, specialStructures) {

    let {
        rolesList,
        remoteRoles,
        creepsOfRole,
        creepsOfRemoteRole
    } = creepData()

    for (let role of rolesList) {

        if (!creepsOfRole[[role, room.name]]) {

            creepsOfRole[[role, room.name]] = 0
        }
    }

    for (let role of remoteRoles) {

        if (room.memory.remoteRooms) {
            for (let remoteRoom of room.memory.remoteRooms) {

                if (!creepsOfRemoteRole[[role, remoteRoom.name]]) {

                    creepsOfRemoteRole[[role, remoteRoom.name]] = 0
                }
            }
        }
    }

    room.memory.remoteRooms = room.memory.remoteRooms.slice(0, Math.floor(spawns.length * 2))

    if (room.memory.stage && room.memory.stage < 3) {

        var hostiles = room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                return (allyList.indexOf(c.owner.username) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
            }
        })

    } else {

        var hostiles = room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                return (allyList.indexOf(c.owner.username) === -1 && c.owner.username != "Invader" && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
            }
        })
    }

    if (hostiles.length > 0) {

        Memory.global.lastDefence.time = Game.time
        Memory.global.lastDefence.room = room.name
    }

    let roomMineral = room.find(FIND_MINERALS, {
        filter: s => s.mineralAmount > 0
    })

    let mineralContainer = Game.getObjectById(room.memory.mineralContainer)

    let roomExtractor = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_EXTRACTOR
    })

    let roomConstructionSite = room.find(FIND_MY_CONSTRUCTION_SITES)

    let repairStructure = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.5
    })

    let barricadesToUpgrade = room.find(FIND_MY_STRUCTURES, {
        filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < s.hitsMax * 0.9
    })

    let spawnCapacity = room.energyCapacityAvailable

    let stage = room.memory.stage

    if (spawnCapacity >= 10300) {

        room.memory.stage = 8

    } else if (spawnCapacity >= 5300) {

        room.memory.stage = 7

    } else if (spawnCapacity >= 2300) {

        room.memory.stage = 6

    } else if (spawnCapacity >= 1800) {

        room.memory.stage = 5

    } else if (spawnCapacity >= 1300) {

        room.memory.stage = 4

    } else if (spawnCapacity >= 800) {

        room.memory.stage = 3

    } else if (spawnCapacity >= 550) {

        room.memory.stage = 2

    } else if (spawnCapacity >= 300) {

        room.memory.stage = 1

    }

    /*Minimum creeps definitions*/

    let minCreeps = {}

    for (let role of rolesList) {

        minCreeps[role] = 0
    }

    if (spawnCapacity >= 550) {

        minCreeps["harvester"] = 2

    } else if (spawnCapacity >= 350) {

        minCreeps["harvester"] = 4

    } else {

        minCreeps["harvester"] = 6
    }

    switch (stage) {
        case 1:

            minCreeps["hauler"] = 4
            break
        case 2:

            minCreeps["hauler"] = 4
            break
        case 3:

            minCreeps["hauler"] = 4
            break
        case 4:

            minCreeps["hauler"] = 3
            break
        case 5:

            minCreeps["hauler"] = 3
            break
        case 6:

            minCreeps["hauler"] = 3
            break
        case 7:

            minCreeps["hauler"] = 2

            /* minCreeps["scientist"] = 1 */
            break
        case 8:

            minCreeps["hauler"] = 2

            /* minCreeps["scientist"] = 1 */
            break
    }

    (function() {

        if (room.storage && room.storage.store[RESOURCE_ENERGY] <= 20000) {

            return
        }

        if (Memory.global.attackingRoom == room.name) {

            minCreeps["antifaAssaulter"] = 4
            minCreeps["antifaSupporter"] = minCreeps["antifaAssaulter"]
        }
    })()

    if (roomConstructionSite.length > 0) {
        if (!room.storage) {

            if (stage <= 1) {

                minCreeps["builder"] = 6
            } else if (stage <= 2) {

                minCreeps["builder"] = 3
            } else {

                minCreeps["builder"] = 2
            }
        } else if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 40000) {

            if (stage <= 5) {

                minCreeps["builder"] = 2
            } else {

                minCreeps["builder"] = 1
            }
        }
    }

    if (room.controller.ticksToDowngrade <= 15000) {

        minCreeps["upgrader"] = 1
    }

    if (!room.storage) {

        if (stage == 1) {

            minCreeps["upgrader"] = 6

        } else if (stage == 2) {

            minCreeps["upgrader"] = 4

        } else if (stage == 3) {

            minCreeps["upgrader"] = 3

        } else {

            minCreeps["upgrader"] = 3
        }
    } else if (room.storage &&
        room.storage.store[RESOURCE_ENERGY] >= 50000) {

        if (stage <= 5) {

            minCreeps["upgrader"] = 2

        } else {

            minCreeps["upgrader"] = 1
        }
    }

    if (barricadesToUpgrade.length > 0) {
        if (!room.storage) {

            minCreeps["barricadeUpgrader"] = 1

        } else {
            if (room.storage.store[RESOURCE_ENERGY] >= 200000) {

                minCreeps["barricadeUpgrader"] = 3
            } else if (room.storage.store[RESOURCE_ENERGY] >= 30000) {

                minCreeps["barricadeUpgrader"] = 1
            }
        }
    }

    if (specialStructures.links.baseLink) {

        minCreeps["stationaryHauler"] = 1
    }

    if (hostiles.length > 0) {

        minCreeps["rangedDefender"] = 2
    }

    if (Game.flags.R && stage >= 4) {
        minCreeps["robber"] = 2
    }

    if (repairStructure.length > 0) {

        minCreeps["repairer"] = 1
    }

    if (Memory.global.communeEstablisher == room.name) {

        minCreeps["claimer"] = 1
    }

    if (Memory.global.communeEstablisher == room.name) {

        minCreeps["revolutionaryBuilder"] = 4
    }

    if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 35000 && mineralContainer != null && roomExtractor.length > 0 && roomMineral.length > 0) {

        minCreeps["miner"] = 1
    }

    minCreeps["scout"] = 1


    if (stage >= 4) {

        minCreeps["remoteBuilder"] = 1 + Math.floor(room.memory.remoteRooms.length / 3)
    }

    if (stage >= 3) {

        minCreeps["communeDefender"] = 1
    }
    (function() {

        if (room.storage && room.storage.store[RESOURCE_ENERGY] <= 15000) {

            return
        }

        for (let remoteRoom of room.memory.remoteRooms) {

            if (stage <= 2) {

                minCreeps["remoteHarvester1"] += 2

                if (remoteRoom.sources == 2) {

                    minCreeps["remoteHarvester2"] += 2
                }

                minCreeps["remoteHauler"] += remoteRoom.sources * 2
            }
            if (stage >= 3) {

                minCreeps["reserver"] += 1

                minCreeps["remoteHarvester1"] += 1

                if (remoteRoom.sources == 2) {

                    minCreeps["remoteHarvester2"] += 1
                }

                minCreeps["remoteHauler"] += Math.floor(remoteRoom.sources * 1.5)
            }
        }
    })()

    if (room.memory.roomFix) {
        if (room.storage) {
            if (room.storage.store[RESOURCE_ENERGY] < 1000) {

                minCreeps["jumpStarter"] = 2
            }
        } else {

            minCreeps["jumpStarter"] = 2
        }
    }

    if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 175000 && room.controller.level <= 7) {

        minCreeps["upgrader"] += 1
    }
    if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 80000 && room.controller.level <= 7) {

        minCreeps["upgradeHauler"] = 1
        minCreeps["upgrader"] += 2
    }

    let requiredCreeps = {}

    for (let role of rolesList) {

        requiredCreeps[role] = minCreeps[role] - creepsOfRole[[role, room.name]]

        if (requiredCreeps[role] > 0) {

            /* console.log(role + ", " + requiredCreeps[role] + ", " + room.name) */
        }
    }

    const roomFix = room.memory.roomFix

    if (!roomFix) {

        room.memory.roomFix = false
    }

    if (creepsOfRole[["harvester", room.name]] == 0 || creepsOfRole[["hauler", room.name]] == 0) {

        room.memory.roomFix = true

    } else if (creepsOfRole[["harvester", room.name]] > 1 && creepsOfRole[["hauler", room.name]] > 1) {

        room.memory.roomFix = false
    }

    // Remote room creep requirements

    let requiredRemoteCreeps = []

    let minRemoteCreeps = {}

    for (let remoteRoom of room.memory.remoteRooms) {

        if (stage <= 2) {

            minRemoteCreeps[["remoteHarvester1", remoteRoom.name]] = 2

            if (remoteRoom.sources == 2) {

                minRemoteCreeps[["remoteHarvester2", remoteRoom.name]] = 2
            }

            minRemoteCreeps[["remoteHauler", remoteRoom.name]] = remoteRoom.sources * 2
        }
        if (stage >= 3) {

            minRemoteCreeps[["reserver", remoteRoom.name]] = 1

            minRemoteCreeps[["remoteHarvester1", remoteRoom.name]] = 1

            if (remoteRoom.sources == 2) {

                minRemoteCreeps[["remoteHarvester2", remoteRoom.name]] = 1
            }

            minRemoteCreeps[["remoteHauler", remoteRoom.name]] = Math.floor(remoteRoom.sources * 1.5)
        }
    }

    for (let role of remoteRoles) {

        for (let remoteRoom of room.memory.remoteRooms) {

            if (minRemoteCreeps[[role, remoteRoom.name]] > creepsOfRemoteRole[[role, remoteRoom.name]]) {

                requiredRemoteCreeps[[role, remoteRoom.name]] = minRemoteCreeps[[role, remoteRoom.name]] - creepsOfRemoteRole[[role, remoteRoom.name]]

                //console.log(role + ", " + requiredRemoteCreeps[[role, remoteRoom.name]] + ", " + remoteRoom.name)
            }
        }
    }

    return {
        requiredCreeps: requiredCreeps,
        requiredRemoteCreeps: requiredRemoteCreeps,
    }
}

module.exports = spawnRequests