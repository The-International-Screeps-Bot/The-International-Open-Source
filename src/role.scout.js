let findAnchor = require("findAnchor")


module.exports = {
    run: function(creep) {

        let targetRooms = Game.map.describeExits(creep.room.name)
        let targetRoomsArray = []
        let min
        let targetRoom

        // If no target room find one

        if (!targetRoom) {
            for (let i = 0; i <= 7; i++) {

                let roomName = targetRooms[i]

                if (roomName) {

                    if (!Memory.rooms[roomName]) {

                        Memory.rooms[roomName] = {}
                    }

                    targetRoomsArray.push(roomName)
                }
            }

            for (let i = 0; i < targetRoomsArray.length; i++) {
                creep.say("tRA")

                let roomName = targetRoomsArray[i]

                if (!Memory.rooms[roomName].scoutTick) {

                    targetRoom = roomName
                    break
                } else if (i + 1 == targetRoomsArray.length) {

                    min = true
                }
            }

            if (min == true) {
                creep.say("min")

                let targetRoomsArrayScoutTick = []

                for (let roomName of targetRoomsArray) {

                    targetRoomsArrayScoutTick.push(Memory.rooms[roomName].scoutTick)
                }

                lowestScoutTick = _.min(targetRoomsArrayScoutTick, function(tick) { return tick })

                for (let roomName in Memory.rooms) {

                    if (Memory.rooms[roomName].scoutTick == lowestScoutTick) {

                        targetRoom = roomName
                        break
                    }
                }
            }
        }

        // If target room scout it

        if (targetRoom) {

            creep.say(targetRoom)

            creep.room.memory.scoutTick = Game.time

            let controller = creep.room.controller

            if (controller) {

                // If not signed or not signed by me and not reserved or owned by me sign controller

                if ((!controller.sign || controller.sign.username != me) && !controller.reservation && (!controller.owner || controller.owner.username == me)) {

                    creep.say("Signing")

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: controller.pos, range: 1 },
                        plainCost: 1,
                        swampCost: 1,
                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 50,
                    })

                    if (controller.my) {

                        creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
                    } else {

                        let messages = [
                            "The top 1% have more money than the poorest 4.5 billion",
                            "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour",
                            "We have democracy in our policial system, why do we not have it in our companies?",
                            "Workers of the world, unite!",
                            "Real democracy requires democracy in the workplace - Richard Wolff",
                            "Adults spend a combined 13 years of their life under a dictatorship: the workplace",
                        ]

                        let signType = Math.floor(Math.random(messages.length) * 10) - 1

                        creep.signController(controller, messages[signType])
                    }
                } else {

                    if (controller.my) {


                    } else {

                        // If not my room but was my room reset memory

                        if (creep.room.memory.stage >= 0) creep.room.memory = {}

                        if (controller.reservation) {

                            if (controller.reservation.username == me) {


                            } else {

                                if (controller.reservation.username != "Invader") {

                                    // If reserved and not reserved by me or invaders find if enemy or ally has reserved it

                                    if (allyList.includes(controller.reservation.username)) {

                                        creep.room.memory.stage = "allyReservation"

                                    } else {

                                        creep.room.memory.stage = "enemyReservation"
                                    }
                                }
                            }
                        } else {

                            if (controller.owner) {

                                if (allyList.indexOf(controller.owner.username) >= 0) {

                                    creep.room.memory.stage = "allyRoom"
                                    creep.room.memory.owner = controller.owner.username
                                    creep.room.memory.level = controller.level

                                } else {

                                    creep.room.memory.stage = "enemyRoom"
                                    creep.room.memory.owner = controller.owner.username
                                    creep.room.memory.level = controller.level
                                    creep.room.memory.threat = 0

                                    /* creep.room.memory.maxRampart = */
                                    /* creep.room.memory.towerAmount =  */
                                    /* creep.room.memory.spawnAmount =  */
                                    /* creep.room.memory.labAmount =  */
                                    /* creep.room.memory.storedEnergy =  */
                                    /* creep.room.memory.boosts = {attack, rangedAttack, work} */
                                }
                            }
                        }

                        // Find if viable remoteRoom

                        if (!controller.reservation || controller.reservation.username == "Invader") {

                            let targetRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, creep.memory.roomFrom) == 1

                            if (targetRoomDistance == 1) {

                                let safeDistance = creep.room.findSafeDistance(creep.pos, { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 }, ["enemyRoom", "keeperRoom", "enemyReservation"]) <= 2

                                if (safeDistance) {

                                    function checkDuplicate() {

                                        for (let object of Memory.rooms[creep.memory.roomFrom].remoteRooms) {

                                            if (object.name == creep.room.name) {

                                                return false
                                            }
                                        }

                                        return true
                                    }

                                    if (checkDuplicate()) {

                                        let canHaveMoreRemotes = Math.floor(Game.rooms[creep.memory.roomFrom].get("spawns").length * 2) > Memory.rooms[creep.memory.roomFrom].remoteRooms.length

                                        if (canHaveMoreRemotes) {

                                            let sources = creep.room.get("sources").length

                                            Memory.rooms[creep.memory.roomFrom].remoteRooms.push({ name: creep.room.name, sources: sources, roads: false, builderNeed: false, enemy: false, distance: null })

                                            creep.room.memory.stage = "remoteRoom"
                                        }
                                    }
                                }
                            } else if (creep.room.memory.stage != "remoteRoom") {

                                creep.room.memory.stage = "neutralRoom"
                            }
                        }

                        // See if room can be a new commune

                        var newCommune

                        if (creep.room.get("sources").length == 2 && Memory.global.communes.length < Game.gcl.level && creep.room.memory.claim != true && creep.room.memory.claim != "notViable" && controller && !controller.owner && !controller.reservation && creep.room.findSafeDistance(creep.pos, { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"]) <= 10) {

                            if (creep.isEdge()) {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: controller.pos, range: 1 },
                                    plainCost: 1,
                                    swampCost: 1,
                                    defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 50,
                                })
                            }

                            let nearRoom = false

                            let exits = Game.map.describeExits(creep.room.name)

                            for (let property in exits) {

                                let roomName = exits[property]

                                if (Memory.rooms[roomName].owner && (Memory.rooms[roomName].owner == "slowmotionghost" || Memory.rooms[roomName].stage >= 0 || Memory.rooms[roomName].claim == true)) nearRoom = true
                            }

                            creep.say("N")

                            if (!nearRoom) {

                                creep.say("NNC")

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: controller.pos, range: 1 },
                                    plainCost: 1,
                                    swampCost: 1,
                                    defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 50,
                                })

                                if (findAnchor(creep.room)) {

                                    creep.say("FA")

                                    newCommune = true

                                    creep.room.memory.claim = true

                                    if (!Memory.global.newCommunes.includes(creep.room.name)) Memory.global.newCommunes.push(creep.room.name)

                                } else {

                                    creep.room.memory.claim = "notViable"
                                }
                            } else {

                                creep.room.memory.claim = "notViable"
                            }
                        }
                    }

                    // If not able to be a new commune continue to next room

                    if (!newCommune) {

                        creep.advancedPathing({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, targetRoom), range: 1 },
                            plainCost: 1,
                            swampCost: 1,
                            defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 50,
                        })
                    }
                }
            } else {

                // Check if keeper room

                let keeperLair = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_KEEPER_LAIR
                })

                if (keeperLair.length > 0) {

                    creep.room.memory.stage = "keeperRoom"

                } else {

                    creep.room.memory.stage = "emptyRoom"
                }

                // Check for deposits

                if (Memory.rooms[creep.memory.roomFrom].deposits) {

                    let deposits = creep.room.find(FIND_DEPOSITS, {
                        filter: deposit => deposit.ticksToDecay > 1000
                    })

                    if (deposits.length > 0) {

                        let safeDistance = creep.room.findSafeDistance(creep.pos, { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"]) <= 6

                        if (safeDistance) {

                            for (let deposit of deposits) {

                                // Break loop if memory already contians deposit

                                if (Memory.rooms[creep.memory.roomFrom].deposits[deposit.id]) continue

                                Memory.rooms[creep.memory.roomFrom].deposits[deposit.id] = { roomName: creep.room.name, decayBy: Game.time + deposit.ticksToDecay }
                            }
                        }
                    }
                }

                // Go to next room

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, targetRoom), range: 1 },
                    plainCost: 1,
                    swampCost: 1,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 50,
                })
            }
        }
    }
};