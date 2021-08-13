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

    // Asign variables needed for creating roleValues

    let energyAvailable = room.energyAvailable
    let energyCapacity = room.energyCapacityAvailable

    const roomFix = room.memory.roomFix
    const stage = room.memory.stage

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

    // Define spawn opts for role

    let roleOpts = {}

    roleOpts["jumpStarter"] = roleValues({
        role: "jumpStarter",
        parts: {
            1: {
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
            7: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 48
            },
            5: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 36
            },
            1: {
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
            6: {
                defaultParts: [carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 13
            },
            5: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            3: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            1: {
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
            8: {
                defaultParts: [carryPart, carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 5
            },
            3: {
                defaultParts: [carryPart],
                extraParts: [workPart, workPart, movePart],
                maxParts: 25
            },
            2: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 25
            },
            1: {
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
            5: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 18
            },
            1: {
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
            8: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 36
            },
            5: {
                defaultParts: [],
                extraParts: [workPart, carryPart, movePart],
                maxParts: 24
            },
            1: {
                defaultParts: [],
                extraParts: [workPart, movePart, carryPart, movePart],
                maxParts: 24
            }
        },
        memoryAdditions: {}
    })

    roleOpts["barricadeUpgrader"] = roleValues({
        role: "barricadeUpgrader",
        parts: {
            8: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart, workPart, carryPart, movePart],
                maxParts: 30
            },
            5: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart, workPart, carryPart, movePart],
                maxParts: 18
            },
            1: {
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
            5: {
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
            5: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            1: {
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
            5: {
                defaultParts: [],
                extraParts: [workPart, workPart, movePart],
                maxParts: 12
            },
            1: {
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
            5: {
                defaultParts: [],
                extraParts: [carryPart, carryPart, movePart],
                maxParts: 48
            },
            1: {
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
            1: {
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
            6: {
                defaultParts: [],
                extraParts: [attackPart, movePart, attackPart, movePart, attackPart, movePart, attackPart, movePart, attackPart, movePart, healPart, movePart],
                maxParts: 24
            },
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
            1: {
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
                1: {
                    defaultParts: [],
                    extraParts: [rangedAttackPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
        roleOpts["antifaSupporter"] = roleValues({
            role: "antifaSupporter",
            parts: {
                1: {
                    defaultParts: [],
                    extraParts: [healPart, movePart],
                    maxParts: 20
                },
            },
            memoryAdditions: {}
        })
    } else if (squadType == "attack") {

        roleOpts["antifaAssaulter"] = roleValues({
            role: "antifaAssaulter",
            parts: {
                1: {
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
                1: {
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
                1: {
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
                1: {
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

        if (!stage) return false

        for (let property in opts.parts) {

            if (stage >= property) {

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

        if (parts.defaultParts.length > 0) {

            body.push(getTypesOfParts(parts.defaultParts))

            cost += getCostOfParts(parts.defaultParts)
            tier += 1
        }

        let extraIterations = Math.floor((energyAmount - getCostOfParts(parts.defaultParts)) / getCostOfParts(parts.extraParts))

        for (let i = 0; i < extraIterations && (body.length + parts.extraParts.length) <= maxParts; i++) {

            body.push(getTypesOfParts(parts.extraParts))

            cost += getCostOfParts(parts.extraParts)
            tier += 1
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
            memory: { memory },
            cost: cost
        }
    }

    return {
        roleOpts: roleOpts
    }
}

module.exports = roleOpts