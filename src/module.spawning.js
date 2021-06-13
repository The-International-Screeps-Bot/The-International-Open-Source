let taskManager = require("module.taskManager")
let trafficManager = require("module.trafficManager")
let allyList = require("module.allyList");

module.exports = {
    run: function spawns() {

        let rolesList = ["harvester1", "hauler", "harvester2", "upgrader", "builder", "repairer", "barricadeUpgrader", "rangedDefender", "upgradeHauler", "claimer", "revolutionaryBuilder", "miner", "scientist", "robber", "scout", "stationaryHauler", "communeDefender", "remoteBuilder", "antifaSupporter", "antifaAssaulter"]
        let remoteRoles = ["remoteHarvester1", "remoteHauler", "remoteHarvester2", "reserver"]

        let creepsOfRole = {}
        let haulers = []

        for (let name in Game.creeps) {

            let creep = Game.creeps[name]

            if (creep.memory.dying != true) {

                let creepValues = _.chunk([creep.memory.role, creep.memory.roomFrom], 2)

                if (!creepsOfRole[creepValues]) {

                    creepsOfRole[creepValues] = 1
                } else {

                    creepsOfRole[creepValues]++
                }
            }

            if (creep.memory.role == "hauler") {

                haulers.push({ creep: creep, roomFrom: creep.memory.roomFrom })
            }

            let remoteCreepValues = 1
        }


        let boostedSquads = false

        let squadType = "ranged"

        //let squadType = "dismantle"

        //let squadType = "attack

        if (Game.shard.name == "shard2") {

            //var newCommune = "E21N3"

            var newCommune

            // var attackTarget = "E28N9"

            var attackTarget

        } else {

            //var newCommune = "E29N11"

            var newCommune

            var attackTarget = "E28N12"

            //var attackTarget
        }

        Memory.global.newCommune = newCommune

        let communeEstablisher = findCommuneEstablisher()

        function findCommuneEstablisher() {
            if (newCommune) {

                for (let maxDistance = 1; maxDistance <= 12; maxDistance++) {

                    for (let room of Object.keys(Game.rooms)) {

                        room = Game.rooms[room]

                        if (room.controller && room.controller.my && room.memory.stage >= 3) {

                            let distance = Game.map.getRoomLinearDistance(newCommune, room.name)

                            if (distance < maxDistance) {

                                console.log("NC, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                                return room
                            }
                        }
                    }
                }
            }
        }

        Memory.global.attackTarget = attackTarget

        let attackingRoom = findAttackingRooms()

        function findAttackingRooms() {

            if (attackTarget) {

                for (let stage = 8; stage != 0; stage--) {
                    for (let maxDistance = 1; maxDistance <= 10; maxDistance++) {

                        for (let room of Object.keys(Game.rooms)) {

                            room = Game.rooms[room]

                            if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.totalEnergy && room.memory.totalEnergy >= 30000) {

                                let distance = Game.map.getRoomLinearDistance(attackTarget, room.name)

                                if (distance < maxDistance) {

                                    console.log("AT, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                                    return room
                                }
                            }
                        }
                    }
                }
            }
        }

        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my) {

                taskManager.run(room, haulers)

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
                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && c.owner.username != "Invader" && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK)))
                    }
                })

                if (hostileAttacker.length > 0) {
                    console.log("Attack!!")

                    Memory.global.lastDefence.time = Game.time
                    Memory.global.lastDefence.room = room.name
                }

                let roomMineral = room.find(FIND_MINERALS).mineralAmount > 0

                let roomExtractor = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_EXTRACTOR
                })

                let roomConstructionSite = room.find(FIND_CONSTRUCTION_SITES)

                let repairStructure = room.find(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.5
                })

                let barricadesToUpgrade = room.find(FIND_MY_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < s.hitsMax * 0.9
                })

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

                if (room.energyCapacityAvailable >= 9100) {

                    room.memory.stage = 8

                } else if (room.energyCapacityAvailable >= 4700) {

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

                        minCreeps["hauler"] = 4
                        break
                    case 2:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 5
                        break
                    case 3:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 4
                        break
                    case 4:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 3
                        break
                    case 5:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 3
                        break
                    case 6:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 3
                        break
                    case 7:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 1

                        minCreeps["scientist"] = 1
                        break
                    case 8:

                        minCreeps["harvester1"] = 1

                        minCreeps["harvester2"] = 1

                        minCreeps["hauler"] = 1

                        minCreeps["scientist"] = 1
                        break
                }

                if (attackingRoom && attackingRoom == room) {

                    minCreeps["antifaAssaulter"] = 1
                    minCreeps["antifaSupporter"] = minCreeps["antifaAssaulter"]
                }

                if (roomConstructionSite.length > 0) {
                    if (!room.storage) {

                        if (stage <= 2) {

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

                    if (stage <= 3) {

                        minCreeps["upgrader"] = 4
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

                    } else if (room.storage &&
                        room.storage.store[RESOURCE_ENERGY] >= 30000) {

                        minCreeps["barricadeUpgrader"] = 1
                    }
                }

                if (controllerLink != null &&
                    baseLink != null &&
                    sourceLink1 != null &&
                    sourceLink2 != null) {

                    minCreeps["stationaryHauler"] = 1
                }

                if (hostileAttacker.length > 0) {

                    minCreeps["rangedDefender"] = 2
                }

                if (Game.flags.R && stage >= 4 /**/ ) {

                    minCreeps["robber"] = 2
                }

                if (repairStructure.length > 0) {

                    minCreeps["repairer"] = 1
                }

                if (newCommune && room == communeEstablisher) {

                    minCreeps["claimer"] = 1
                }

                if (newCommune && room == communeEstablisher) {

                    minCreeps["revolutionaryBuilder"] = 4
                }

                if (roomExtractor.length > 0 && roomMineral.length > 0 && Memory.global.globalStage >= 1) {

                    minCreeps["miner"] = 1
                }

                if (Game.flags.S) {

                    minCreeps["scout"] = 1
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

                if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 275000 && room.controller.level <= 7) {

                    minCreeps["upgrader"] += 1
                }
                if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 80000 && room.controller.level <= 7) {

                    minCreeps["upgradeHauler"] = 1
                    minCreeps["upgrader"] += 2
                }

                if (!requiredCreeps) {

                    var requiredCreeps = {}
                }

                for (let role of rolesList) {

                    if (minCreeps[role] > creepsOfRole[[role, room.name]]) {

                        requiredCreeps[role] = minCreeps[role] - creepsOfRole[[role, room.name]]

                        console.log(role + ", " + requiredCreeps[role] + ", " + room.name)
                    }
                }

                let roomFix = room.memory.roomFix

                if (roomFix == null) {

                    room.memory.roomFix = false
                }

                let roomFixMessage = ""

                if (creepsOfRole[["harvester1", room.name]] + creepsOfRole[["harvester2", room.name]] == 0 || creepsOfRole[["hauler", room.name]] == 0) {

                    room.memory.roomFix = true

                    roomFixMessage = "rf"

                    console.log(room.name + ": roomFix true")

                } else if (requiredCreeps["harvester1"] + requiredCreeps["harvester2"] + requiredCreeps["hauler"] == 0) {

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

                var haulerBody = roleValues(
                    [{
                            stage: 7,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [CARRY, CARRY, MOVE],
                            extraCost: 150,
                            sliceAmount: 48
                        }, {
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
                    "hauler")

                let harvester1Body = roleValues(
                    [{
                            stage: 6,
                            defaultParts: [CARRY],
                            defaultCost: 50,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 13
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
                            defaultParts: [CARRY],
                            defaultCost: 50,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 13
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

                let upgraderBody = roleValues(
                    [{
                            stage: 8,
                            defaultParts: [CARRY, CARRY],
                            defaultCost: 100,
                            extraParts: [WORK, WORK, MOVE],
                            extraCost: 250,
                            sliceAmount: 5
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
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [RANGED_ATTACK, MOVE],
                            extraCost: 200,
                            sliceAmount: 2
                        }],
                        "antifaAssaulter")

                    var antifaSupporterBody = roleValues(
                        [{
                            stage: 1,
                            defaultParts: [],
                            defaultCost: 0,
                            extraParts: [HEAL, MOVE],
                            extraCost: 300,
                            sliceAmount: 2
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

                let bodies = [harvester1Body, haulerBody, harvester2Body, upgraderBody, builderBody, repairerBody, barricadeUpgraderBody, rangedDefenderBody, upgradeHaulerBody, claimerBody, revolutionaryBuilderBody, minerBody, scientistBody, robberBody, scoutBody, stationaryHaulerBody, communeDefenderBody, remoteBuilderBody, antifaSupporterBody, antifaAssaulterBody]

                let i = 0

                for (let role in requiredCreeps) {

                    i++

                    if (i <= room.memory.spawns.length) {

                        let correctBody = _.filter(bodies, function(body) { return body.role == role })

                        let bodyRole = correctBody[0]

                        if (bodyRole.role == role && freeEnergy >= 300) {

                            for (let spawns of room.memory.spawns) {

                                let spawn = Game.getObjectById(spawns)

                                let testSpawn = spawn.spawnCreep(bodyRole.body, bodyRole.role, { dryRun: true })

                                if (testSpawn == 0) {

                                    spawn.spawnCreep(bodyRole.body, (roomFixMessage + bodyRole.role + ", T" + bodyRole.tier + ", " + Game.time), {
                                        memory: {
                                            role: bodyRole.role,
                                            isFull: false,
                                            roomFrom: room.name
                                        }
                                    })

                                    requiredCreeps[role] - 1

                                    Memory.stats.energySpentOnCreeps += bodyRole.defaultCost + bodyRole.extraCost

                                } else if (testSpawn != -4) {

                                    console.log("Failed to spawn: " + testSpawn + ", " + bodyRole.role + ", " + bodyRole.body.length + ", " + bodyRole.tier)
                                }
                            }
                        }
                    }
                }
            }
        })
    }
};