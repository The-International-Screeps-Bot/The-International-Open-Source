let allyList = require("module.allyList")

Creep.prototype.getMyPart = function(partType) {
    
    creep = this
    
    creep.parts = creep.getActiveBodyparts(WORK)
    
    return creep.parts
}
Creep.prototype.roomHostile = function() {
    
    creep = this
    
    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS)
    
    creep.roomHostiles = _.isEqual(hostiles, allyList)
    
    return creep.roomHostiles
}
Creep.prototype.fleeHostileRoom = function() {
    
    creep = this
    
    if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

        const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

        if (route.length > 0) {

            creep.say(creep.memory.roomFrom)

            const exit = creep.pos.findClosestByRange(route[0].exit);
            creep.moveTo(exit);
        }
    }
}
Creep.prototype.hasEnergy = function() {
    
    creep = this
    
    if (creep.memory.hasEnergy == true && creep.carry.energy == 0) {
    
                creep.memory.hasEnergy = false;
    
            } else if (creep.memory.building == false && creep.carry.energy == creep.carryCapacity) {
    
                creep.memory.hasEnergy = true;
    
            }
}
Creep.prototype.pickupDroppedEnergy = function(target) {
    
    creep = this

    if (creep.pickup(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.energyWithdraw = function(target) {
    
    creep = this

    if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.energyWithdraw = function(target) {
    
    creep = this

    if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.energyTransfer = function(target) {
    
    creep = this

    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.checkRoom = function() {
    
    creep = this
    
    if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

        const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

        if (route.length > 0) {

            creep.say(creep.memory.roomFrom)

            const exit = creep.pos.findClosestByRange(route[0].exit);
            creep.moveTo(exit);
        }
    }
}
Creep.prototype.wallRepair = function(target) {

    creep = this
    
    if (creep.repair(target) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.constructionBuild = function(target) {

    creep = this
    
    if (creep.build(target) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.controllerUpgrade = function(target) {

    creep = this
    
    if (creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            
        creep.memory.origin = creep.pos
    
        let origin = creep.memory.origin
    
        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })
        
        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.searchSourceContainers = function() {
    
    creep = this
    
    let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
                    let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
                    
                    let containerTarget = [sourceContainer1, sourceContainer2]
                    
                    for (var i = 0; i < containerTarget.length; i++) {

                    let container = containerTarget[i]
                    if (container != null) {
                        if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                            creep.container = container
                            break
                        }
                    } else {

                        i = 0

                        break
                    }
                    }
}
Creep.prototype.roadPathing = function(origin, goal) {
    
    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 2,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType === STRUCTURE_ROAD) {

                                            costs.set(struct.pos.x, struct.pos.y, 1)

                                        } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
        room.find(FIND_CREEPS).forEach(function(creep) {
          costs.set(creep.pos.x, creep.pos.y, 0xff);
        });



            return costs

        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.offRoadPathing = function(origin, goal) {
    
    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 1,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType !== STRUCTURE_ROAD && struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
            room.find(FIND_CREEPS).forEach(function(creep) {
              costs.set(creep.pos.x, creep.pos.y, 0xff);
            });


            return costs

        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.intraRoomPathing = function(origin, goal) {
    
    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 2,
        maxRooms: 1,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType === STRUCTURE_ROAD) {

                                            costs.set(struct.pos.x, struct.pos.y, 1)

                                        } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
        room.find(FIND_CREEPS).forEach(function(creep) {
          costs.set(creep.pos.x, creep.pos.y, 0xff);
        });


            return costs

        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.creepFlee = function(origin, target) {

    creep = this

    var path = PathFinder.search(origin, target, {
        plainCost: 1,
        maxRooms: 1,
        flee: true,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
        room.find(FIND_CREEPS).forEach(function(creep) {
          costs.set(creep.pos.x, creep.pos.y, 0xff);
        });


            return costs

        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}