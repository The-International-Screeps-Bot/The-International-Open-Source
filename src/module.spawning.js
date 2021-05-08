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

            //var claimerTarget = "E33N2"
            var claimerTarget = undefined
                //var builderTarget = "E33N2"
            var builderTarget = undefined
        } else {

            //var claimerTarget = "E31N14"
            var claimerTarget = undefined
                //var builderTarget = "E31N14"
            var builderTarget = undefined
        }

        let target2 = Game.flags.AR
        let target3 = Game.flags.RA
        let target4 = Game.flags.S
        var target5 = Game.flags.H
        let target6 = Game.flags.BB
        let target7 = Game.flags.BR
        let target8 = Game.flags.RDP
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
                let roomConstructionSite = room.find(FIND_CONSTRUCTION_SITES)
                let repairStructure = room.find(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_ROAD && s.structureType == STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.35
                })

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

                    if (spawn.spawning) {
                        var spawningCreep = Game.creeps[spawn.spawning.name]
                        spawn.room.visual.text(
                            '🛠️' + spawningCreep.memory.role,
                            spawn.pos.x,
                            spawn.pos.y - 2, { align: 'center' })
                    }

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

                            name = spawn.createCreep(harvesterBodyResult, 'rfH, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester2"], { role: 'harvester1', working: false, target: 2, roomFrom: room.name });

                            creepCount["harvester2"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] + creepsOfRole[["containerHauler", room.name]] + creepsOfRole[["generalHauler", room.name]] < 3) {

                            name = spawn.createCreep(haulerBodyResult, 'rfGH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++

                        } else {
                            room.memory.roomFix = false
                        }
                    } else {

                        if (creepsOfRole[["harvester1", room.name]] < room.memory.minimumNumberOfHarvesters1) {

                            name = spawn.createCreep(harvesterBodyResult, 'H, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester1"], { role: 'harvester1', working: false, target: 1, roomFrom: room.name });

                            creepCount["harvester1"]++
                        } else if (creepsOfRole[["generalHauler", room.name]] < room.memory.minimumNumberOfGeneralHaulers * 0.5) {

                            name = spawn.createCreep(haulerBodyResult, 'GH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] < 1) {

                            name = spawn.createCreep(haulerBodyResult, 'BH, ' + "T" + haulerBodyTier + ", " + creepCount["baseHauler"], { role: 'baseHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["baseHauler"]++
                        } else if (creepsOfRole[["containerHauler", room.name]] < room.memory.minimumNumberOfContainerHaulers) {

                            name = spawn.createCreep(haulerBodyResult, 'CH, ' + "T" + haulerBodyTier + ", " + creepCount["containerHauler"], { role: 'containerHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["containerHauler"]++
                        } else if (creepsOfRole[["harvester2", room.name]] < room.memory.minimumNumberOfHarvesters2) {

                            name = spawn.createCreep(harvesterBodyResult, 'H, ' + "T" + harvesterBodyTier + ", " + creepCount["harvester2"], { role: 'harvester2', working: false, target: 2, roomFrom: room.name });

                            creepCount["harvester2"]++
                        } else if (creepsOfRole[["generalHauler", room.name]] < room.memory.minimumNumberOfGeneralHaulers) {

                            name = spawn.createCreep(haulerBodyResult, 'GH, ' + "T" + haulerBodyTier + ", " + creepCount["generalHauler"], { role: 'generalHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["generalHauler"]++
                        } else if (creepsOfRole[["baseHauler", room.name]] < room.memory.minimumNumberOfBaseHaulers) {

                            name = spawn.createCreep(haulerBodyResult, 'BH, ' + "T" + haulerBodyTier + ", " + creepCount["baseHauler"], { role: 'baseHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["baseHauler"]++
                        } else if (creepsOfRole[["stationaryHauler", room.name]] < room.memory.minimumNumberOfstationaryHaulers) {

                            name = spawn.createCreep(stationaryHaulerBodyResult, 'SH, ' + "T" + stationaryHaulerBodyTier + ", " + creepCount["stationaryHauler"], { role: 'stationaryHauler', isFull: false, roomFrom: room.name });

                            creepCount["stationaryHauler"]++
                        } else if (creepsOfRole[["upgrader", room.name]] < room.memory.minimumNumberOfUpgraders) {

                            name = spawn.createCreep(upgraderBodyResult, 'Ug, ' + "T" + upgraderBodyTier + ", " + creepCount["upgrader"], { role: 'upgrader', isFull: false, roomFrom: room.name });

                            creepCount["upgrader"]++
                        } else if (creepsOfRole[["builder", room.name]] < room.memory.minimumNumberOfBuilders && roomConstructionSite.length >= 1) {

                            name = spawn.createCreep(builderBodyResult, 'Bd, ' + "T" + builderBodyTier + ", " + creepCount["builder"], { role: 'builder', isFull: false, roomFrom: room.name });

                            creepCount["builder"]++
                        } else if (creepsOfRole[["repairer", room.name]] < room.memory.minimumNumberOfRepairers && repairStructure) {

                            name = spawn.createCreep(builderBodyResult, 'Bd, ' + "T" + builderBodyTier + ", " + creepCount["repairer"], { role: 'repairer', isFull: false, roomFrom: room.name });

                            creepCount["repairer"]++
                        } else if (creepsOfRole[["rangedDefender", room.name]] < 1 /*room.memory.minimumNumberOfRangedDefenders*/ && hostileAttacker) {

                            name = spawn.createCreep(rangedDefenderBodyResult, 'RaD, ' + "T" + rangedDefenderBodyTier + ", " + creepCount["rangedDefender"], { role: 'rangedDefender', roomFrom: room.name });

                            creepCount["rangedDefender"]++
                        } else if (creepsOfRole[["upgradeHauler", room.name]] < room.memory.minimumNumberOfUpgradeHaulers) {

                            name = spawn.createCreep(haulerBodyResult, 'UH, ' + "T" + haulerBodyTier + ", " + creepCount["upgradeHauler"], { role: 'upgradeHauler', fullEnergy: false, roomFrom: room.name });

                            creepCount["upgradeHauler"]++
                        } else if (creepsOfRole[["barricadeUpgrader", room.name]] < room.memory.minimumNumberOfbarricadeUpgraders) {

                            name = spawn.createCreep(barricadeUpgraderBodyResult, 'BR, ' + "T" + barricadeUpgraderBodyTier + ", " + creepCount["barricadeUpgrader"], { role: 'barricadeUpgrader', isFull: false, roomFrom: room.name });

                            creepCount["barricadeUpgrader"]++
                        } else if (creepsOfRole[["scientist", room.name]] < room.memory.minimumNumberOfScientists
                            /* && Memory.global.globalStage >= 1*/
                        ) {

                            name = spawn.createCreep([CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE], 'Si, ' + "T" + 1 + ", " + creepCount["scientist"], { role: 'scientist', emptyStore: true, roomFrom: room.name });

                            creepCount["scientist"]++
                        } else if (creepsOfRole[["miner", room.name]] < room.memory.minimumNumberOfMiners && roomMineral && roomExtractor && Memory.global.globalStage >= 1) {

                            name = spawn.createCreep(minerBodyResult, 'Mi, ' + "T" + minerBodyTier + ", " + creepCount["miner"], { role: 'miner', mining: true, roomFrom: room.name });

                            creepCount["miner"]++
                        } else if (creepsOfRole[["robber", room.name]] < room.memory.minimumNumberOfRobbers && target9) {

                            name = spawn.createCreep(remoteHaulerBodyResult, 'Ro, ' + "T" + robberBodyTier + ", " + creepCount["robber"], { role: 'robber', isFull: false, roomFrom: room.name });

                            creepCount["robber"]++
                        } else if (creepsOfRole[["communeDefender", room.name]] < room.memory.minimumNumberOfcommuneDefenders && remoteEnemy == true) {

                            name = spawn.createCreep(communeDefenderBodyResult, 'CD, ' + "T" + communeDefenderBodyTier + ", " + creepCount["communeDefender"], { role: 'communeDefender', roomFrom: room.name });

                            creepCount["communeDefender"]++
                        } else if (creepsOfRole[["scout", room.name]] < room.memory.minimumNumberOfScouts && target4) {

                            name = spawn.createCreep([MOVE], 'Sc, ' + "T" + 1 + ", " + creepCount["scout"], { role: 'scout', roomFrom: room.name });

                            creepCount["scout"]++
                        } else if (creepsOfRole[["claimer", room.name]] < 1 && claimerTarget && room == communeEstablisher) {

                            name = spawn.createCreep([CLAIM, MOVE], 'Ca, ' + "T" + 1 + ", " + creepCount["claimer"], { role: 'claimer', target: claimerTarget, roomFrom: room.name });

                            creepCount["claimer"]++
                        } else if (creepsOfRole[["revolutionaryBuilder", room.name]] < room.memory.minimumNumberOfrevolutionaryBuilders && builderTarget && room == communeEstablisher) {

                            name = spawn.createCreep(revolutionaryBuilderBodyResult, 'SB, ' + "T" + revolutionaryBuilderBodyTier + ", " + creepCount["revolutionaryBuilder"], { role: 'revolutionaryBuilder', isFull: false, target: builderTarget, roomFrom: room.name });

                            creepCount["revolutionaryBuilder"]++
                        } else if (creepsOfRole[["remoteBuilder", room.name]] < room.memory.minimumNumberOfRemoteBuilders && remoteBuilderNeed == true) {

                            name = spawn.createCreep(remoteBuilderBodyResult, 'RB, ' + "T" + remoteBuilderBodyTier + ", " + creepCount["remoteBuilder"], { role: 'remoteBuilder', roomFrom: room.name });

                            creepCount["remoteBuilder"]++
                        } else {

                            if (creepsOfRole[["antifaAssaulter", room.name]] < creepsOfRole[["antifaSupporter", room.name]] && target6) {

                                name = spawn.createCreep(antifaAssaulterBodyResult, 'antifaAssaulter, ' + "T" + antifaAssaulterBodyTier + ", " + squadType + ", " + creepCount["antifaAssaulter"], { role: 'antifaAssaulter', squadType: squadType, attacking: false, roomFrom: room.name });

                                creepCount["antifaAssaulter"]++
                            } else if (creepsOfRole[["antifaSupporter", room.name]] < room.memory.minimumNumberOfantifaSupporters && target6) {

                                name = spawn.createCreep(antifaSupporterBodyResult, 'antifaSupporter, ' + "T" + antifaSupporterBodyTier + ", " + squadType + ", " + creepCount["antifaSupporter"], { role: 'antifaSupporter', squadType: squadType, attacking: false, roomFrom: room.name });

                                creepCount["antifaSupporter"]++
                            } else {

                                for (let remoteRoom of remoteRooms) {

                                    var numberOfRemoteHarvesters1 = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHarvester1' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    var numberOfRemoteHarvesters2 = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHarvester2' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfRemoteHarvesters1 < room.memory.minimumNumberOfRemoteHarvesters1) {

                                        name = spawn.createCreep(remoteHarvesterBodyResult, 'RHa, ' + "T" + remoteHarvesterBodyTier + ", " + creepCount["remoteHarvester1"], { role: 'remoteHarvester1', remoteRoom: remoteRoom.name, target: 1, roomFrom: room.name });

                                        creepCount["remoteHarvester1"]++
                                    } else if (remoteRoom.sources == 2 && numberOfRemoteHarvesters2 < room.memory.minimumNumberOfRemoteHarvesters2) {

                                        name = spawn.createCreep(remoteHarvesterBodyResult, 'RHa, ' + "T" + remoteHarvesterBodyTier + ", " + creepCount["remoteHarvester2"], { role: 'remoteHarvester2', remoteRoom: remoteRoom.name, target: 2, roomFrom: room.name });

                                        creepCount["remoteHarvester2"]++
                                    }

                                    var numberOfRemoteHaulers = _.sum(Game.creeps, (c) => c.memory.role == 'remoteHauler' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfRemoteHaulers < room.memory.minimumNumberOfRemoteHaulers * remoteRoom.sources) {

                                        name = spawn.createCreep(remoteHaulerBodyResult, 'RHau, ' + "T" + remoteHaulerBodyTier + ", " + creepCount["remoteHauler"], { role: 'remoteHauler', remoteRoom: remoteRoom.name, fullEnergy: false, roomFrom: room.name });

                                        creepCount["remoteHauler"]++
                                    }

                                    var numberOfReservers = _.sum(Game.creeps, (c) => c.memory.role == 'reserver' && c.memory.remoteRoom == remoteRoom.name && creep.memory.dying != true)

                                    if (numberOfReservers < room.memory.minimumNumberOfReservers) {

                                        name = spawn.createCreep(reserverBodyResult, 'Rs, ' + "T" + reserverBodyTier + ", " + creepCount["reserver"], { role: 'reserver', remoteRoom: remoteRoom.name, roomFrom: room.name });

                                        creepCount["reserver"]++
                                    }
                                }
                            }
                        }
                    }
                }

                var minRemoteHarvesters1 = room.memory.minimumNumberOfRemoteHarvesters1 = 1
                var minRemoteHarvesters2 = room.memory.minimumNumberOfRemoteHarvesters2 = 1
                var minRemoteHaulers = room.memory.minimumNumberOfRemoteHaulers = 1
                var minReservers = room.memory.minimumNumberOfReservers = 1

                var minRemoteBuilders = room.memory.minimumNumberOfRemoteBuilders = 1
                var mincommuneDefenders = room.memory.minimumNumberOfcommuneDefenders = 1

                var squads = 0

                if (room.name == "E18S1") {

                    squads = 4
                }

                var minantifaAssaulters = room.memory.minimumNumberOfantifaAssaulters = squads
                var minantifaSupporters = room.memory.minimumNumberOfantifaSupporters = squads

                if (stage <= 3) {

                    room.memory.minimumNumberOfRepairers = 1
                } else {

                    room.memory.minimumNumberOfRepairers = 0
                }

                //RCL 1
                if (stage == 1) {
                    room.memory.minimumNumberOfHarvesters1 = 3

                    room.memory.minimumNumberOfHarvesters2 = 3

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 2

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 3

                    room.memory.minimumNumberOfUpgraders = 4

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 0

                    room.memory.minimumNumberOfcommuneDefenders = 0

                    minRemoteHarvesters1 * 2

                    minRemoteHarvesters2 * 2

                    minRemoteHaulers * 2

                    room.memory.minimumNumberOfReservers = 0

                    room.memory.minimumNumberOfRemoteBuilders = 0

                    room.memory.minimumNumberOfantifaSupporters = 0

                    room.memory.minimumNumberOfantifaAssaulters = 0

                    room.memory.minimumNumberOfRangedDefenders = 0

                    room.memory.minimumNumberOfMiners = 0

                    room.memory.minimumNumberOfScouts = 1

                }
                //RCL 2
                if (stage == 2) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 2

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 3

                    room.memory.minimumNumberOfUpgraders = 3

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 0

                    room.memory.minimumNumberOfcommuneDefenders = 0

                    minRemoteHarvesters1 * 2

                    minRemoteHarvesters2 * 2

                    minRemoteHaulers * 2

                    room.memory.minimumNumberOfReservers = 0

                    minRemoteBuilders

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 0

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1

                }
                //RCL 3
                if (stage == 3) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 1

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 2

                    room.memory.minimumNumberOfUpgraders = 3

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 0

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2 * 2

                    minRemoteHaulers * 2

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 0

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1

                }
                //RCL 4
                if (stage == 4) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 2

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 1

                    room.memory.minimumNumberOfUpgraders = 2

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 1

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2 * 2

                    minRemoteHaulers * 2

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 0

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1

                }
                //RCL 5
                if (stage == 5) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 1

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 1

                    room.memory.minimumNumberOfUpgraders = 2

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 1

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2

                    minRemoteHaulers

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRobbers = 0

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 0

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1

                }
                //RCL 6
                if (stage == 6) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 1

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 1

                    room.memory.minimumNumberOfUpgraders = 1

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 1

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2

                    minRemoteHaulers

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRobbers = 1

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 1

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1
                }
                //RCL 7
                if (stage == 7) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 0

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 1

                    room.memory.minimumNumberOfUpgraders = 1

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 1

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2

                    minRemoteHaulers

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRobbers = 1

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 1

                    room.memory.minimumNumberOfScientists = 1

                    room.memory.minimumNumberOfstationaryHaulers = 1

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1
                }
                //RCL 8
                if (stage == 8) {
                    room.memory.minimumNumberOfHarvesters1 = 1

                    room.memory.minimumNumberOfHarvesters2 = 1

                    room.memory.minimumNumberOfBaseHaulers = 2

                    room.memory.minimumNumberOfContainerHaulers = 0

                    room.memory.minimumNumberOfGeneralHaulers = 0

                    room.memory.minimumNumberOfBuilders = 1

                    room.memory.minimumNumberOfUpgraders = 1

                    room.memory.minimumNumberOfrevolutionaryBuilders = 4

                    room.memory.minimumNumberOfbarricadeUpgraders = 1

                    mincommuneDefenders

                    minRemoteHarvesters1

                    minRemoteHarvesters2

                    minRemoteHaulers

                    minReservers

                    minRemoteBuilders

                    room.memory.minimumNumberOfRobbers = 1

                    room.memory.minimumNumberOfRangedDefenders = 2

                    room.memory.minimumNumberOfMiners = 1

                    room.memory.minimumNumberOfScientists = 1

                    room.memory.minimumNumberOfstationaryHaulers = 1

                    minantifaSupporters

                    minantifaAssaulters

                    room.memory.minimumNumberOfScouts = 1
                }

                if (room.storage && room.storage.store[RESOURCE_ENERGY] >= 275000 && stage <= 7) {

                    room.memory.minimumNumberOfUpgraders = 2
                }
                if (room.terminal && room.terminal.store[RESOURCE_ENERGY] >= 80000 && stage <= 7) {

                    room.memory.minimumNumberOfUpgradeHaulers = 1
                    room.memory.minimumNumberOfUpgraders = 2
                } else {

                    room.memory.minimumNumberOfUpgradeHaulers = 0
                }
            }
        })
    }
};