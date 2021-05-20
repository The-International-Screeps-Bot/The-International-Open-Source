let construction = require("module.construction")

module.exports = {
    run: function(creep) {

        let targetRooms = Game.map.describeExits(creep.room.name)
        let targetRoomsArray = []
        let min
        let targetRoom

        if (!targetRoom) {
            for (let i = 0; i <= 7; i++) {

                let room = targetRooms[i]

                if (room) {

                    if (!Memory.rooms[room]) {

                        Memory.rooms[room] = {}
                    }

                    targetRoomsArray.push(room)
                }
            }

            for (let i = 0; i < targetRoomsArray.length; i++) {
                creep.say("tRA")

                let room = targetRoomsArray[i]

                if (!Memory.rooms[room].scoutTick) {

                    targetRoom = room
                    break
                } else if (i + 1 == targetRoomsArray.length) {

                    min = true
                }
            }

            if (min == true) {
                creep.say("min")

                let targetRoomsArrayScoutTick = []

                for (let room of targetRoomsArray) {

                    targetRoomsArrayScoutTick.push(Memory.rooms[room].scoutTick)
                }

                lowestScoutTick = _.min(targetRoomsArrayScoutTick, function(tick) { return tick })
                    //console.log(lowestScoutTick)

                for (let room in Memory.rooms) {

                    if (Memory.rooms[room].scoutTick == lowestScoutTick) {

                        targetRoom = room
                        break
                    }
                }
            }
        }

        if (targetRoom) {

            creep.say(targetRoom)

            creep.room.memory.scoutTick = Game.time

            let origin = creep.pos

            let goal = _.map([new RoomPosition(25, 25, targetRoom)], function(target) {
                return { pos: target, range: 1 }
            })

            let controller = creep.room.controller

            if (controller) {

                if (!controller.sign || controller.sign.username != "MarvinTMB" && !controller.reservation) {
                    creep.say("Signing")

                    if (creep.pos.inRangeTo(controller, 1)) {

                        if (controller.my) {

                            creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
                        }

                        //output an integer from 1-6
                        let signType = Math.floor(Math.random(7) * 10)

                        if (signType == 1) {

                            if (creep.signController(controller, "The top 1% have more money than the poorest 4.5 billion") == ERR_NOT_IN_RANGE) {}
                        } else if (signType == 2) {

                            if (creep.signController(controller, "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour") == ERR_NOT_IN_RANGE) {}
                        } else if (signType == 3) {

                            if (creep.signController(controller, "We have democracy in our policial system, why do we not have it in our companies?") == ERR_NOT_IN_RANGE) {}
                        } else if (signType == 4) {

                            if (creep.signController(controller, "Workers of the world, unite!") == ERR_NOT_IN_RANGE) {}
                        } else if (signType == 5) {

                            if (creep.signController(controller, "Real democracy requires democracy in the workplace - Richard Wolff") == ERR_NOT_IN_RANGE) {}
                        } else if (signType == 6) {

                            if (creep.signController(controller, "Adults spend a combined 13 years of their life under a dictatorship: the workplace") == ERR_NOT_IN_RANGE) {}
                        }
                    } else {

                        creep.intraRoomPathing(creep.pos, controller)
                    }
                } else {

                    let targetRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, creep.memory.roomFrom)

                    if (targetRoomDistance == 1 && !controller.owner && !controller.reservation) {

                        let sources = creep.room.find(FIND_SOURCES).length

                        let duplicateRoom = false

                        for (let object of Memory.rooms[creep.memory.roomFrom].remoteRooms) {

                            if (object.name == creep.room.name) {

                                duplicateRoom = true
                                break
                            }
                        }

                        if (duplicateRoom == false) {

                            Memory.rooms[creep.memory.roomFrom].remoteRooms.push({ name: creep.room.name, sources: sources, roads: false, builderNeed: false, enemy: false, distance: null })
                        }
                    }

                    let newCommune = false

                    if (creep.room.find(FIND_SOURCES).length == 2 && Game.gcl < Memory.global.communesCount && room.memory.claim != "notViable") {

                        let nearbyCommune = false

                        for (let commune of Memory.global.communes) {

                            let targetRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, commune)

                            if (targetRoomDistance <= 1) {

                                nearbyCommune = true
                            }
                        }

                        if (nearbyCommune == false) {

                            construction.run()
                            if (anchorPoints[0]) {

                                newCommune = true
                            } else {

                                room.memory.claim = "notViable"
                            }
                        } else {

                            room.memory.claim = "notViable"
                        }
                    }

                    if (!controller.my && controller.owner && controller.owner.username.indexOf(allyList) >= 0) {

                        creep.room.memory.stage = "allyRoom"
                    } else {

                        creep.room.memory.stage = "enemyRoom"
                    }

                    if (!controller.my && !controller.owner) {

                        creep.room.memory.stage = "neutralRoom"
                    }
                    if (newCommune == false) {

                        creep.offRoadPathing(origin, goal)
                    }
                }
            } else {

                creep.room.memory.stage = "emptyRoom"

                creep.offRoadPathing(origin, goal)
            }
        }
    }
};