let findAnchor = require("findAnchor")

function scoutManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    for (let creep of creepsWithRole) {

        let targetRoom = creep.memory.targetRoom

        // Check if we don't have a target room. If no target room find one

        findNewTargetRoom()

        function findNewTargetRoom() {

            // If we have a target room and it's not our room return

            if (targetRoom && room.name != targetRoom) return

            let exits = Game.map.describeExits(room.name)

            let exitRoomNames = []

            for (let property in exits) {

                let roomName = exits[property]

                if (Game.map.getRoomStatus(roomName).status != "normal") continue

                exitRoomNames.push(roomName)
            }

            // See if there is a room without memory or without a scoutTick

            targetRoom = exitRoomNames.filter(roomName => !Memory.rooms[roomName] || !Memory.rooms[roomName].scoutTick)[0]

            if (targetRoom) return

            // Otherwise find the room with the lowest scout tick

            lowestScoutTick = Math.min.apply(Math, exitRoomNames.map(roomName => Memory.rooms[roomName].scoutTick))

            targetRoom = exitRoomNames.filter(roomName => Memory.rooms[roomName].scoutTick == lowestScoutTick)[0]
        }

        // If no target room after trying to find one stop creep

        if (!targetRoom) continue

        // cache targetRoom in memory

        creep.memory.targetRoom = targetRoom

        // Record tick the room was scouted

        room.memory.scoutTick = Game.time

        // If target room see if there is a controller

        creep.say(targetRoom)

        let controller = room.get("controller")

        if (controller) {

            // If it's a neutral are right sign the controller

            if (signController()) continue

            function signController() {

                if (controller.sign && controller.sign.username == me) return
                if (controller.reservation) return
                if (controller.owner && !controller.my) return

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: controller.pos, range: 1 },
                    plainCost: 1,
                    swampCost: 1,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 50,
                })

                // If my room sign with commune message

                if (controller.my) {

                    creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
                    return true
                }

                // If neutral room sign it with a random neutral message

                creep.signWithMessage()
                return true
            }

            // Find what type of room this is and gather and record data on it

            // Check if viable remoteRoom

            isRemoteRoom()

            function isRemoteRoom() {

                //

                if (room.memory.stage == "remoteRoom") {

                    let nearCommune

                    for (let roomName of Memory.global.communes) {

                        let safeDistance = room.findSafeDistance(creep.pos, { pos: new RoomPosition(25, 25, roomName), range: 1 }, ["enemyRoom", "keeperRoom", "enemyReservation", "emptyRoom"])

                        if (safeDistance > 2) continue

                        nearCommune = true
                        break
                    }

                    if (!nearCommune) room.memory.stage = undefined

                    return
                }

                if (controller.owner) return

                if (controller.reservation && controller.reservation.username != me && controller.reservation.username != "Invader") return

                // Make sure the commune can have more rooms

                let maxRemoteRooms = Math.floor(Game.rooms[creep.memory.roomFrom].get("spawns").length * 3)
                let activeRemotes = Object.values(Memory.rooms[creep.memory.roomFrom].remoteRooms).length
                if (activeRemotes >= maxRemoteRooms) return

                // Make sure there are no hostiles

                let hostiles = room.find(FIND_HOSTILE_CREEPS, {
                    filter: hostileCreep => !allyList.includes(hostileCreep.owner.username) && hostileCreep.owner.username != "Invader" && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM])
                })
                if (hostiles.length > 0) return

                // Make sure the room is in a range of 2 from the commune

                let safeDistance = room.findSafeDistance(creep.pos, { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 }, ["enemyRoom", "keeperRoom", "enemyReservation"])
                if (safeDistance > 2) return

                // record room in memory

                let sources = room.get("sources")
                let sourceIds = []

                for (let source of sources) sourceIds.push(source.id)

                Memory.rooms[creep.memory.roomFrom].remoteRooms[room.name] = { inUse: false, sources: sourceIds, roads: false, builderNeed: false, enemy: false, invaderCore: false, distance: undefined }

                room.memory.stage = "remoteRoom"
            }

            if (controller.owner) {

                if (controller.my) {


                } else if (allyList.indexOf(controller.owner.username) >= 0) {

                    room.memory.stage = "allyRoom"
                    room.memory.owner = controller.owner.username
                    room.memory.level = controller.level

                } else {

                    room.memory.stage = "enemyRoom"
                    room.memory.owner = controller.owner.username
                    room.memory.level = controller.level
                    room.memory.threat = 0

                    /* room.memory.maxRampart = */
                    /* room.memory.towerAmount =  */
                    /* room.memory.spawnAmount =  */
                    /* room.memory.labAmount =  */
                    /* room.memory.storedEnergy =  */
                    /* room.memory.storage = boolean */
                    /* room.memory.terminal = boolean */
                    /* room.memory.boosts = {attack: amount, rangedAttack: amount, work: amount} */
                }
            } else {

                if (controller.reservation && controller.reservation.username != "Invader") {

                    if (controller.reservation.username == me) {


                    } else {

                        // If reserved and not reserved by me or invaders find if enemy or ally has reserved it

                        if (allyList.includes(controller.reservation.username)) {

                            room.memory.stage = "allyReservation"

                        } else {

                            room.memory.stage = "enemyReservation"
                        }
                    }
                } else {

                    if (room.memory.stage != "remoteRoom") {

                        room.memory.stage = "neutralRoom"
                    }

                    // See if room can be a new commune

                    if (room.get("sources").length == 2 && room.memory.claimable != true && room.memory.claimable != "notViable" && room.memory.stage != "remoteRoom") {

                        // Make sure room doesn't share an exit with slowmotionghost, a commune, or a possible commune

                        let nearRoom = false

                        let exits = Game.map.describeExits(room.name)

                        for (let property in exits) {

                            let roomName = exits[property]

                            if (!Memory.rooms[roomName]) continue

                            if ((Memory.rooms[roomName].owner && Memory.rooms[roomName].owner == "slowmotionghost") || Memory.rooms[roomName].stage >= 0 || Memory.rooms[roomName].claimable == true) nearRoom = true
                        }

                        creep.say("N")

                        if (!nearRoom) {

                            creep.say("NNC")

                            creep.travel({
                                origin: creep.pos,
                                goal: { pos: controller.pos, range: 1 },
                                plainCost: 1,
                                swampCost: 1,
                                defaultCostMatrix: room.memory.defaultCostMatrix,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 2,
                            })

                            if (findAnchor(room)) {

                                creep.say("CR")

                                room.memory.claimable = true

                                if (!Memory.global.claimableRooms.includes(room.name)) Memory.global.claimableRooms.push(room.name)

                            } else {

                                room.memory.claimable = "notViable"
                            }
                        } else {

                            room.memory.claimable = "notViable"
                        }
                    }
                }
            }

            // Continue to targetRoom

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, targetRoom), range: 1 },
                plainCost: 1,
                swampCost: 1,
                defaultCostMatrix: room.memory.defaultCostMatrix,
                avoidStages: [],
                flee: false,
                cacheAmount: 50,
            })
            return
        }

        // If no controller

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

                        // Iterate if memory already contians deposit

                        if (Memory.rooms[creep.memory.roomFrom].deposits[deposit.id]) continue

                        Memory.rooms[creep.memory.roomFrom].deposits[deposit.id] = { roomName: creep.room.name, decayBy: Game.time + deposit.ticksToDecay }
                    }
                }
            }
        }

        // Go to next room

        creep.travel({
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

module.exports = scoutManager