let taskManager = require("module.taskManager")
let trafficManager = require("module.trafficManager")
let allyList = require("module.allyList");

module.exports = {
    run: function spawns() {

        let rolesList = ["harvester1", "generalHauler", "baseHauler", "containerHauler", "harvester2", "upgrader", "builder", "repairer", "upgradeHauler", "barricadeUpgrader", "claimer", "revolutionaryBuilder", "rangedDefender", "miner", "scientist", "robber", "scout", "stationaryHauler", "communeDefender", "remoteBuilder", "antifaSupporter", "antifaAssaulter"]
        let remoteRoles = ["remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver"]

        let creepsOfRole = {}

        for (let name in Game.creeps) {

            let creep = Game.creeps[name]

            if (creep.memory.dying != true) {

                let creepValues = _.chunk([creep.memory.role, creep.memory.roomFrom], 2)

                if (!creepsOfRole[creepValues]) {

                    creepsOfRole[creepValues] = 1
                } else {

                    creepsOfRole[creepValues]++
                }

                let remoteCreepValues = 1
            }
        }

        if (Memory.creepCount == null) {

            Memory.creepCount = {}
        }

        for (let role of rolesList) {

            if (Memory.creepCount[role] == null) {
                Memory.creepCount[role] = 0
            }
        }

        for (let role of remoteRoles) {

            if (Memory.creepCount[role] == null) {
                Memory.creepCount[role] = 0
            }
        }


        let boostedSquads = false
        let squadType = "ranged"
            //let squadType = "dismantle"
            //let squadType = "attack

        if (Game.shard.name == "shard2") {

            //var claimerTarget = "E32N3"
            var claimerTarget = undefined
                //var builderTarget = "E32N3"
            var builderTarget = undefined
        } else {

            //var claimerTarget = "E31N14"
            var claimerTarget = undefined
                //var builderTarget = "E31N14"
            var builderTarget = undefined
        }

        let target4 = Game.flags.S
        let target9 = Game.flags.R

        let communeEstablisher
        let communeEstablisherFound = false

        if (builderTarget && communeEstablisherFound == false) {
            for (let maxDistance = 1; maxDistance <= 12 && !communeEstablisher; maxDistance++) {

                _.forEach(Game.rooms, function(room) {

                    if (room.controller && room.controller.my && room.memory.stage >= 3) {

                        let distance = Game.map.getRoomLinearDistance(builderTarget, room.name)

                        if (distance < maxDistance) {

                            communeEstablisher = room
                            communeEstablisherFound = true
                            console.log("BT, d " + distance + "D " + maxDistance + "R " + room.name)
                            return
                        }
                    }
                })
            }
        }

        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my) {

                taskManager.run(room, creepsOfRole)

                /*Integral values for spawning considerations*/

                let remoteBuilderNeed = false

                _.forEach(Game.rooms, function(myRooms) {

                    if (myRooms.memory.builderNeed == true && myRooms.memory.myRoom != false) {

                        let remoteRoomDistance = Game.map.getRoomLinearDistance(room.name, myRooms.name)

                        if (remoteRoomDistance == 1) {

                            remoteBuilderNeed = true
                            return
                        }
                    }
                })

                let remoteEnemy = false

                _.forEach(Game.rooms, function(myRooms) {

                    if (myRooms.memory.enemy == true && myRooms.memory.myRoom != false) {

                        let remoteRoomDistance = Game.map.getRoomLinearDistance(room.name, myRooms.name)

                        if (remoteRoomDistance == 1) {

                            remoteEnemy = true
                            return
                        }
                    }
                })

                for (let role of rolesList) {

                    if (!creepsOfRole[[role, room.name]]) {

                        creepsOfRole[[role, room.name]] = 0
                    }
                }

                let hostileAttacker = room.find(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && c.owner.username != "Invader" && (c.getActiveBodyparts(ATTACK) != 0 || c.getActiveBodyparts(RANGED_ATTACK) != 0 || c.getActiveBodyparts(WORK) != 0))
                    }
                })[0]

                if (hostileAttacker) {
                    console.log("Attack!!")

                    Memory.global.lastDefence.time = Game.time
                    Memory.global.lastDefence.room = room.name
                }

                let roomMineral = room.find(FIND_MINERALS)[0].mineralAmount > 0

                let roomExtractor = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_EXTRACTOR
                })[0]

                let roomConstructionSite = room.find(FIND_CONSTRUCTION_SITES)[0]

                let repairStructure = room.find(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_ROAD && s.structureType == STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.5
                })[0]

                if (Game.getObjectById(room.memory.towers) != null && Game.getObjectById(room.memory.towers).length >= 1) {

                    var towerTrue = true
                }

                let controllerContainer = Game.getObjectById(room.memory.controllerContainer)
                let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
                let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)

                let baseLink = Game.getObjectById(room.memory.baseLink)
                let controllerLink = Game.getObjectById(room.memory.controllerLink)
                let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
                let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

                let remoteRooms = room.memory.remoteRooms
                let remoteRoomsNumber = 0

                if (remoteRooms) {

                    remoteRoomsNumber = room.memory.remoteRooms.length
                }

                let stage = room.memory.stage

                if (room.energyCapacityAvailable >= 9900) {

                    room.memory.stage = 8

                } else if (room.energyCapacityAvailable >= 5100) {

                    room.memory.stage = 7

                } else if (room.energyCapacityAvailable >= 2300) {

                    room.memory.stage = 6

                } else if (room.energyCapacityAvailable >= 1800) {

                    room.memory.stage = 5

                } else if (room.energyCapacityAvailable >= 1300) {

                    room.memory.stage = 4

                } else if (room.energyCapacityAvailable >= 800) {

                    room.memory.stage = 3

                } else if (room.energyCapacityAvailable >= 550) {

                    room.memory.stage = 2

                } else if (room.energyCapacityAvailable >= 300) {

                    room.memory.stage = 1

                }

                /*Minimum creeps definitions*/

                let minCreeps = {}

                for (let role of rolesList) {

                    minCreeps[role] = 0
                }

                switch (stage) {
                    case 1:

                        minCreeps["harvester1"] = 3

                        minCreeps["harvester2"] = 3

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 2
                        break
                    case 2:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2
                        break
                    case 3:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 2
                        break
                    case 4:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 2
                        break
                    case 5:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 1
                        break
                    case 6:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 1
                        break
                    case 7:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 1

                        minCreeps["stationaryHauler"] = 1

                        minCreeps["scientist"] = 1
                        break
                    case 8:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["baseHauler"] = 2

                        minCreeps["containerHauler"] = 1

                        minCreeps["stationaryHauler"] = 1

                        minCreeps["scientist"] = 1
                        break
                }

                let squads = 0

                if (room.name == "E18S1") {

                    squads = 4
                }
                if (Game.flags.BB /*&& attackRoom == room*/ ) {

                    minCreeps["antifaAssaulters"] = squads
                    minCreeps["antifaSupporters"] = minCreeps["antifaAssaulters"]
                }

                if (roomConstructionSite) {
                    if (!room.storage) {

                        if (stage <= 2) {

                            minCreeps["builder"] = 3
                        } else {

                            minCreeps["builder"] = 2
                        }
                    } else if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 30000) {

                        if (stage <= 5) {

                            minCreeps["builder"] = 2
                        } else {

                            minCreeps["builder"] = 1
                        }
                    }
                }

                if (!room.storage) {

                    if (stage <= 3) {

                        minCreeps["upgrader"] = 3
                    } else {

                        minCreeps["upgrader"] = 2
                    }
                } else
                if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 20000) {

                    if (stage <= 5) {

                        minCreeps["upgrader"] = 2
                    } else {

                        minCreeps["upgrader"] = 1
                    }
                }

                if (!room.storage) {

                    minCreeps["barricadeUpgrader"] = 1

                } else if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 40000) {

                    minCreeps["barricadeUpgrader"] = 1
                }

                if (hostileAttacker && stage >= 2) {

                    minCreeps["rangedDefender"] = 2
                }

                if (target9 && stage >= 4 /**/ ) {

                    minCreeps["robber"] = 2
                }

                if (repairStructure) {

                    minCreeps["repairer"] = 1
                }

                if (claimerTarget && room == communeEstablisher) {

                    minCreeps["claimer"] = 1
                }

                if (builderTarget && room == communeEstablisher) {

                    minCreeps["revolutionaryBuilder"] = 4
                }

                if (roomExtractor && roomMineral && Memory.global.globalStage >= 1) {

                    minCreeps["miner"] = 1
                }

                if (target4) {

                    minCreeps["scout"] = 2
                }

                if (remoteBuilderNeed && stage >= 4) {

                    minCreeps["remoteBuilder"] = 1
                }

                if (remoteEnemy && stage >= 3) {

                    minCreeps["communeDefender"] = 1
                }

                for (let object of room.memory.remoteRooms) {

                    if (stage <= 2) {
                        minCreeps["remoteHarvester1"] += object.sources

                        minCreeps["remoteHarvester2"] += object.sources

                        minCreeps["remoteHauler"] += object.sources
                    }
                    if (stage >= 3) {

                        minCreeps["reserver"] += 1
                    }
                }

                if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 275000 && stage <= 7) {

                    minCreeps["upgrader"] += 1
                }
                if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 80000 && stage <= 7) {

                    minCreeps["upgradeHauler"] = 1
                    minCreeps["upgrader"] += 2
                }

                if (!requiredCreeps) {

                    var requiredCreeps = {}
                }

                for (let role of rolesList) {

                    if (minCreeps[role] > creepsOfRole[[role, room.name]]) {

                        requiredCreeps[role] = minCreeps[role] - creepsOfRole[[role, room.name]]
                        creepsOfRole[[role, room.name]] - 1

                        console.log(role + ", " + requiredCreeps[role] + ", " + room.name)
                    }
                }

                let roomFix = room.memory.roomFix

                if (roomFix == null) {

                    room.memory.roomFix = false
                }

                let roomFixMessage = ""

                if (creepsOfRole[["harvester1", room.name]] + creepsOfRole[["harvester2", room.name]] == 0 || creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] == 0) {

                    room.memory.roomFix = true

                    minCreeps["generalHauler"] = 1
                    roomFixMessage = "rf"

                    console.log(room.name + ": roomFix true")

                } else if (requiredCreeps["harvester1"] + requiredCreeps["harvester2"] + requiredCreeps["baseHualer"] + requiredCreeps["containerHauler"] == 0) {

                    room.memory.roomFix = false
                }

                /*
                                var myRamparts = spawn.room.find(FIND_MY_STRUCTURES, {
                                    filter: (s) => s.structureType == STRUCTURE_RAMPART
                          })      
        
                        if (myRamparts && ally.length > 0) {
        
                            for (let rampart of myRamparts) {
        
                                    rampart.setPublic(true)
        
                            }
                              }  
                                else {
                                    for (let rampart of myRamparts) {
                                        
                                            rampart.setPublic(false)
                                            
                            }        
                             }   
                                */

                /*Creep spawn variables*/

                let freeEnergy = room.energyAvailable
                let capacityEnergy = room.energyCapacityAvailable

                function roleValues(parts, role) {

                    let body = []
                    let bodyTier = 1
                    let sliceAmount

                    for (let object of parts) {

                        sliceAmount = object.sliceAmount

                        if (roomFix && stage >= object.stage) {

                            getParts(freeEnergy)
                            break

                        } else if (!roomFix && stage >= object.stage) {

                            getParts(capacityEnergy)
                            break
                        }

                        function getParts(energyType) {

                            if (object.defaultParts[0]) {

                                body.push(object.defaultParts)
                                bodyTier++
                            }

                            let bodyAmount = Math.floor((energyType - object.defaultCost) / object.extraCost)

                            if (bodyAmount != Infinity) {

                                for (let i = 0; i < bodyAmount; i++) {

                                    body.push(object.extraParts)
                                    bodyTier++
                                }
                            }
                        }
                    }

                    body = _.flattenDeep(body).slice(0, sliceAmount)

                    return {
                        body: body,
                        tier: bodyTier,
                        role: role
                    }
                }

                let generalHaulerBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, CARRY, MOVE],
                            extraCost: 150,
                            sliceAmount: 36
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, MOVE],
                            extraCost: 100,
                            sliceAmount: 50
                        }
                    ],
                    "generalHauler")

                let harvester1Body = roleValues(
                    [{
                            stage: 6,
                            defaultParts: [CARRY],
                            defaultCost: 50,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 15
                        },
                        {
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 12
                        },
                        {
                            stage: 3,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 12
                        },
                        {
                            stage: 1,
                            defaultParts: [MOVE],
                            defaultCost: 50,
                            extraParts: [WORK],
                            extraCost: 100,
                            sliceAmount: 9
                        }
                    ],
                    "harvester1")

                let harvester2Body = roleValues(
                    [{
                            stage: 6,
                            defaultParts: [CARRY, CARRY, MOVE],
                            defaultCost: 150,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 15
                        },
                        {
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 12
                        },
                        {
                            stage: 3,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 12
                        },
                        {
                            stage: 1,
                            defaultParts: [MOVE],
                            defaultCost: 50,
                            extraParts: [WORK],
                            extraCost: 100,
                            sliceAmount: 9
                        }
                    ],
                    "harvester2")

                let baseHaulerBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, CARRY, MOVE],
                            extraCost: 150,
                            sliceAmount: 36
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, MOVE],
                            extraCost: 100,
                            sliceAmount: 50
                        }
                    ],
                    "baseHauler")

                let containerHaulerBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, CARRY, MOVE],
                            extraCost: 150,
                            sliceAmount: 36
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, MOVE],
                            extraCost: 100,
                            sliceAmount: 50
                        }
                    ],
                    "containerHauler")

                let upgraderBody = roleValues(
                    [{
                            stage: 8,
                            defaultParts: [CARRY, CARRY, MOVE],
                            defaultCost: 150,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 24
                        },
                        {
                            stage: 3,
                            defaultParts: [CARRY],
                            defaultCost: 50,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 25
                        },
                        {
                            stage: 2,
                            defaultParts: [CARRY],
                            defaultCost: 50,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 25
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, MOVE, CARRY, MOVE],
                            extraCost: 250,
                            sliceAmount: 25
                        }
                    ],
                    "upgrader")

                let repairerBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, CARRY, MOVE],
                            extraCost: 200,
                            sliceAmount: 24
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, MOVE, CARRY, MOVE],
                            extraCost: 250,
                            sliceAmount: 24
                        }
                    ],
                    "repairer")

                let builderBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, CARRY, MOVE],
                            extraCost: 200,
                            sliceAmount: 24
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, MOVE, CARRY, MOVE],
                            extraCost: 250,
                            sliceAmount: 24
                        }
                    ],
                    "builder")

                let barricadeUpgraderBody = roleValues(
                    [{
                            stage: 5,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, CARRY, MOVE],
                            extraCost: 200,
                            sliceAmount: 24
                        },
                        {
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [WORK, MOVE, CARRY, MOVE],
                            extraCost: 250,
                            sliceAmount: 24
                        }
                    ],
                    "barricadeUpgrader",
                    "BaU")

                let remoteBuilderBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [WORK, MOVE, CARRY, MOVE],
                        extraCost: 250,
                        sliceAmount: 20
                    }],
                    "remoteBuilder")

                let communeDefenderBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [ATTACK, MOVE],
                        extraCost: 130,
                        sliceAmount: 24
                    }],
                    "communeDefender")

                let revolutionaryBuilderBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [WORK, MOVE, CARRY, MOVE],
                        extraCost: 250,
                        sliceAmount: 24
                    }],
                    "revolutionaryBuilder")

                let claimerBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [CLAIM, MOVE, MOVE],
                        defaultCost: 700,
                        extraParts: [],
                        extraCost: 0,
                        sliceAmount: 3
                    }],
                    "claimer")

                let rangedDefenderBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [RANGED_ATTACK, MOVE],
                        extraCost: 220,
                        sliceAmount: 50
                    }],
                    "rangedDefender")

                let scientistBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, MOVE],
                        defaultCost: 400,
                        extraParts: [],
                        extraCost: 0,
                        sliceAmount: 8
                    }],
                    "scientist")

                let stationaryHaulerBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [MOVE],
                        defaultCost: 50,
                        extraParts: [CARRY],
                        extraCost: 50,
                        sliceAmount: 17
                    }],
                    "stationaryHauler")

                let upgradeHaulerBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [CARRY, CARRY, MOVE],
                        extraCost: 0,
                        sliceAmount: 36
                    }],
                    "upgradeHauler")

                let minerBody = roleValues(
                    [{
                        stage: 8,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [WORK, WORK, MOVE, WORK, CARRY, MOVE],
                        extraCost: 450,
                        sliceAmount: 50
                    }, {
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [WORK, WORK, MOVE, WORK, CARRY, MOVE],
                        extraCost: 450,
                        sliceAmount: 24
                    }],
                    "miner")

                let robberBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [],
                        defaultCost: 0,
                        extraParts: [CARRY, MOVE],
                        extraCost: 100,
                        sliceAmount: 24
                    }],
                    "robber")


                let scoutBody = roleValues(
                    [{
                        stage: 1,
                        defaultParts: [MOVE],
                        defaultCost: 50,
                        extraParts: [],
                        extraCost: 0,
                        sliceAmount: 1
                    }],
                    "scout")

                if (squadType == "ranged") {
                    var antifaAssaulterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE],
                            defaultCost: 6000,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaAssaulter")

                    var antifaSupporterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE],
                            defaultCost: 8000,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaSupporter")
                } else if (squadType == "attack") {
                    var antifaAssaulterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 50,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaAssaulter")

                    var antifaSupporterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 50,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaSupporter")
                } else if (squadType == "dismantle") {
                    var antifaAssaulterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 50,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaAssaulter")

                    var antifaSupporterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 50,
                            extraParts: [],
                            extraCost: 0,
                            sliceAmount: 50
                        }],
                        "antifaSupporter")
                }

                let bodies = [harvester1Body, generalHaulerBody, baseHaulerBody, containerHaulerBody, harvester2Body, upgraderBody, builderBody, repairerBody, upgradeHaulerBody, barricadeUpgraderBody, claimerBody, revolutionaryBuilderBody, rangedDefenderBody, minerBody, scientistBody, robberBody, scoutBody, stationaryHaulerBody, communeDefenderBody, remoteBuilderBody, antifaSupporterBody, antifaAssaulterBody]

                for (let role in requiredCreeps) {

                    let correctBody = _.filter(bodies, function(body) { return body.role === role })

                    let bodyRole = correctBody[0]

                    if (bodyRole.role == role && freeEnergy >= 300 && requiredCreeps[role] && requiredCreeps[role] > 0) {

                        let rawSpawns = room.memory.spawns

                        if (rawSpawns == null) {

                            rawSpawns = []
                        }

                        let mySpawns = []

                        for (let spawns of rawSpawns) {

                            let spawn = Game.getObjectById(spawns)
                            mySpawns.push(spawn)

                        }

                        for (spawn of mySpawns) {

                            let testSpawn = spawn.spawnCreep(bodyRole.body, bodyRole.role, { dryRun: true })

                            if (testSpawn == 0) {

                                spawn.spawnCreep(bodyRole.body, (roomFixMessage + bodyRole.role + ", T" + bodyRole.tier + ", " + Memory.creepCount[role]), {
                                    memory: {
                                        role: bodyRole.role,
                                        isFull: false,
                                        roomFrom: room.name,
                                        remoteRoom: "remoteRoom",
                                        target: "target"
                                    }
                                })

                                requiredCreeps[role] - 1
                                Memory.creepCount[role] + 1

                                Memory.stats.energySpentOnCreeps += bodyRole.defaultCost + bodyRole.extraCost

                            } else if (testSpawn != -4) {

                                console.log("Failed to spawn: " + testSpawn + ", " + bodyRole.role + ", " + bodyRole.body.length + ", " + bodyRole.tier)
                            }
                        }
                    }
                }
            }
        })
    }
};