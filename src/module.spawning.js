let taskManager = require("module.taskManager")
let trafficManager = require("module.trafficManager")
let allyList = require("module.allyList")

module.exports = {
    run: function spawns() {

        let rolesList = ["harvester1", "harvester2", "baseHauler", "containerHauler", "generalHauler", "upgrader", "builder", "repairer", "upgradeHauler", "barricadeUpgrader", "claimer", "revolutionaryBuilder", "rangedDefender", "miner", "scientist", "robber", "scout", "stationaryHauler", "communeDefender", "remoteBuilder", "antifaSupporter", "antifaAssaulter"]
        let creepsOfRole = {}
        let creepCount = Memory.creepCount

        for (let name in Game.creeps) {

            var creep = Game.creeps[name]

            if (creep.memory.dying != true) {

                var creepValues = _.chunk([creep.memory.role, creep.memory.roomFrom], 2)

                if (!creepsOfRole[creepValues]) {

                    creepsOfRole[creepValues] = 1
                } else {

                    creepsOfRole[creepValues]++
                }
            }
            //console.log(creep.memory.role + ", " + creepsOfRole[creepValues])

        }
        for (let role of rolesList) {

            if (Memory.creepCount != null) {
                if (Memory.creepCount[role] == null) {
                    Memory.creepCount[role] = 0
                }
            } else {

                Memory.creepCount = []
            }
        }

        let boostedSquads = false
        let squadType = "ranged"
            //let squadType = "dismantle"
            //let squadType = "attack

        if (Game.shard.name == "shard2") {

            var claimerTarget = "E33N2"
                //var claimerTarget = undefined
            var builderTarget = "E33N2"
                //var builderTarget = undefined
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

                let remoteBuilderNeed = false

                _.forEach(Game.rooms, function(myRooms) {

                    if (myRooms.memory.builderNeed == true && myRooms.memory.myRoom != false) {

                        //console.log("true")
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

                        //console.log("true")
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

                let minCreeps = {}

                for (let role of rolesList) {

                    minCreeps[role] = 0
                }

                //RCL 1
                if (stage == 1) {

                    minCreeps["harvester1"] = 3

                    minCreeps["harveser2"] = 3

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 2

                    minCreeps["upgrader"] = 3
                }
                //RCL 2
                if (stage == 2) {

                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 2

                    minCreeps["upgrader"] = 3
                }
                //RCL 3
                if (stage == 3) {

                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 2

                    minCreeps["upgrader"] = 3

                    minCreeps["barricadeUpgrader"] = 1
                }
                //RCL 4
                if (stage == 4) {

                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 2

                    minCreeps["upgrader"] = 3

                    minCreeps["barricadeUpgrader"] = 1
                }
                //RCL 5
                if (stage == 5) {
                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 1

                    minCreeps["upgrader"] = 2

                    minCreeps["barricadeUpgrader"] = 1
                }
                //RCL 6
                if (stage == 6) {
                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 1

                    minCreeps["upgrader"] = 1

                    minCreeps["barricadeUpgrader"] = 1
                }
                //RCL 7
                if (stage == 7) {
                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 1

                    minCreeps["upgrader"] = 1

                    minCreeps["stationaryHauler"] = 1

                    minCreeps["barricadeUpgrader"] = 1

                    minCreeps["scientist"] = 1
                }
                //RCL 8
                if (stage == 8) {
                    minCreeps["harvester1"] = 1

                    minCreeps["harveser2"] = 1

                    minCreeps["baseHauler"] = 2

                    minCreeps["containerHauler"] = 1

                    minCreeps["upgrader"] = 1

                    minCreeps["stationaryHauler"] = 1

                    minCreeps["barricadeUpgrader"] = 1

                    minCreeps["scientist"] = 1
                }

                let squads = 0

                if (room.name == "E18S1") {

                    squads = 4
                }
                if (Game.flags.BB /*&& attackRoom == room*/ ) {

                    minCreeps["antifaAssaulters"] = squads
                    minCreeps["antifaSupporters"] = minCreeps["antifaAssaulters"]
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

                    minCreeps["scout"] = 1
                }

                if (roomConstructionSite) {

                    if (stage <= 2) {

                        minCreeps["builder"] = 3
                    } else if (stage <= 5) {

                        minCreeps["builder"] = 2
                    } else {

                        minCreeps["builder"] = 1
                    }
                }

                if (remoteBuilderNeed && stage >= 4) {

                    minCreeps["remoteBuilder"] = 1
                }

                if (remoteEnemy && stage >= 3) {

                    minCreeps["communeDefender"] = 1
                }

                if (room.memory.remoteRooms[0]) {

                    if (stage <= 2) {
                        minCreeps["remoteHarvester1"] = 2

                        minCreeps["remoteHarvester2"] = 2

                        minCreeps["remoteHauler"] = 2
                    } else if (stage <= 4) {
                        minCreeps["remoteHarvester1"] = 1

                        minCreeps["remoteHarvester2"] = 1

                        minCreeps["remoteHauler"] = 2

                        minCreeps["reserver"] = 1
                    } else if (stage <= 6) {
                        minCreeps["remoteHarvester1"] = 1

                        minCreeps["remoteHarvester2"] = 1

                        minCreeps["remoteHauler"] = 2

                        minCreeps["reserver"] = 1
                    } else {
                        minCreeps["remoteHarvester1"] = 1

                        minCreeps["remoteHarvester2"] = 1

                        minCreeps["remoteHauler"] = 1

                        minCreeps["reserver"] = 1
                    }
                }

                if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 275000 && stage <= 7) {

                    minCreeps["upgrader"] = 2
                }
                if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 80000 && stage <= 7) {

                    minCreeps["upgraderHauler"] = 1
                    minCreeps["upgrader"] = 2
                }

                if (!requiredCreeps) {

                    var requiredCreeps = {}
                }

                for (let role of rolesList) {

                    if (minCreeps[role] > creepsOfRole[[role, room.name]]) {

                        console.log(role + ", " + (minCreeps[role] - creepsOfRole[[role, room.name]]) + ", " + room.name)
                    }
                }

                //console.log(room.energyCapacityAvailable)

                /*
                RCL 1: 300

                RCL 2: 550

                RCL 3: 800

                RCL 4: 1, 300

                RCL 5: 1, 800

                RCL 6: 2, 300

                RCL 7: 5, 600

                RCL 8: 12, 900
                */

                /*
                    var hostileAttacker = (FIND_HOSTILE_CREEPS, {
                    filter: function(object) {
                        return object.getActiveBodyparts(HEAL) == 4;
                    }
                });
                */
                //console.log(roomConstructionSite.length + ", " + spawn.room.name)
                /*
                var ally = spawn.room.find(FIND_HOSTILE_CREEPS, {
                    filter: (c) => c.owner.username === "Brun1L"
                });

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

                let remoteRooms = room.memory.remoteRooms
                let remoteRoomsNumber = 0

                if (remoteRooms) {

                    remoteRoomsNumber = room.memory.remoteRooms.length
                }

                let roomFix = room.memory.roomFix
                let freeEnergy = room.energyAvailable
                let capacityEnergy = room.energyCapacityAvailable

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

                if (roomFix == null) {

                    room.memory.roomFix = false
                }

                if (creepsOfRole[["harvester1", room.name]] + creepsOfRole[["harvester2", room.name]] == 0 || creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] == 0) {

                    room.memory.roomFix = true

                }

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

                    var name = undefined

                    if (roomFix == true && freeEnergy >= 300) {
                        //freeEnergy Hauler
                        if (stage <= 4) {

                            let haulerBodyAmount = Math.floor(freeEnergy / 100)
                            let haulerBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < haulerBodyAmount; i++) {

                                haulerBody.push(CARRY, MOVE)
                                haulerBodyTier++

                            }
                            var haulerBodyResult = haulerBody
                        } else {

                            let haulerBodyAmount = Math.floor(freeEnergy / 150)
                            let haulerBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < haulerBodyAmount; i++) {

                                haulerBody.push(CARRY, CARRY, MOVE)
                                haulerBodyTier++

                            }
                            var haulerBodyResult = haulerBody.slice(0, 36)
                        }
                        //freeEnergy Harvester
                        if (stage <= 5) {

                            let harvesterBodyAmount = Math.floor(freeEnergy / 250)
                            let harvesterBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < harvesterBodyAmount; i++) {

                                harvesterBody.push(WORK, WORK, MOVE)
                                harvesterBodyTier++

                            }
                            var harvesterBodyResult = harvesterBody.slice(0, 12)
                        } else {

                            let harvesterBodyAmount = Math.floor(freeEnergy / 250)
                            let harvesterBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < harvesterBodyAmount; i++) {

                                harvesterBody.push(WORK, WORK, MOVE)
                                harvesterBodyTier++

                            }
                            var harvesterBodyResult = harvesterBody.slice(0, 15)
                        }
                    } else {
                        //Hauler
                        if (stage <= 4) {

                            let haulerBodyAmount = Math.floor(capacityEnergy / 100)
                            let haulerBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < haulerBodyAmount; i++) {

                                haulerBody.push(CARRY, MOVE)
                                haulerBodyTier++

                            }
                            var haulerBodyResult = haulerBody
                        } else {

                            let haulerBodyAmount = Math.floor(capacityEnergy / 150)
                            let haulerBody = []

                            var haulerBodyTier = 0

                            for (let i = 0; i < haulerBodyAmount; i++) {

                                haulerBody.push(CARRY, CARRY, MOVE)
                                haulerBodyTier++

                            }
                            var haulerBodyResult = haulerBody.slice(0, 36)
                        }
                        //Harvester
                        if (stage <= 3) {

                            let harvesterBodyAmount = Math.floor((capacityEnergy - 50) / 150)
                            let harvesterBody = [MOVE]

                            var harvesterBodyTier = 0

                            for (let i = 0; i < harvesterBodyAmount; i++) {

                                harvesterBody.push(WORK)
                                harvesterBodyTier++

                            }
                            var harvesterBodyResult = harvesterBody
                        } else if (stage <= 5) {

                            let harvesterBodyAmount = Math.floor(capacityEnergy / 250)
                            let harvesterBody = []

                            var harvesterBodyTier = 0

                            for (let i = 0; i < harvesterBodyAmount; i++) {

                                harvesterBody.push(WORK, WORK, MOVE)
                                harvesterBodyTier++

                            }
                            var harvesterBodyResult = harvesterBody.slice(0, 12)
                        } else {

                            let harvesterBodyAmount = Math.floor((capacityEnergy - 150) / 250)
                            let harvesterBody = [CARRY, CARRY, MOVE]

                            var harvesterBodyTier = 0

                            for (let i = 0; i < harvesterBodyAmount; i++) {

                                harvesterBody.push(WORK, WORK, MOVE)
                                harvesterBodyTier++

                            }
                            var harvesterBodyResult = harvesterBody.slice(0, 15)
                        }
                        //Upgrader
                        if (stage == 1) {

                            let upgraderBodyAmount = Math.floor(capacityEnergy / 250)
                            let upgraderBody = []

                            var upgraderBodyTier = 0

                            for (let i = 0; i < upgraderBodyAmount; i++) {

                                upgraderBody.push(WORK, MOVE, CARRY, MOVE)
                                upgraderBodyTier++

                            }
                            var upgraderBodyResult = upgraderBody
                        } else if (stage == 2) {

                            let upgraderBodyAmount = Math.floor(capacityEnergy / 250)
                            let upgraderBody = []

                            var upgraderBodyTier = 0

                            for (let i = 0; i < upgraderBodyAmount; i++) {

                                upgraderBody.push(WORK, MOVE, CARRY, MOVE)
                                upgraderBodyTier++

                            }
                            var upgraderBodyResult = upgraderBody
                        } else if (stage <= 7) {

                            let upgraderBodyAmount = Math.floor((capacityEnergy - 100) / 250)
                            let upgraderBody = [CARRY, CARRY]

                            var upgraderBodyTier = 0

                            for (let i = 0; i < upgraderBodyAmount; i++) {

                                upgraderBody.push(WORK, WORK, MOVE)
                                upgraderBodyTier++

                            }
                            var upgraderBodyResult = upgraderBody.slice(0, 26)
                        } else {

                            let upgraderBodyAmount = Math.floor((capacityEnergy - 250) / 350)
                            let upgraderBody = [CARRY, CARRY, MOVE, MOVE, MOVE]

                            var upgraderBodyTier = 0

                            for (let i = 0; i < upgraderBodyAmount; i++) {

                                upgraderBody.push(WORK, WORK, WORK, MOVE)
                                upgraderBodyTier++

                            }
                            var upgraderBodyResult = upgraderBody.slice(0, 25)
                        }
                        //Builder
                        if (stage == 1) {

                            let builderBodyAmount = Math.floor(capacityEnergy / 250)
                            let builderBody = []

                            var builderBodyTier = 0

                            for (let i = 0; i < builderBodyAmount; i++) {

                                builderBody.push(WORK, MOVE, CARRY, MOVE)
                                builderBodyTier++

                            }
                            var builderBodyResult = builderBody
                        } else if (stage <= 4) {

                            let builderBodyAmount = Math.floor(capacityEnergy / 250)
                            let builderBody = []

                            var builderBodyTier = 0

                            for (let i = 0; i < builderBodyAmount; i++) {

                                builderBody.push(WORK, MOVE, CARRY, MOVE)
                                builderBodyTier++

                            }
                            var builderBodyResult = builderBody.slice(0, 24)
                        } else {

                            let builderBodyAmount = Math.floor(capacityEnergy / 200)
                            let builderBody = []

                            var builderBodyTier = 0

                            for (let i = 0; i < builderBodyAmount; i++) {

                                builderBody.push(WORK, CARRY, MOVE)
                                builderBodyTier++

                            }
                            var builderBodyResult = builderBody.slice(0, 24)
                        }
                        //Spawn Builder
                        if (stage >= 1) {

                            let revolutionaryBuilderBodyAmount = Math.floor(capacityEnergy / 250)
                            let revolutionaryBuilderBody = []

                            var revolutionaryBuilderBodyTier = 0

                            for (let i = 0; i < revolutionaryBuilderBodyAmount; i++) {

                                revolutionaryBuilderBody.push(WORK, MOVE, CARRY, MOVE)
                                revolutionaryBuilderBodyTier++

                            }
                            var revolutionaryBuilderBodyResult = revolutionaryBuilderBody.slice(0, 36)
                        }
                        //Remote Builder
                        if (stage >= 1) {

                            let remoteBuilderBodyAmount = Math.floor(capacityEnergy / 250)
                            let remoteBuilderBody = []

                            var remoteBuilderBodyTier = 0

                            for (let i = 0; i < remoteBuilderBodyAmount; i++) {

                                remoteBuilderBody.push(WORK, MOVE, CARRY, MOVE)
                                remoteBuilderBodyTier++

                            }
                            var remoteBuilderBodyResult = remoteBuilderBody.slice(0, 20)
                        }
                        //Wall Repairer
                        if (stage == 4) {

                            let barricadeUpgraderBodyAmount = Math.floor(capacityEnergy / 250)
                            let barricadeUpgraderBody = []

                            var barricadeUpgraderBodyTier = 0

                            for (let i = 0; i < barricadeUpgraderBodyAmount; i++) {

                                barricadeUpgraderBody.push(WORK, MOVE, CARRY, MOVE)
                                barricadeUpgraderBodyTier++

                            }
                            var barricadeUpgraderBodyResult = barricadeUpgraderBody.slice(0, 24)
                        } else if (stage >= 5) {

                            let barricadeUpgraderBodyAmount = Math.floor(capacityEnergy / 200)
                            let barricadeUpgraderBody = []

                            var barricadeUpgraderBodyTier = 0

                            for (let i = 0; i < barricadeUpgraderBodyAmount; i++) {

                                barricadeUpgraderBody.push(WORK, CARRY, MOVE)
                                barricadeUpgraderBodyTier++

                            }
                            var barricadeUpgraderBodyResult = barricadeUpgraderBody.slice(0, 24)
                        }
                        //Remote Harvester
                        if (stage <= 3) {

                            let remoteHarvesterBodyAmount = Math.floor(capacityEnergy / 150)
                            let remoteHarvesterBody = []

                            var remoteHarvesterBodyTier = 0

                            for (let i = 0; i < remoteHarvesterBodyAmount; i++) {

                                remoteHarvesterBody.push(WORK, MOVE)
                                remoteHarvesterBodyTier++

                            }
                            var remoteHarvesterBodyResult = remoteHarvesterBody
                        } else {

                            let remoteHarvesterBodyAmount = Math.floor(capacityEnergy / 250)
                            let remoteHarvesterBody = []

                            var remoteHarvesterBodyTier = 0

                            for (let i = 0; i < remoteHarvesterBodyAmount; i++) {

                                remoteHarvesterBody.push(WORK, WORK, MOVE)
                                remoteHarvesterBodyTier++

                            }
                            var remoteHarvesterBodyResult = remoteHarvesterBody.slice(0, 12)
                        }
                        //Remote Lorry
                        if (stage <= 3) {

                            let remoteHaulerBodyAmount = Math.floor(capacityEnergy / 100)
                            let remoteHaulerBody = []

                            var remoteHaulerBodyTier = 0

                            for (let i = 0; i < remoteHaulerBodyAmount; i++) {

                                remoteHaulerBody.push(CARRY, MOVE)
                                remoteHaulerBodyTier++

                            }
                            var remoteHaulerBodyResult = remoteHaulerBody
                        } else {

                            let remoteHaulerBodyAmount = Math.floor(capacityEnergy / 150)
                            let remoteHaulerBody = []

                            var remoteHaulerBodyTier = 0

                            for (let i = 0; i < remoteHaulerBodyAmount; i++) {

                                remoteHaulerBody.push(CARRY, CARRY, MOVE)
                                remoteHaulerBodyTier++

                            }
                            var remoteHaulerBodyResult = remoteHaulerBody.slice(0, 48)
                        }
                        //Reserver
                        if (stage >= 3) {

                            let reserverBodyAmount = Math.floor(capacityEnergy / 700)
                            let reserverBody = []

                            var reserverBodyTier = 0

                            for (let i = 0; i < reserverBodyAmount; i++) {

                                reserverBody.push(CLAIM, MOVE, MOVE)
                                reserverBodyTier++

                            }
                            var reserverBodyResult = reserverBody.slice(0, 6)
                        }
                        //Remote Defender
                        if (stage >= 3) {

                            let communeDefenderBodyAmount = Math.floor(capacityEnergy / 130)
                            let communeDefenderBody = []

                            var communeDefenderBodyTier = 0

                            for (let i = 0; i < communeDefenderBodyAmount; i++) {

                                communeDefenderBody.push(ATTACK, MOVE)
                                communeDefenderBodyTier++

                            }
                            communeDefenderBody.push(HEAL, MOVE)
                            var communeDefenderBodyResult = communeDefenderBody.slice(0, 20)
                        }
                        //Miner
                        if (stage >= 6) {

                            let minerBodyAmount = Math.floor(capacityEnergy / 450)
                            let minerBody = []

                            var minerBodyTier = 0

                            for (let i = 0; i < minerBodyAmount; i++) {

                                minerBody.push(WORK, WORK, MOVE, WORK, CARRY, MOVE)
                                minerBodyTier++

                            }
                            var minerBodyResult = minerBody.slice(0, 48)
                        }
                        //stationaryHauler
                        if (room.memory.baseLink != null) {

                            var stationaryHaulerBodyResult = [MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]

                            var stationaryHaulerBodyTier = 1
                        }
                        //Ranged Defender
                        if (stage >= 1) {

                            let rangedDefenderBodyAmount = Math.floor(capacityEnergy / 200)
                            let rangedDefenderBody = []

                            var rangedDefenderBodyTier = 0

                            for (let i = 0; i < rangedDefenderBodyAmount; i++) {

                                rangedDefenderBody.push(RANGED_ATTACK, MOVE)
                                rangedDefenderBodyTier++

                            }
                            var rangedDefenderBodyResult = rangedDefenderBody.slice(0, 50)
                        }
                        if (squadType == "ranged") {
                            if (stage <= 7) {

                                let antifaAssaulterBodyAmount = 1 //Math.floor(capacityEnergy / 200)
                                let antifaAssaulterBody = []

                                var antifaAssaulterBodyTier = 0

                                for (let i = 0; i < antifaAssaulterBodyAmount; i++) {

                                    antifaAssaulterBody.push(RANGED_ATTACK, MOVE)
                                    antifaAssaulterBodyTier++

                                }
                                var antifaAssaulterBodyResult = antifaAssaulterBody.slice(0, 50)

                                //Big Boy Member
                                let antifaSupporterBodyAmount = 1 //Math.floor(capacityEnergy / 300)
                                let antifaSupporterBody = []

                                var antifaSupporterBodyTier = 0

                                for (let i = 0; i < antifaSupporterBodyAmount; i++) {

                                    antifaSupporterBody.push(HEAL, MOVE)
                                    antifaSupporterBodyTier++

                                }
                                var antifaSupporterBodyResult = antifaSupporterBody.slice(0, 50)
                            }
                            //Big Boy Leader
                            else if (stage == 8) {

                                let antifaAssaulterBodyAmount = 1 //Math.floor(capacityEnergy / 5500)
                                let antifaAssaulterBody = []

                                var antifaAssaulterBodyTier = 0

                                for (let i = 0; i < antifaAssaulterBodyAmount; i++) {

                                    antifaAssaulterBody.push(RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaAssaulterBodyTier++

                                }
                                var antifaAssaulterBodyResult = antifaAssaulterBody.slice(0, 50)

                                //Big Boy Member
                                let antifaSupporterBodyAmount = 1 //Math.floor(capacityEnergy / 7500)
                                let antifaSupporterBody = []

                                var antifaSupporterBodyTier = 0

                                for (let i = 0; i < antifaSupporterBodyAmount; i++) {

                                    antifaSupporterBody.push(HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaSupporterBodyTier++

                                }
                                var antifaSupporterBodyResult = antifaSupporterBody.slice(0, 50)
                            }
                        } else if (squadType == "dismantle") {
                            //Big Boy Leader
                            if (stage == 8) {

                                let antifaAssaulterBodyAmount = 1 //Math.floor(capacityEnergy / 5500)
                                let antifaAssaulterBody = []

                                var antifaAssaulterBodyTier = 0

                                for (let i = 0; i < antifaAssaulterBodyAmount; i++) {

                                    antifaAssaulterBody.push(WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaAssaulterBodyTier++

                                }
                                var antifaAssaulterBodyResult = antifaAssaulterBody.slice(0, 50)

                                //Big Boy Member
                                let antifaSupporterBodyAmount = 1 //Math.floor(capacityEnergy / 7500)
                                let antifaSupporterBody = []

                                var antifaSupporterBodyTier = 0

                                for (let i = 0; i < antifaSupporterBodyAmount; i++) {

                                    antifaSupporterBody.push(HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaSupporterBodyTier++

                                }
                                var antifaSupporterBodyResult = antifaSupporterBody.slice(0, 50)
                            }
                        } else if (squadType == "attack") {
                            //Big Boy Leader
                            if (stage == 8) {

                                let antifaAssaulterBodyAmount = 1 //Math.floor(capacityEnergy / 5500)
                                let antifaAssaulterBody = []

                                var antifaAssaulterBodyTier = 0

                                for (let i = 0; i < antifaAssaulterBodyAmount; i++) {

                                    antifaAssaulterBody.push(ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaAssaulterBodyTier++

                                }
                                var antifaAssaulterBodyResult = antifaAssaulterBody.slice(0, 50)

                                //Big Boy Member
                                let antifaSupporterBodyAmount = 1 //Math.floor(capacityEnergy / 7500)
                                let antifaSupporterBody = []

                                var antifaSupporterBodyTier = 0

                                for (let i = 0; i < antifaSupporterBodyAmount; i++) {

                                    antifaSupporterBody.push(HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE)
                                    antifaSupporterBodyTier++

                                }
                                var antifaSupporterBodyResult = antifaSupporterBody.slice(0, 50)
                            }
                        }
                    }

                    //console.log(room.memory.minimumNumberOfrevolutionaryBuilders)
                    //If not enough energy for normal spawning

                    if (roomFix == true) {

                        console.log("Not enough creeps, " + room.name)

                        if (creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] < 1) {

                            name = spawn.createCreep(haulerBodyResult, 'rfGH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++

                        } else if (creepsOfRole[["harvester1", room.name]] < 1) {

                            name = spawn.createCreep(harvesterBodyResult, 'rfH, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester1"], { role: 'harvester1', working: false, target: 1, roomFrom: room.name });

                            creepCount["harvester1"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] < 2) {

                            name = spawn.createCreep(haulerBodyResult, 'rfGH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++

                        } else if (creepsOfRole[["harvester2", room.name]] < 1) {

                            name = spawn.createCreep(harvesterBodyResult, 'rfH, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester2"], { role: 'harvester2', working: false, target: 2, roomFrom: room.name });

                            creepCount["harvester2"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] < 3) {

                            name = spawn.createCreep(haulerBodyResult, 'rfGH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++

                        } else {
                            room.memory.roomFix = false
                        }
                    } else {

                        if (creepsOfRole[["harvester1", room.name]] < minCreeps["harvester1"]) {

                            name = spawn.createCreep(harvesterBodyResult, 'H, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester1"], { role: 'harvester1', working: false, target: 1, roomFrom: room.name });

                            creepCount["harvester1"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] < minCreeps["baseHauler"] * 0.5) {

                            name = spawn.createCreep(haulerBodyResult, 'BH, ' + "T" + haulerBodyTier + ", " + creepCount["baseHauler"], { role: 'baseHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["baseHauler"]++
                        } else if (creepsOfRole[["containerHauler", room.name]] < Math.floor(minCreeps["containerHauler"] * 0.5)) {

                            name = spawn.createCreep(haulerBodyResult, 'CH, ' + "T" + haulerBodyTier + ", " + creepCount["containerHauler"], { role: 'containerHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["containerHauler"]++
                        } else if (creepsOfRole[["harvester2", room.name]] < minCreeps["harvester2"]) {

                            name = spawn.createCreep(harvesterBodyResult, 'H, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester2"], { role: 'harvester2', working: false, target: 2, roomFrom: room.name });

                            creepCount["harvester2"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] < minCreeps["baseHauler"]) {

                            name = spawn.createCreep(haulerBodyResult, 'BH, ' + "T" + haulerBodyTier + ", " + creepCount["baseHauler"], { role: 'baseHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["baseHauler"]++
                        } else if (creepsOfRole[["containerHauler", room.name]] < minCreeps["containerHauler"]) {

                            name = spawn.createCreep(haulerBodyResult, 'CH, ' + "T" + haulerBodyTier + ", " + creepCount["containerHauler"], { role: 'containerHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["containerHauler"]++
                        } else if (creepsOfRole[["stationaryHauler", room.name]] < minCreeps["stationaryHauler"]) {

                            name = spawn.createCreep(stationaryHaulerBodyResult, 'SH, ' + "T" + stationaryHaulerBodyTier + ", " + creepCount["stationaryHauler"], { role: 'stationaryHauler', isFull: false, roomFrom: room.name });

                            creepCount["stationaryHauler"]++
                        } else if (creepsOfRole[["upgrader", room.name]] < minCreeps["upgrader"]) {

                            name = spawn.createCreep(upgraderBodyResult, 'Ug, ' + "T" + upgraderBodyTier + ", " + creepCount["upgrader"], { role: 'upgrader', isFull: false, roomFrom: room.name });

                            creepCount["upgrader"]++
                        } else if (creepsOfRole[["builder", room.name]] < minCreeps["builder"]) {

                            name = spawn.createCreep(builderBodyResult, 'Bd, ' + "T" + builderBodyTier + ", " + creepCount["builder"], { role: 'builder', isFull: false, roomFrom: room.name });

                            creepCount["builder"]++
                        } else if (creepsOfRole[["repairer", room.name]] < minCreeps["repairer"]) {

                            name = spawn.createCreep(builderBodyResult, 'Bd, ' + "T" + builderBodyTier + ", " + creepCount["repairer"], { role: 'repairer', isFull: false, roomFrom: room.name });

                            creepCount["repairer"]++
                        } else if (creepsOfRole[["rangedDefender", room.name]] < minCreeps["rangedDefender"] /*room.memory.minimumNumberOfRangedDefenders*/ && hostileAttacker) {

                            name = spawn.createCreep(rangedDefenderBodyResult, 'RaD, ' + "T" + rangedDefenderBodyTier + ", " + creepCount["rangedDefender"], { role: 'rangedDefender', roomFrom: room.name });

                            creepCount["rangedDefender"]++
                        } else if (creepsOfRole[["upgradeHauler", room.name]] < minCreeps["upgradeHauler"]) {

                            name = spawn.createCreep(haulerBodyResult, 'UH, ' + "T" + haulerBodyTier + ", " + creepCount["upgradeHauler"], { role: 'upgradeHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["upgradeHauler"]++
                        } else if (creepsOfRole[["barricadeUpgrader", room.name]] < minCreeps["barricadeUpgrader"]) {

                            name = spawn.createCreep(barricadeUpgraderBodyResult, 'BR, ' + "T" + barricadeUpgraderBodyTier + ", " + creepCount["barricadeUpgrader"], { role: 'barricadeUpgrader', isFull: false, roomFrom: room.name });

                            creepCount["barricadeUpgrader"]++
                        } else if (creepsOfRole[["scientist", room.name]] < minCreeps["scientist"]
                            /* && Memory.global.globalStage >= 1*/
                        ) {

                            name = spawn.createCreep([CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], 'Si, ' + "T" + 1 + ", " + creepCount["scientist"], { role: 'scientist', emptyStore: true, roomFrom: room.name });

                            creepCount["scientist"]++
                        } else if (creepsOfRole[["miner", room.name]] < minCreeps["miner"]) {

                            name = spawn.createCreep(minerBodyResult, 'Mi, ' + "T" + minerBodyTier + ", " + creepCount["miner"], { role: 'miner', mining: true, roomFrom: room.name });

                            creepCount["miner"]++
                        } else if (creepsOfRole[["robber", room.name]] < minCreeps["robber"]) {

                            name = spawn.createCreep(remoteHaulerBodyResult, 'Ro, ' + "T" + remoteHaulerBodyTier + ", " + creepCount["robber"], { role: 'robber', isFull: false, roomFrom: room.name });

                            creepCount["robber"]++
                        } else if (creepsOfRole[["communeDefender", room.name]] < minCreeps["communeDefender"]) {

                            name = spawn.createCreep(communeDefenderBodyResult, 'CD, ' + "T" + communeDefenderBodyTier + ", " + creepCount["communeDefender"], { role: 'communeDefender', roomFrom: room.name });

                            creepCount["communeDefender"]++
                        } else if (creepsOfRole[["scout", room.name]] < minCreeps["scout"]) {

                            name = spawn.createCreep([MOVE], 'Sc, ' + "T" + 1 + ", " + creepCount["scout"], { role: 'scout', roomFrom: room.name });

                            creepCount["scout"]++
                        } else if (creepsOfRole[["claimer", room.name]]) {

                            name = spawn.createCreep([CLAIM, MOVE], 'Ca, ' + "T" + 1 + ", " + creepCount["claimer"], { role: 'claimer', target: claimerTarget, roomFrom: room.name });

                            creepCount["claimer"]++
                        } else if (creepsOfRole[["revolutionaryBuilder", room.name]] < minCreeps["revolutionaryBuilder"]) {

                            name = spawn.createCreep(revolutionaryBuilderBodyResult, 'SB, ' + "T" + revolutionaryBuilderBodyTier + ", " + creepCount["revolutionaryBuilder"], { role: 'revolutionaryBuilder', isFull: false, target: builderTarget, roomFrom: room.name });

                            creepCount["revolutionaryBuilder"]++
                        } else if (creepsOfRole[["remoteBuilder", room.name]] < minCreeps["remoteBuilder"]) {

                            name = spawn.createCreep(remoteBuilderBodyResult, 'RB, ' + "T" + remoteBuilderBodyTier + ", " + creepCount["remoteBuilder"], { role: 'remoteBuilder', roomFrom: room.name });

                            creepCount["remoteBuilder"]++
                        } else {

                            if (creepsOfRole[["antifaAssaulter", room.name]] < minCreeps["antifaAssaulter"]) {

                                name = spawn.createCreep(antifaAssaulterBodyResult, 'antifaAssaulter, ' + "T" + antifaAssaulterBodyTier + ", " + squadType + ", " + creepCount["antifaAssaulter"], { role: 'antifaAssaulter', squadType: squadType, attacking: false, roomFrom: room.name });

                                creepCount["antifaAssaulter"]++
                            } else if (creepsOfRole[["antifaSupporter", room.name]] < minCreeps["antifaSupporter"]) {

                                name = spawn.createCreep(antifaSupporterBodyResult, 'antifaSupporter, ' + "T" + antifaSupporterBodyTier + ", " + squadType + ", " + creepCount["antifaSupporter"], { role: 'antifaSupporter', squadType: squadType, attacking: false, roomFrom: room.name });

                                creepCount["antifaSupporter"]++
                            } else {

                                for (let remoteRoom of remoteRooms) {

                                    var numberOfRemoteHarvesters1 = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHarvester1' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    var numberOfRemoteHarvesters2 = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHarvester2' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfRemoteHarvesters1 < minCreeps["remoteHarvester1"]) {

                                        name = spawn.createCreep(remoteHarvesterBodyResult, 'RHa, ' + "T" + remoteHarvesterBodyTier + ", " + creepCount["remoteHarvester1"], { role: 'remoteHarvester1', remoteRoom: remoteRoom.name, target: 1, roomFrom: room.name });

                                        creepCount["remoteHarvester1"]++
                                    } else if (remoteRoom.sources == 2 && numberOfRemoteHarvesters2 < minCreeps["remoteHarvester2"]) {

                                        name = spawn.createCreep(remoteHarvesterBodyResult, 'RHa, ' + "T" + remoteHarvesterBodyTier + ", " + creepCount["remoteHarvester2"], { role: 'remoteHarvester2', remoteRoom: remoteRoom.name, target: 2, roomFrom: room.name });

                                        creepCount["remoteHarvester2"]++
                                    }

                                    var numberOfRemoteHaulers = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHauler' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfRemoteHaulers < minCreeps["remoteHauler"] * remoteRoom.sources) {

                                        name = spawn.createCreep(remoteHaulerBodyResult, 'RHau, ' + "T" + remoteHaulerBodyTier + ", " + creepCount["remoteHauler"], { role: 'remoteHauler', remoteRoom: remoteRoom.name, fullEnergy: false, roomFrom: room.name });

                                        creepCount["remoteHauler"]++
                                    }

                                    var numberOfReservers = _.sum(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfReservers < minCreeps["reserver"]) {

                                        name = spawn.createCreep(reserverBodyResult, 'Rs, ' + "T" + reserverBodyTier + ", " + creepCount["reserver"], { role: 'reserver', remoteRoom: remoteRoom.name, roomFrom: room.name });

                                        creepCount["reserver"]++
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }
};