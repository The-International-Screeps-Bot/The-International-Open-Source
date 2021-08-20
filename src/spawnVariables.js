let spawnRequests = require("spawnRequests")

function roleOpts(room, spawns, specialStructures) {

    let { requiredRemoteCreeps } = spawnRequests(room, spawns, specialStructures)

    function findRemoteRoom(role) {

        for (let remoteRoom of room.memory.remoteRooms) {

            if (requiredRemoteCreeps[[role, remoteRoom.name]] > 0) {

                return remoteRoom.name
            }
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

    // Get array of spawningStructures

    let energyStructures = []

    const anchorPoint = room.memory.anchorPoint

    let spawnStructuresWithRanges = {}
    let startPos = new RoomPosition(anchorPoint.y - 3, anchorPoint.x, anchorPoint.roomName)

    let spawnStructures = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_EXTENSION || STRUCTURE_SPAWN
    })

    // Add each spawnStructures with their range to the object

    for (let spawnStructure of spawnStructures) {

        spawnStructuresWithRanges[spawnStructure.id] = startPos.getRangeTo(spawnStructure)
    }

    for (let minRange = 0; minRange < 50; minRange++) {

        for (let spawnStructure in spawnStructuresWithRanges) {

            if (spawnStructuresWithRanges[spawnStructure] <= minRange) continue

            energyStructures.push(findObjectWithId(spawnStructure))
            delete spawnStructuresWithRanges[spawnStructure]
        }
    }

    // Asign variables needed for creating roleValues

    let energyAvailable = room.energyAvailable
    let energyCapacity = room.energyCapacityAvailable

    const roomFix = room.memory.roomFix

    class BodyPart {
        constructor(partType, cost) {

            this.type = partType
            this.cost = cost
        }
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

    roleOpts["jumpStarter"] = roleValues({
        role: "jumpStarter",
        parts: {
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 20
            },
        },
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

    roleOpts["harvester"] = roleValues({
        role: "harvester",
        parts: {
            2300: {
                defaultParts: [carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 13
            },
            1800: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            800: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            300: {
                defaultParts: [movePart],
                extraParts: [workPart],
                maxParts: 9
            }
        },
        memoryAdditions: {}
    })

    roleOpts["upgrader"] = roleValues({
        role: "upgrader",
        parts: {
            10300: {
                defaultParts: [carryPart, carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 5
            },
            800: {
                defaultParts: [carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 25
            },
            550: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 25
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 25
            }
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

    roleOpts["builder"] = roleValues({
        role: "builder",
        parts: {
            10300: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 36
            },
            1800: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 24
            },
            300: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    roleOpts["rampartUpgrader"] = roleValues({
        role: "rampartUpgrader",
        parts: {
            10300: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart, workPart, carryPart, movePart],
                maxParts: 30
            },
            1800: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart, workPart, carryPart, movePart],
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
            300: {
                defaultParts: [],
                extraParts: [claimPart, movePart, movePart],
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
            2300: {
                defaultParts: [],
                extraParts: [attackPart, movePart, attackPart, movePart, attackPart, movePart, attackPart, movePart, attackPart, movePart, healPart, movePart],
                maxParts: 24
            },
            300: {
                defaultParts: [],
                extraParts: [attackPart, movePart],
                maxParts: 20
            }
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
            300: {
                defaultParts: [],
                extraParts: [rangedAttackPart, movePart],
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
                amount: 0,
                requiredAmount: 4,
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
        roleOpts: roleOpts,
    }
}

module.exports = roleOpts