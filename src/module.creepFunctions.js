let allyList = require("module.allyList")

Creep.prototype.findRemoteRoom = function() {

    if (!creep.memory.remoteRoom) {

        for (let remoteRoom of Memory.rooms[creep.memory.roomFrom].remoteRooms) {

            if (remoteRoom.creepsOfRole[creep.memory.role] < remoteRoom.minCreeps[creep.memory.role]) {

                creep.memory.remoteRoom = remoteRoom
            }
        }
    }
}

Creep.prototype.barricadesFindAndRepair = function() {

        if (creep.memory.target) {

            let barricade = Game.getObjectById(creep.memory.target)

            if (barricade.hits < barricade.hitsMax && barricade.hits < (creep.memory.quota + creep.myParts("work") * 1000)) {

                creep.repairBarricades(barricade)
            } else {

                creep.memory.target = undefined
            }
        } else {

            var barricades = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
            })

            for (let quota = creep.myParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.myParts("work") * 1000) {

                let barricade = creep.room.find(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
                })

                if (barricade.length > 0) {

                    barricade = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
                    })

                    creep.memory.target = barricade.id
                    creep.memory.quota = quota

                    return
                } else {

                    creep.say("No target")
                }
            }
        }
    }
    /*
    Creep.prototype.barricadesFindAndRepair = function() {

        var barricades = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
        })

        for (let quota = creep.myParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.myParts("work") * 1000) {

            quota += creep.myParts("work") * 500

            let barricade = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
            })

            if (barricade) {

                creep.say(quota / 1000 + "k")

                creep.repairBarricades(barricade)

                return
            } else {

                creep.say("No target")
            }
        }
    }
    */

Creep.prototype.myParts = function(partType) {

    creep = this

    let partsAmount = 0

    for (let part of creep.body) {

        if (part.type == partType) {

            partsAmount++
        }
    }
    return partsAmount
}
Creep.prototype.findEnergyHarvested = function(source) {

    creep = this

    let energyHarvested = source.energy - source.energy + creep.myParts("work")

    creep.say("⛏️ " + energyHarvested)
    Memory.stats.energyHarvested += energyHarvested
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
Creep.prototype.isFull = function() {

    creep = this

    if (creep.store.getUsedCapacity() == 0) {

        creep.memory.isFull = false;

    } else if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {

        creep.memory.isFull = true;

    }
}
Creep.prototype.hasResource = function() {

    creep = this

    if (creep.store.getUsedCapacity() === 0) {

        creep.memory.isFull = false;

    } else {

        creep.memory.isFull = true;

    }
}
Creep.prototype.pickupDroppedEnergy = function(target) {

    if (creep.pos.isNearTo(target)) {

        creep.pickup(target, RESOURCE_ENERGY)
        return 0

    } else {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.advancedWithdraw = function(target, resource, amount) {

    if (!resource) {

        resource = RESOURCE_ENERGY
    }
    if (!amount || amount > creep.store.getCapacity()) {

        amount = creep.store.getCapacity()
    }

    if (creep.pos.isNearTo(target)) {

        creep.withdraw(target, resource, [amount])
        return 0

    } else {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.advancedTransfer = function(target, resource) {

    if (!resource) {

        resource = RESOURCE_ENERGY
    }

    if (creep.pos.isNearTo(target)) {

        creep.transfer(target, resource)
        return 0

    } else {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
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
Creep.prototype.repairBarricades = function(target) {

    creep = this

    if (creep.repair(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.repairStructure = function(target) {

    creep = this

    if (creep.repair(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.constructionBuild = function(target) {

    creep = this

    if (creep.build(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.controllerUpgrade = function(target) {

    if (!creep.pos.inRangeTo(creep.room.controller, 3)) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    } else if (creep.upgradeController(target) == 0) {

        creep.say("🔋 " + creep.myParts("work"))
        Memory.stats.controlPoints += creep.myParts("work")
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

    //new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
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
            room.find(FIND_POWER_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });


            return costs
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.onlySafeRoomPathing = function(origin, goal) {

    creep = this

    let allowedRooms = {
        [origin.roomName]: true
    };
    Game.map.findRoute(origin.roomName, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (Memory.rooms[roomName].stage == "enemyRoom" && Memory.rooms[roomName].attackTarget != true) {

                return Infinity
            } else {

                return 1
            }
        }
    }).forEach(function(info) {
        allowedRooms[info.room] = true;
    })

    var path = PathFinder.search(origin, goal, {
        plainCost: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            if (allowedRooms[roomName] === undefined) {

                return false
            }

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
            room.find(FIND_POWER_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });

            return costs
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.rampartPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 10,
        swampCost: 50,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let costs = new PathFinder.CostMatrix

            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {

                    costs.set(struct.pos.x, struct.pos.y, 5)

                } else if (struct.structureType !== STRUCTURE_CONTAINER && struct.structureType != STRUCTURE_RAMPART) {

                    costs.set(struct.pos.x, struct.pos.y, 0xff)

                } else if (struct.structureType === STRUCTURE_RAMPART) {

                    costs.set(struct.pos.x, struct.pos.y, 1)

                }
            })
            room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {

                    costs.set(struct.pos.x, struct.pos.y, 5)

                } else if (struct.structureType !== STRUCTURE_CONTAINER && struct.structureType !== STRUCTURE_RAMPART) {

                    costs.set(struct.pos.x, struct.pos.y, 0xff)

                }
            })
            room.find(FIND_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });
            room.find(FIND_POWER_CREEPS).forEach(function(creep) {
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
            room.find(FIND_POWER_CREEPS).forEach(function(creep) {
                costs.set(creep.pos.x, creep.pos.y, 0xff);
            });

            return costs
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}