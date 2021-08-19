PowerCreep.prototype.findRemoteRoom = function() {

    if (!creep.memory.remoteRoom) {

        for (let remoteRoom of Memory.rooms[creep.memory.roomFrom].remoteRooms) {

            if (remoteRoom.creepsOfRole[creep.memory.role] < remoteRoom.minPowerCreeps[creep.memory.role]) {

                creep.memory.remoteRoom = remoteRoom
            }
        }
    }
}

PowerCreep.prototype.barricadesFindAndRepair = function() {

        if (creep.memory.target) {

            let barricade = Game.getObjectById(creep.memory.target)

            if (barricade.hits < barricade.hitsMax && barricade.hits < (creep.memory.quota + creep.findParts("work") * 1000)) {

                creep.repairBarricades(barricade)
            } else {

                creep.memory.target = undefined
            }
        } else {

            var barricades = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
            })

            for (let quota = creep.findParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.findParts("work") * 1000) {

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
    PowerCreep.prototype.barricadesFindAndRepair = function() {

        var barricades = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
        })

        for (let quota = creep.findParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.findParts("work") * 1000) {

            quota += creep.findParts("work") * 500

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

PowerCreep.prototype.myParts = function(partType) {

    creep = this

    let partsAmount = 0

    for (let part of creep.body) {

        if (part.type == partType) {

            partsAmount++
        }
    }
    return partsAmount
}
PowerCreep.prototype.findEnergyHarvested = function(source) {

    creep = this

    let energyHarvested = source.energy - source.energy + creep.findParts("work")

    creep.say("⛏️ " + energyHarvested)
    Memory.data.energyHarvested += energyHarvested
}
PowerCreep.prototype.isFull = function() {

    creep = this

    if (creep.store.getUsedCapacity() == 0) {

        creep.memory.isFull = false;

    } else if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {

        creep.memory.isFull = true;

    }
}
PowerCreep.prototype.hasResource = function() {

    creep = this

    if (creep.store.getUsedCapacity() === 0) {

        creep.memory.isFull = false;

    } else {

        creep.memory.isFull = true;

    }
}
PowerCreep.prototype.pickupDroppedEnergy = function(target) {

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
PowerCreep.prototype.advancedWithdraw = function(target, resource, amount) {

    if (!resource) {

        resource = RESOURCE_ENERGY
    }
    if (!amount || amount > creep.store.getFreeCapacity()) {

        amount = creep.store.getFreeCapacity()
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
PowerCreep.prototype.advancedTransfer = function(target, resource) {

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
PowerCreep.prototype.repairBarricades = function(target) {

    creep = this

    if (creep.repair(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
PowerCreep.prototype.repairStructure = function(target) {

    creep = this

    if (creep.repair(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
PowerCreep.prototype.buildSite = function(target) {

    creep = this

    if (creep.build(target) == ERR_NOT_IN_RANGE) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
PowerCreep.prototype.controllerUpgrade = function(target) {

    if (!creep.pos.inRangeTo(creep.room.controller, 3)) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)
    } else if (creep.upgradeController(target) == 0) {

        creep.say("🔋 " + creep.findParts("work"))
        Memory.data.controlPoints += creep.findParts("work")
    }

}
PowerCreep.prototype.searchSourceContainers = function() {

    creep = this

    let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
    let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

    let containerTarget = [sourceContainer1, sourceContainer2]

    for (var i = 0; i < containerTarget.length; i++) {

        let container = containerTarget[i]
        if (container != null) {
            if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                container = container
                break
            }
        } else {

            i = 0

            break
        }
    }
}
PowerCreep.prototype.findDamagePossible = function(creep, healers, towers) {

    let distance = creep.pos.getRangeTo(creep.pos.findClosestByRange(towers))

    let towerDamage = (C.TOWER_FALLOFF * (distance - C.TOWER_OPTIMAL_RANGE) / (C.TOWER_FALLOFF_RANGE - C.TOWER_OPTIMAL_RANGE)) * towers.length

    let healAmount = 0

    if (creep) {

        for (let part of creep.body) {

            if (part.type == TOUGH && part.boost) {

                towerDamage = towerDamage * 0.3
                break
            }
        }
    }

    if (healers.length > 0) {

        for (let healer of healers) {

            for (let part in healer.body) {

                if (part.type == HEAL) {

                    if (part.boost == RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE) {

                        healAmount += 36

                    } else if (part.boost == RESOURCE_LEMERGIUM_ALKALIDE) {

                        healAmount += 24

                    } else if (part.boost == RESOURCE_LEMERGIUM_OXIDE) {

                        healAmount += 12
                    }

                    healAmount += 12
                }
            }
        }
    }

    let damagePossible = towerDamage - healAmount

    return damagePossible
}
PowerCreep.prototype.findClosestDistancePossible = function(creep, healers, closestTower, towerCount) {

    let distance = creep.pos.getRangeTo(creep.pos.findClosestByRange(towers))

    let towerDamage = (C.TOWER_FALLOFF * (distance - C.TOWER_OPTIMAL_RANGE) / (C.TOWER_FALLOFF_RANGE - C.TOWER_OPTIMAL_RANGE)) * towers.length

    let healAmount = 0

    if (creep) {

        for (let part of creep.body) {

            if (part.type == TOUGH && part.boost) {

                towerDamage = towerDamage * 0.3
                break
            }
        }
    }

    if (healers.length > 0) {

        for (let healer of healers) {

            for (let part in healer.body) {

                if (part.type == HEAL) {

                    if (part.boost == RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE) {

                        healAmount += 36

                    } else if (part.boost == RESOURCE_LEMERGIUM_ALKALIDE) {

                        healAmount += 24

                    } else if (part.boost == RESOURCE_LEMERGIUM_OXIDE) {

                        healAmount += 12
                    }

                    healAmount += 12
                }
            }
        }
    }

    let damagePossible = towerDamage - healAmount

    let i = 0

    while (damagePossible > 0 || i < 50) {

        distance++

    }

    if (distance > 0) {

        return distance
    } else {

        return false
    }
}
PowerCreep.prototype.roadPathing = function(origin, goal) {

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
            room.find(FIND_MY_CONSTRUCTION_SITES).forEach(function(struct) {
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
PowerCreep.prototype.offRoadPathing = function(origin, goal) {

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
            room.find(FIND_MY_CONSTRUCTION_SITES).forEach(function(struct) {
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
PowerCreep.prototype.intraRoomPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 2,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let ramparts = room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                })

                for (let structure of structures) {

                    if (structure.structureType != STRUCTURE_CONTAINER) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
PowerCreep.prototype.onlySafeRoomPathing = function(origin, goal) {

    creep = this

    let allowedRooms = {
        [origin.roomName]: true,
        [goal[0].pos.roomName]: true
    }

    let route = Game.map.findRoute(origin.roomName, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (Memory.rooms[roomName] && Memory.rooms[roomName].stage != "enemyRoom" && Memory.rooms[roomName].stage != "keeperRoom") {

                allowedRooms[roomName] = true
                return 1

            } else {

                return Infinity
            }
        }
    })

    console.log("Route: " + JSON.stringify(route))

    if (route.length > 0) {

        let goal = _.map([new RoomPosition(25, 25, route[0].room)], function(pos) {
            return { pos: pos, range: 1 }
        })

        var path = PathFinder.search(origin, goal, {
            plainCost: 1,

            roomCallback: function(roomName) {

                let room = Game.rooms[roomName]

                if (!room) return false

                if (!allowedRooms[roomName]) return false

                let cm

                if (room.memory.defaultCostMatrix) {

                    cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                    for (let creep of room.find(FIND_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    for (let creep of room.find(FIND_POWER_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }
                } else {

                    cm = new PathFinder.CostMatrix

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 1)
                    }

                    let roads = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_ROAD
                    })

                    for (let road of roads) {

                        cm.set(road.pos.x, road.pos.y, 1)
                    }

                    let structures = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                    })

                    for (let structure of structures) {

                        if (structure.structureType != STRUCTURE_CONTAINER) {

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }
                    }

                    for (let creep of room.find(FIND_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    for (let creep of room.find(FIND_POWER_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }
                }

                return cm
            }
        }).path

        creep.memory.path = path

        creep.moveByPath(creep.memory.path)

        new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
    }
}
PowerCreep.prototype.rampartPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 10,
        swampCost: 50,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            cm = new PathFinder.CostMatrix

            let ramparts = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            for (let rampart of ramparts) {

                cm.set(rampart.pos.x, rampart.pos.y, 1)
            }

            let structures = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
            })

            for (let structure of structures) {

                if (structure.structureType != STRUCTURE_CONTAINER) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }
            }

            for (let creep of room.find(FIND_CREEPS)) {

                cm.set(creep.pos.x, creep.pos.y, 255)
            }

            for (let creep of room.find(FIND_POWER_CREEPS)) {

                cm.set(creep.pos.x, creep.pos.y, 255)
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
PowerCreep.prototype.creepFlee = function(origin, target) {

    creep = this

    var path = PathFinder.search(origin, target, {
        plainCost: 1,
        maxRooms: 1,
        flee: true,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let ramparts = room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                })

                for (let structure of structures) {

                    if (structure.structureType != STRUCTURE_CONTAINER) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}