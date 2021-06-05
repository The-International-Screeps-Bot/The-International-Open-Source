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

                if ((!controller.sign || controller.sign.username != "MarvinTMB") && (!controller.owner.username || controller.owner.username == "MarvinTMB")) {

                    creep.say("Signing")

                    let goal = _.map([controller], function(controller) {
                        return { pos: controller.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)

                    if (controller.my) {

                        creep.signController(controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
                    } else {
                        //output an integer from 1-6
                        let signType = Math.floor(Math.random(7) * 10)

                        if (signType == 1) {

                            creep.signController(controller, "The top 1% have more money than the poorest 4.5 billion")
                        } else if (signType == 2) {

                            creep.signController(controller, "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour")
                        } else if (signType == 3) {

                            creep.signController(controller, "We have democracy in our policial system, why do we not have it in our companies?")
                        } else if (signType == 4) {

                            creep.signController(controller, "Workers of the world, unite!")
                        } else if (signType == 5) {

                            creep.signController(controller, "Real democracy requires democracy in the workplace - Richard Wolff")
                        } else if (signType == 6) {

                            creep.signController(controller, "Adults spend a combined 13 years of their life under a dictatorship: the workplace")
                        }
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

                    if (creep.room.find(FIND_SOURCES).length == 2 && Game.gcl < Memory.global.communes.length && room.memory.claim != "notViable") {

                        let nearbyCommune = false

                        for (let commune of Memory.global.communes) {

                            let targetRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, commune)

                            if (targetRoomDistance <= 1) {

                                nearbyCommune = true
                            }
                        }

                        if (nearbyCommune == false) {

                            let goal = _.map([controller], function(controller) {
                                return { pos: controller.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                            //run cost matrix
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

                        creep.offRoadPathing(creep.pos, goal)
                    }
                }
            } else {

                creep.room.memory.stage = "emptyRoom"

                creep.offRoadPathing(creep.pos, goal)
            }
        }
    }
};