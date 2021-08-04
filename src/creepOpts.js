let spawnRequests = require("spawnRequests")

function creepOpts(room, spawns, specialStructures) {

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

    let freeEnergy = room.energyAvailable
    let capacityEnergy = room.energyCapacityAvailable

    const roomFix = room.memory.roomFix
    const stage = room.memory.stage

    function roleValues(parts, role, memoryAdditions) {

        let body = []
        let bodyTier = 0
        let sliceAmount = 0
        let cost = 0

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

                cost += object.defaultCost + object.extraCost

                if (object.defaultParts[0]) {

                    body.push(object.defaultParts)
                    bodyTier++
                }

                var bodyAmount = Math.floor((energyType - object.defaultCost) / object.extraCost)

                bodyTier = Math.min(bodyAmount, sliceAmount)

                if (bodyAmount != Infinity) {

                    for (let i = 0; i < bodyAmount && i < sliceAmount; i++) {

                        body.push(object.extraParts)
                    }
                }
            }
        }

        body = _.flattenDeep(body).slice(0, sliceAmount)

        let memory = { role: role, roomFrom: room.name }

        for (let property of Object.keys(memoryAdditions)) {

            memory[property] = memoryAdditions[property]
        }

        return {
            body: body,
            tier: bodyTier,
            role: role,
            memory: { memory },
            cost: cost
        }
    }

    let roleOpts = {}

    roleOpts["jumpStarter"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, MOVE, CARRY, MOVE],
            extraCost: 250,
            sliceAmount: 20
        }],
        "jumpStarter", {})

    roleOpts["hauler"] = roleValues(
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
        "hauler", {})

    roleOpts["harvester"] = roleValues(
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
        "harvester", {})

    roleOpts["upgrader"] = roleValues(
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
        "upgrader", {})

    roleOpts["repairer"] = roleValues(
        [{
                stage: 5,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [WORK, CARRY, MOVE],
                extraCost: 200,
                sliceAmount: 18
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
        "repairer", {})

    roleOpts["builder"] = roleValues(
        [{
                stage: 8,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [WORK, CARRY, MOVE],
                extraCost: 200,
                sliceAmount: 36
            }, {
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
        "builder", {})

    roleOpts["barricadeUpgrader"] = roleValues(
        [{
                stage: 8,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [WORK, CARRY, MOVE],
                extraCost: 200,
                sliceAmount: 30
            }, {
                stage: 5,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [WORK, CARRY, MOVE],
                extraCost: 200,
                sliceAmount: 18
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
        "BaU", {})

    roleOpts["remoteBuilder"] = roleValues(
        [{
            stage: 5,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, MOVE, CARRY, MOVE],
            extraCost: 250,
            sliceAmount: 24
        }],
        "remoteBuilder", {})

    roleOpts["remoteHarvester1"] = roleValues(
        [{
            stage: 5,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, WORK, MOVE],
            extraCost: 250,
            sliceAmount: 12
        }, {
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, MOVE],
            extraCost: 150,
            sliceAmount: 16
        }],
        "remoteHarvester1", {
            remoteRoom: findRemoteRoom("remoteHarvester1")
        })

    roleOpts["remoteHarvester2"] = roleValues(
        [{
            stage: 5,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, WORK, MOVE],
            extraCost: 250,
            sliceAmount: 12
        }, {
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, MOVE],
            extraCost: 150,
            sliceAmount: 16
        }],
        "remoteHarvester2", {
            remoteRoom: findRemoteRoom("remoteHarvester2")
        })

    roleOpts["remoteHauler"] = roleValues(
        [{
            stage: 5,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [CARRY, CARRY, MOVE],
            extraCost: 150,
            sliceAmount: 48
        }, {
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [CARRY, MOVE],
            extraCost: 100,
            sliceAmount: 50
        }],
        "remoteHauler", {
            remoteRoom: findRemoteRoom("remoteHauler")
        })

    roleOpts["reserver"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [CLAIM, MOVE, MOVE],
            extraCost: 700,
            sliceAmount: 6
        }],
        "reserver", {
            remoteRoom: findRemoteRoom("reserver")
        })

    roleOpts["communeDefender"] = roleValues(
        [{
            stage: 6,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, HEAL, MOVE],
            extraCost: 950,
            sliceAmount: 24
        }, {
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [ATTACK, MOVE],
            extraCost: 130,
            sliceAmount: 20
        }],
        "communeDefender", {})

    roleOpts["revolutionaryBuilder"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, MOVE, CARRY, MOVE],
            extraCost: 250,
            sliceAmount: 24
        }],
        "revolutionaryBuilder", {})

    roleOpts["claimer"] = roleValues(
        [{
            stage: 1,
            defaultParts: [CLAIM, MOVE, MOVE],
            defaultCost: 700,
            extraParts: [],
            extraCost: 0,
            sliceAmount: 3
        }],
        "claimer", {})

    roleOpts["rangedDefender"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [RANGED_ATTACK, MOVE],
            extraCost: 220,
            sliceAmount: 50
        }],
        "rangedDefender", {})

    roleOpts["scientist"] = roleValues(
        [{
            stage: 1,
            defaultParts: [CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, MOVE],
            defaultCost: 400,
            extraParts: [],
            extraCost: 0,
            sliceAmount: 8
        }],
        "scientist", {})

    roleOpts["stationaryHauler"] = roleValues(
        [{
            stage: 1,
            defaultParts: [MOVE],
            defaultCost: 50,
            extraParts: [CARRY],
            extraCost: 50,
            sliceAmount: 17
        }],
        "stationaryHauler", {})

    roleOpts["upgradeHauler"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [CARRY, CARRY, MOVE],
            extraCost: 150,
            sliceAmount: 36
        }],
        "upgradeHauler", {})

    roleOpts["miner"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [WORK, WORK, WORK, WORK, MOVE],
            extraCost: 450,
            sliceAmount: 50
        }],
        "miner", {})

    roleOpts["robber"] = roleValues(
        [{
            stage: 1,
            defaultParts: [],
            defaultCost: 0,
            extraParts: [CARRY, MOVE],
            extraCost: 100,
            sliceAmount: 24
        }],
        "robber", {})

    roleOpts["scout"] = roleValues(
        [{
            stage: 1,
            defaultParts: [MOVE],
            defaultCost: 50,
            extraParts: [],
            extraCost: 0,
            sliceAmount: 1
        }],
        "scout", {})

    if (squadType == "rangedAttack") {
        roleOpts["antifaAssaulter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [RANGED_ATTACK, MOVE],
                extraCost: 200,
                sliceAmount: 20
            }],
            "antifaAssaulter", {})

        roleOpts["antifaSupporter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 0,
                extraParts: [HEAL, MOVE],
                extraCost: 300,
                sliceAmount: 50
            }],
            "antifaSupporter", {})
    } else if (squadType == "attack") {
        roleOpts["antifaAssaulter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 50,
                extraParts: [],
                extraCost: 0,
                sliceAmount: 50
            }],
            "antifaAssaulter", {})

        roleOpts["antifaSupporter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 50,
                extraParts: [],
                extraCost: 0,
                sliceAmount: 50
            }],
            "antifaSupporter", {})
    } else if (squadType == "dismantle") {
        roleOpts["antifaAssaulter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 50,
                extraParts: [WORK, MOVE],
                extraCost: 150,
                sliceAmount: 2
            }],
            "antifaAssaulter", {})

        roleOpts["antifaSupporter"] = roleValues(
            [{
                stage: 1,
                defaultParts: [],
                defaultCost: 50,
                extraParts: [HEAL, MOVE],
                extraCost: 300,
                sliceAmount: 2
            }],
            "antifaSupporter", {})
    }

    return {
        roleOpts: roleOpts
    }
}

module.exports = creepOpts