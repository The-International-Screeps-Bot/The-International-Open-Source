module.exports = {
    run: function(creep) {
        
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
                
                    targetRoomsArray.push({name: room, scoutTick: Memory.rooms[room].scoutTick})
                }
            }
            
            for (let i = 0; i < targetRoomsArray.length; i++) {
                
                let room = targetRoomsArray[i]
                
                if (!room.scoutTick) {
                    
                    targetRoom = room.name
                    break
                }
                else if (i == targetRoomsArray.length) {
                    
                    min = true
                }
            }
            
            if (min == true) {
                
                lowestScoutTick = _.min(targetRoomsArray.scoutTick, function(scoutRoom) {
                    return scoutRoom.scoutTick
                })
                
                for (let room of targetRoomsArray) {
                    
                    if (lowestScoutTick == room.scoutTick) {
                        
                        targetRoom = room.name
                        break
                    }
                }
            }
        }
        
        if (targetRoom) {
        
            creep.memory.goal = new RoomPosition(25, 25, targetRoom)
            
            creep.memory.origin = creep.pos
    
            let origin = creep.memory.origin
    
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
    
                creep.say(targetRoom)
                
                creep.room.memory.scoutTick = Game.time
                
                if (creep.room.controller) { console.log(creep.room.controller.owner)
                    
                    if (!creep.room.controller.my && creep.room.controller.owner) {
                    
                        creep.room.memory.stage = "enemyRoom"
                    }
                }
                else {
                    
                    creep.room.memory.stage = "emptyRoom"
                }
    
                let pathing = require("module.pathing")
    
                creep.pathing(origin, goal)
            }
        }
    }
};