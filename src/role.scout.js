module.exports = {
    run: function(creep) {

        creep.say("Broke")

        //list of rooms with Game.map

        //determine rooms that are 10 or less away from home room (do so in module.constants)

        //scout find room that was checked longest ago

        //scout move to room

        //scout record information

        //scout record tick room was scouted

        //restart loop

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

            creep.memory.goal = new RoomPosition(25, 25, targetRoom)

            let origin = creep.pos

            let goal = _.map([creep.memory.goal], function(target) {
                return { pos: creep.memory.goal, range: 1 }
            })

            if (goal) {
                /*
                    if (creep.room.controller) {
                        
                        if (creep.pos.inRangeTo(creep.room.controller, 1)) {
                    
                            if (creep.room.controller.my) {
                            
                                creep.signController(creep.room.controller, "A commune of The Internationale. Bourgeoisie not welcome here.")
                            }
                            else if (creep.room.controller) {
                                
                                //output an integer from 1-6
                                let signType = Math.floor(Math.random(7) * 10)
            
                                //console.log(signType)
            
                                if (signType == 1) {
            
                                    if (creep.signController(creep.room.controller, "The top 1% have more money than the poorest 4.5 billion") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                } else if (signType == 2) {
            
                                    if (creep.signController(creep.room.controller, "McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                } else if (signType == 3) {
            
                                    if (creep.signController(creep.room.controller, "We have democracy in our policial system, why do we not have it in our companies?") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                } else if (signType == 4) {
            
                                    if (creep.signController(creep.room.controller, "Workers of the world, unite!") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                } else if (signType == 5) {
            
                                    if (creep.signController(creep.room.controller, "Real democracy requires democracy in the workplace - Richard Wolff") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                } else if (signType == 6) {
            
                                    if (creep.signController(creep.room.controller, "Adults spend a combined 13 years of their life under a dictatorship: the workplace") == ERR_NOT_IN_RANGE) {
            
                                        creep.moveTo(creep.room.controller)
            
                                    }
                                }
                            }
                        }
                        else {
                            
                            creep.moveTo(controller, {reusePath: 50})
                        }
                    }
                    */

                if (creep.room.controller) {

                    var targetRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, creep.memeory.roomFrom)

                    console.log(creep.room.controller.reservation.owner + creep.room.name)
                    if (targetRoomDistance == 1 && !reservation) {


                    }

                    if (!creep.room.controller.my && creep.room.controller.owner && creep.room.controller.owner.username != "x") {

                        creep.room.memory.stage = "enemyRoom"
                    } else if (!creep.room.controller.my && creep.room.controller.owner && creep.room.controller.owner.username == "x") {

                        creep.room.memory.stage = "allyRoom"
                    }
                } else {

                    creep.room.memory.stage = "emptyRoom"
                }

                creep.roadPathing(origin, goal)
            }
        }
    }
};