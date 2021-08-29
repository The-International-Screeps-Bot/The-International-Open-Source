let creepData = require("creepData")

function spawnRequests(room, spawns) {

    // Import variables we need

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

        for (let remoteRoomName in room.memory.remoteRooms) {

            if (!creepsOfRemoteRole[[role, remoteRoomName]]) {

                creepsOfRemoteRole[[role, remoteRoomName]] = 0
            }
        }
    }

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

        Memory.global.lastDefence.attacker = hostiles[0].owner.username
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

    let energyAvailable = room.energyAvailable
    let energyCapacity = room.energyCapacityAvailable

    let stage = room.memory.stage

    if (energyCapacity >= 10300) {

        room.memory.stage = 8

    } else if (energyCapacity >= 5300) {

        room.memory.stage = 7

    } else if (energyCapacity >= 2300) {

        room.memory.stage = 6

    } else if (energyCapacity >= 1800) {

        room.memory.stage = 5

    } else if (energyCapacity >= 1300) {

        room.memory.stage = 4

    } else if (energyCapacity >= 800) {

        room.memory.stage = 3

    } else if (energyCapacity >= 550) {

        room.memory.stage = 2

    } else if (energyCapacity >= 300) {

        room.memory.stage = 1

    }

    let controller = room.get("controller")
    let storage = room.get("storage")
    let terminal = room.get("terminal")

    let source1HarvestPositionsAmount = room.get("source1HarvestPositions").positions.length
    let source2HarvestPositionsAmount = room.get("source2HarvestPositions").positions.length

    let baseLink = room.get("baseLink")


    let controllerContainer = room.get("controllerContainer")

    // Define min creeps for each role

    let minCreeps = {}

    for (let role of rolesList) {

        minCreeps[role] = 0
    }

    switch (stage) {
        case 1:

            minCreeps["hauler"] = 4
            break
        case 2:

            minCreeps["hauler"] = 6
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

    if (stage >= 7) {

        minCreeps["hauler"] = 2

    } else if (stage >= 4) {


        minCreeps["hauler"] = 3
    } else {

        minCreeps["hauler"] = 4
    }

    if (energyCapacity >= 550) {

        minCreeps["harvester"] = 2

    } else {

        if (creepsOfRole[["hauler", room.name]] > 0) {

            minCreeps["harvester"] = Math.min(source1HarvestPositionsAmount, 2) + Math.min(source2HarvestPositionsAmount, 2)

        } else {

            minCreeps["harvester"] = 1
        }
    }

    (function() {

        if (storage && storage.store[RESOURCE_ENERGY] <= 20000) {

            return
        }

        if (Memory.global.attackingRoom == room.name) {

            minCreeps["antifaAssaulter"] = 4
            minCreeps["antifaSupporter"] = minCreeps["antifaAssaulter"]
        }
    })()

    if (roomConstructionSite.length > 0) {
        if (!storage) {

            if (energyCapacity >= 1300) {

                minCreeps["builder"] = 3

            } else if (energyCapacity >= 800) {

                minCreeps["builder"] = 3

            } else if (energyCapacity >= 600) {

                minCreeps["builder"] = 4

            } else if (energyCapacity >= 300) {

                minCreeps["builder"] = 7
            }
        } else if (storage && storage.store[RESOURCE_ENERGY] >= 40000) {

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

    if (!storage) {

        if (energyCapacity >= 1800) {

            minCreeps["upgrader"] = 2

        } else if (energyCapacity >= 1300) {

            minCreeps["upgrader"] = 3

        } else if (energyCapacity >= 800) {

            minCreeps["upgrader"] = 4

        } else if (energyCapacity >= 550) {

            minCreeps["upgrader"] = 4

        } else if (energyCapacity >= 300) {

            minCreeps["upgrader"] = 6
        }
    } else if (storage) {

        if (stage <= 5) {

            minCreeps["upgrader"] = 2

        } else {

            minCreeps["upgrader"] = 1
        }
    }

    if (barricadesToUpgrade.length > 0) {
        if (!storage) {

            minCreeps["rampartUpgrader"] = 1

        } else {
            if (storage.store[RESOURCE_ENERGY] >= 200000) {

                minCreeps["rampartUpgrader"] = 3

            } else if (storage.store[RESOURCE_ENERGY] >= 30000) {

                minCreeps["rampartUpgrader"] = 1
            }

            if (hostiles.length > 0 && room.get("storedEnergy") > 10000 && creepsOfRole[["meleeDefender", room.name]] > 0) {

                minCreeps["rampartUpgrader"] += 2
            }
        }
    }

    if (baseLink) {

        minCreeps["stationaryHauler"] = 1
    }

    if (hostiles.length > 0) {

        minCreeps["rangedDefender"] = 0

        minCreeps["meleeDefender"] = 2
    }

    if (Game.flags.R && stage >= 4) {
        minCreeps["robber"] = 2
    }

    if (repairStructure.length > 0) {

        minCreeps["repairer"] = 1
    }

    if (Memory.global.communeEstablisher == room.name) {

        if (storage && storage.store[RESOURCE_ENERGY] >= 20000) {

            minCreeps["claimer"] = 1
        } else {

            minCreeps["claimer"] = 1
        }
    }

    if (Memory.global.communeEstablisher == room.name) {

        if (storage && storage.store[RESOURCE_ENERGY] >= 20000) {

            minCreeps["revolutionaryBuilder"] = 4
        } else {

            minCreeps["revolutionaryBuilder"] = 4
        }
    }

    if (storage && storage.store[RESOURCE_ENERGY] >= 35000 && mineralContainer != null && roomExtractor.length > 0 && roomMineral.length > 0) {

        minCreeps["miner"] = 1
    }

    minCreeps["scout"] = 1

    if (stage >= 4) {

        minCreeps["remoteBuilder"] = 1 + Math.floor(Object.values(room.memory.remoteRooms).length / 3)
    }

    if (stage >= 3) {

        minCreeps["communeDefender"] = 1
    }

    if (!storage || (room.get("storedEnergy") > 15000)) {

        for (let remoteRoomName in room.memory.remoteRooms) {

            let remoteRoom = room.memory.remoteRooms[remoteRoomName]

            if (energyCapacity >= 1800) {

                minCreeps["reserver"] += 1

                minCreeps["remoteHarvester1"] += 1

                if (remoteRoom.sources.length == 2) minCreeps["remoteHarvester2"] += 1

                minCreeps["remoteHauler"] += remoteRoom.sources.length

                continue
            }
            if (energyCapacity >= 800) {

                minCreeps["reserver"] += 1

                minCreeps["remoteHarvester1"] += 1

                if (remoteRoom.sources.length == 2) minCreeps["remoteHarvester2"] += 1

                minCreeps["remoteHauler"] += remoteRoom.sources.length * 2

                continue
            }
            if (energyCapacity >= 550) {

                minCreeps["remoteHarvester1"] += 1

                if (remoteRoom.sources.length == 2) minCreeps["remoteHarvester2"] += 1

                minCreeps["remoteHauler"] += remoteRoom.sources.length * 2

                continue
            }
            if (energyCapacity >= 300) {

                minCreeps["remoteHarvester1"] += 2

                if (remoteRoom.sources.length == 2) minCreeps["remoteHarvester2"] += 2

                minCreeps["remoteHauler"] += remoteRoom.sources.length * 2

                continue
            }
        }
    }

    if (energyCapacity >= 550) {
        if (room.memory.roomfix) {

            if (storage) {
                if (storage.store[RESOURCE_ENERGY] < 1000) {

                    minCreeps["jumpStarter"] = 2
                }
            } else if (energyCapacity == 300) {

                minCreeps["jumpStarter"] = 1

            } else {

                minCreeps["jumpStarter"] = 2
            }
        }
    } else {

        minCreeps["jumpStarter"] = 1
    }

    if (storage && storage.store[RESOURCE_ENERGY] >= 175000 && room.controller.level <= 7) {

        minCreeps["upgrader"] += 1
    }
    if (terminal && terminal.store[RESOURCE_ENERGY] >= 80000 && room.controller.level <= 7) {

        minCreeps["upgradeHauler"] = 1
        minCreeps["upgrader"] += 2
    }

    let requiredCreeps = {}

    for (let role of rolesList) {

        requiredCreeps[role] = minCreeps[role] - creepsOfRole[[role, room.name]]

        if (requiredCreeps[role] > 0) {

            console.log(role + ", " + requiredCreeps[role] + ", " + room.name)
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

    let minRemoteCreeps = {}

    for (let remoteRoomName in room.memory.remoteRooms) {

        let remoteRoom = room.memory.remoteRooms[remoteRoomName]

        if (energyCapacity >= 1800) {

            minRemoteCreeps[["reserver", remoteRoomName]] = 1

            minRemoteCreeps[["remoteHarvester1", remoteRoomName]] = 1

            if (remoteRoom.sources.length == 2) minRemoteCreeps[["remoteHarvester2", remoteRoomName]] = 1

            minRemoteCreeps[["remoteHauler", remoteRoomName]] = remoteRoom.sources.length

            continue
        }
        if (energyCapacity >= 800) {

            minRemoteCreeps[["reserver", remoteRoomName]] = 1

            minRemoteCreeps[["remoteHarvester1", remoteRoomName]] = 1

            if (remoteRoom.sources.length == 2) minRemoteCreeps[["remoteHarvester2", remoteRoomName]] = 1

            minRemoteCreeps[["remoteHauler", remoteRoomName]] = remoteRoom.sources.length * 2

            continue
        }
        if (energyCapacity >= 550) {

            minRemoteCreeps[["remoteHarvester1", remoteRoomName]] = 2

            if (remoteRoom.sources.length == 2) minRemoteCreeps[["remoteHarvester2", remoteRoomName]] = 2

            minRemoteCreeps[["remoteHauler", remoteRoomName]] = remoteRoom.sources.length * 2

            continue
        }
        if (energyCapacity >= 300) {

            minRemoteCreeps[["remoteHarvester1", remoteRoomName]] = 2

            if (remoteRoom.sources.length == 2) minRemoteCreeps[["remoteHarvester2", remoteRoomName]] = 2

            minRemoteCreeps[["remoteHauler", remoteRoomName]] = remoteRoom.sources.length * 2

            continue
        }
    }

    let requiredRemoteCreeps = {}

    for (let role of remoteRoles) {

        for (let remoteRoomName in room.memory.remoteRooms) {

            if (minRemoteCreeps[[role, remoteRoomName]] > creepsOfRemoteRole[[role, remoteRoomName]]) {

                requiredRemoteCreeps[[role, remoteRoomName]] = minRemoteCreeps[[role, remoteRoomName]] - creepsOfRemoteRole[[role, remoteRoomName]]

                console.log(role + ", " + requiredRemoteCreeps[[role, remoteRoomName]] + ", " + remoteRoomName)
            }
        }
    }

    function findRemoteRoom(role) {

        for (let remoteRoomName in room.memory.remoteRooms) {

            if (requiredRemoteCreeps[[role, remoteRoomName]] > 0) return remoteRoomName
        }

        return false
    }

    let boostedSquads = false

    let squadTypes = {
        rangedAttack: "rangedAttack",
        attack: "attack",
        dismantle: "dismantle",
    }

    let squadType = squadTypes.rangedAttack

    // Find spawning structures

    let energyStructures = findSpawningStructures()

    function findSpawningStructures() {

        const anchorPoint = room.get("anchorPoint")

        // Get array of spawningStructures

        let spawnStructures = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN
        })

        // Add each spawnStructures with their range to the object

        let spawnStructuresWithRanges = {}

        for (let spawnStructure of spawnStructures) {

            spawnStructuresWithRanges[spawnStructure.id] = spawnStructure.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5)
        }

        let energyStructures = []

        for (let minRange = 0; minRange < 25; minRange++) {

            for (let structureId in spawnStructuresWithRanges) {

                if (spawnStructuresWithRanges[structureId] > minRange) continue

                energyStructures.push(findObjectWithId(structureId))
                delete spawnStructuresWithRanges[structureId]
            }
        }

        return energyStructures
    }

    // Body parts

    function BodyPart(partType, partCost) {

        this.type = partType
        this.cost = partCost
    }

    // Economy

    let workPart = new BodyPart(WORK, 100)
    let carryPart = new BodyPart(CARRY, 50)

    // Combat

    let attackPart = new BodyPart(ATTACK, 80)
    let rangedAttackPart = new BodyPart(RANGED_ATTACK, 150)
    let healPart = new BodyPart(HEAL, 250)
    let toughPart = new BodyPart(TOUGH, 10)

    // Other

    let movePart = new BodyPart(MOVE, 50)
    let claimPart = new BodyPart(CLAIM, 600)

    // Define spawn opts for roles

    /* 
    300 = rcl 1
    500 = rcl 2
    800 = rcl 3
    1300 = rcl 4
    1800 = rcl 5
    2300 = rcl 6
    5300 = rcl 7
    10300 = rcl 8
     */

    let roleOpts = {}

    function JumpStarterBody() {

        if (energyCapacity >= 550) {

            this.defaultParts = []
            this.extraParts = [workPart, movePart, carryPart, movePart]
            this.maxParts = 20

            return
        }

        this.defaultParts = []
        this.extraParts = [carryPart, movePart]
        this.maxParts = 2

        return
    }

    roleOpts["jumpStarter"] = roleValues({
        role: "jumpStarter",
        parts: { 300: new JumpStarterBody() },
        memoryAdditions: {}
    })

    roleOpts["hauler"] = roleValues({
        role: "hauler",
        parts: {
            5300: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 48
            },
            1800: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 36
            },
            300: {
                defaultParts: [],
                extraParts: [carryPart, movePart],
                maxParts: 50
            }
        },
        memoryAdditions: {}
    })

    function HarvesterBody() {

        if (energyCapacity >= 10300) {
            if (storage) {

                let storedEnergyReducer = 20000

                let bodySize = Math.max(Math.floor(room.get("storedEnergy") / storedEnergyReducer) * 3 + 2, 14)

                this.defaultParts = [carryPart, carryPart]
                this.extraParts = [workPart, workPart, movePart]
                this.maxParts = Math.min(bodySize, 20)

                return
            }

            this.defaultParts = [carryPart, carryPart]
            this.extraParts = [workPart, workPart, movePart]
            this.maxParts = 14

            return
        }
        if (energyCapacity >= 2300) {

            this.defaultParts = [carryPart]
            this.extraParts = [workPart, workPart, movePart]
            this.maxParts = 13

            return
        }
        if (energyCapacity >= 1800) {

            this.defaultParts = []
            this.extraParts = [workPart, workPart, movePart]
            this.maxParts = 12

            return
        }
        if (energyCapacity >= 550) {

            this.defaultParts = [movePart]
            this.extraParts = [workPart]
            this.maxParts = 8

            return
        }
        if (energyCapacity >= 300) {

            this.defaultParts = []
            this.extraParts = [workPart]
            this.maxParts = 8

            return
        }
    }

    roleOpts["harvester"] = roleValues({
        role: "harvester",
        parts: {
            300: new HarvesterBody()
        },
        memoryAdditions: {}
    })

    function UpgraderBody() {

        if (storage) {

            let maxParts = 31
            if (energyCapacity == 10300) maxParts = 18

            // For every x stored energy add y parts

            let storedEnergyReducer = 15000

            let bodySize = Math.max(Math.floor(room.get("storedEnergy") / storedEnergyReducer) * 3 + 1, 4)

            this.defaultParts = [carryPart]
            this.extraParts = [workPart, workPart, movePart]
            this.maxParts = Math.min(bodySize, maxParts)

            return
        }

        if (controllerContainer) {

            this.defaultParts = [carryPart]
            this.extraParts = [workPart, workPart, movePart]
            this.maxParts = 28

            return
        }

        this.defaultParts = []
        this.extraParts = [workPart, movePart, carryPart, movePart]
        this.maxParts = 28

        return
    }

    roleOpts["upgrader"] = roleValues({
        role: "upgrader",
        parts: {
            300: new UpgraderBody()
        },
        memoryAdditions: {}
    })

    roleOpts["repairer"] = roleValues({
        role: "repairer",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 18
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    function BuilderBody() {

        if (storage) {

            // For every x stored energy add y parts

            let storedEnergyReducer = 15000

            let bodySize = Math.max(Math.floor(room.get("storedEnergy") / storedEnergyReducer) * 3, 3)

            this.defaultParts = []
            this.extraParts = [workPart, carryPart, movePart]
            this.maxParts = Math.min(bodySize, 24)

            return
        }

        this.defaultParts = []
        this.extraParts = [workPart, movePart, carryPart, movePart]
        this.maxParts = 24

        return
    }

    roleOpts["builder"] = roleValues({
        role: "builder",
        parts: {
            300: new BuilderBody()
        },
        memoryAdditions: {}
    })

    function RampartUpgraderBody() {

        if (storage) {

            // For every x stored energy add y parts

            let storedEnergyReducer = 25000

            if (hostiles.length > 0 && room.get("storedEnergy") > 10000 && creepsOfRole[["meleeDefender", room.name]] > 0) {

                storedEnergyReducer = 10000
            }

            let bodySize = Math.max(Math.floor(room.get("storedEnergy") / storedEnergyReducer) * 6, 6)

            this.defaultParts = []
            this.extraParts = [workPart, workPart, movePart, workPart, carryPart, movePart]
            this.maxParts = Math.min(bodySize, 30)

        } else {

            this.defaultParts = []
            this.extraParts = [workPart, movePart, carryPart, movePart]
            this.maxParts = 18
        }
    }

    roleOpts["rampartUpgrader"] = roleValues({
        role: "rampartUpgrader",
        parts: {
            300: new RampartUpgraderBody()
        },
        memoryAdditions: {}
    })

    roleOpts["remoteBuilder"] = roleValues({
        role: "remoteBuilder",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    roleOpts["remoteHarvester1"] = roleValues({
        role: "remoteHarvester1",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart],
                maxParts: 16
            }
        },
        memoryAdditions: {
            remoteRoom: findRemoteRoom("remoteHarvester1")
        }
    })

    roleOpts["remoteHarvester2"] = roleValues({
        role: "remoteHarvester2",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart],
                maxParts: 16
            }
        },
        memoryAdditions: {
            remoteRoom: findRemoteRoom("remoteHarvester2")
        }
    })

    roleOpts["remoteHauler"] = roleValues({
        role: "remoteHauler",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 48
            },
            300: {
                defaultParts: [],
                extraParts: [carryPart, movePart],
                maxParts: 50
            }
        },
        memoryAdditions: {
            remoteRoom: findRemoteRoom("remoteHauler")
        }
    })

    roleOpts["reserver"] = roleValues({
        role: "reserver",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [claimPart, movePart, movePart],
                maxParts: 6
            },
            300: {
                defaultParts: [],
                extraParts: [claimPart, movePart],
                maxParts: 6
            }
        },
        memoryAdditions: {
            remoteRoom: findRemoteRoom("reserver")
        }
    })

    roleOpts["communeDefender"] = roleValues({
        role: "communeDefender",
        parts: {
            300: {
                defaultParts: [],
                extraParts: [attackPart, movePart, attackPart, movePart, rangedAttackPart, movePart],
                maxParts: 24
            },
        },
        memoryAdditions: {}
    })

    roleOpts["revolutionaryBuilder"] = roleValues({
        role: "revolutionaryBuilder",
        parts: {
            10300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 32
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    roleOpts["claimer"] = roleValues({
        role: "claimer",
        parts: {
            300: {
                defaultParts: [claimPart],
                extraParts: [movePart],
                maxParts: 6
            }
        },
        memoryAdditions: {}
    })

    roleOpts["rangedDefender"] = roleValues({
        role: "rangedDefender",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [rangedAttackPart, rangedAttackPart, movePart],
                maxParts: 50
            },
            300: {
                defaultParts: [],
                extraParts: [rangedAttackPart, movePart],
                maxParts: 50
            }
        },
        memoryAdditions: {}
    })

    roleOpts["meleeDefender"] = roleValues({
        role: "meleeDefender",
        parts: {
            1800: {
                defaultParts: [],
                extraParts: [attackPart, attackPart, movePart],
                maxParts: 50
            },
            300: {
                defaultParts: [],
                extraParts: [attackPart, movePart],
                maxParts: 50
            }
        },
        memoryAdditions: {}
    })

    roleOpts["scientist"] = roleValues({
        role: "scientist",
        parts: {
            300: {
                defaultParts: [carryPart, carryPart, movePart, carryPart, carryPart, movePart, carryPart, movePart],
                extraParts: [],
                maxParts: 8
            }
        },
        memoryAdditions: {}
    })

    roleOpts["stationaryHauler"] = roleValues({
        role: "stationaryHauler",
        parts: {
            300: {
                defaultParts: [movePart],
                extraParts: [carryPart],
                maxParts: 17
            }
        },
        memoryAdditions: {}
    })

    roleOpts["upgradeHauler"] = roleValues({
        role: "upgradeHauler",
        parts: {
            300: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 36
            }
        },
        memoryAdditions: {}
    })

    roleOpts["miner"] = roleValues({
        role: "miner",
        parts: {
            300: {
                defaultParts: [],
                extraParts: [workPart, workPart, workPart, workPart, movePart],
                maxParts: 50
            }
        },
        memoryAdditions: {}
    })

    roleOpts["robber"] = roleValues({
        role: "robber",
        parts: {
            300: {
                defaultParts: [],
                extraParts: [carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    roleOpts["scout"] = roleValues({
        role: "scout",
        parts: {
            300: {
                defaultParts: [movePart],
                extraParts: [],
                maxParts: 1
            }
        },
        memoryAdditions: {}
    })

    if (squadType == "rangedAttack") {

        roleOpts["antifaAssaulter"] = roleValues({
            role: "antifaAssaulter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [rangedAttackPart, movePart],
                    maxParts: 2
                },
            },
            memoryAdditions: {
                type: "rangedAttack",
                size: "quad",
                amount: 0,
                requiredAmount: 4,
                part: false,
            }
        })
        roleOpts["antifaSupporter"] = roleValues({
            role: "antifaSupporter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [healPart, movePart],
                    maxParts: 2
                },
            },
            memoryAdditions: {
                type: "rangedAttack",
                size: "quad",
                part: false,
            }
        })
    } else if (squadType == "attack") {

        roleOpts["antifaAssaulter"] = roleValues({
            role: "antifaAssaulter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [attackPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
        roleOpts["antifaSupporter"] = roleValues({
            role: "antifaSupporter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [healPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
    } else if (squadType == "dismantle") {

        roleOpts["antifaAssaulter"] = roleValues({
            role: "antifaAssaulter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [workPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
        roleOpts["antifaSupporter"] = roleValues({
            role: "antifaSupporter",
            parts: {
                300: {
                    defaultParts: [],
                    extraParts: [healPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
    }

    // Convert given values into spawnable object

    function roleValues(opts) {

        // Define values given

        let role = opts.role

        let parts

        for (let property in opts.parts) {

            if (energyCapacity >= property) {

                parts = opts.parts[property]
            }
        }

        if (!parts) return false

        let maxParts = parts.maxParts

        let memoryAdditions = opts.memoryAdditions

        // Create values for spawning object

        let body = []
        let tier = 0
        let cost = 0

        let energyAmount = energyCapacity

        if (roomFix) energyAmount = energyAvailable

        // Create role body

        function getCostOfParts(array) {

            let totalCost = 0

            for (let object of array) {

                totalCost += object.cost
            }

            return totalCost
        }

        function getTypesOfParts(array) {

            let partTypes = []

            for (let object of array) {

                partTypes.push(object.type)
            }

            return partTypes
        }

        // Add default parts if exists

        if (parts.defaultParts.length > 0) {

            body.push(getTypesOfParts(parts.defaultParts))

            cost += getCostOfParts(parts.defaultParts)
            tier += 1
        }

        // Find iteration amount

        let extraIterations = Math.min(Math.floor((energyAmount - getCostOfParts(parts.defaultParts)) / getCostOfParts(parts.extraParts)), maxParts - body.length)

        // Add extra parts

        let i = 0

        while (i < extraIterations && body.length + parts.extraParts.length <= maxParts) {

            body.push(getTypesOfParts(parts.extraParts))

            cost += getCostOfParts(parts.extraParts)
            tier += 1

            i++
        }

        body = _.flattenDeep(body).slice(0, maxParts)

        // Create memory object and add additions

        let memory = { role: role, roomFrom: room.name }

        for (let property in memoryAdditions) {

            memory[property] = memoryAdditions[property]
        }

        return {
            role: role,
            body: body,
            tier: tier,
            opts: { memory: memory, energyStructures: energyStructures },
            cost: cost
        }
    }

    return {
        requiredCreeps: requiredCreeps,
        roleOpts: roleOpts,
    }
}

module.exports = spawnRequests