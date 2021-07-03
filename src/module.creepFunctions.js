let allyList = require("module.allyList")


Creep.prototype.isEdge = function() {

    if (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49) {

        return true
    }

    return false
}
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
    Memory.data.energyHarvested += energyHarvested
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
Creep.prototype.repairBarricades = function(target) {

    creep = this

    creep.room.visual.text("🧱", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.repair(target) == 0) {

        creep.say("🧱 " + creep.myParts("work"))

        Memory.data.energySpentOnBarricades += creep.myParts("work")
    }
}
Creep.prototype.repairStructure = function(target) {

    creep = this

    creep.room.visual.text("🔧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.repair(target) == 0) {


        creep.say("🔧 " + creep.myParts("work"))

        Memory.data.energySpentOnRepairs += creep.myParts("work")
    }
}
Creep.prototype.constructionBuild = function(target) {

    creep = this

    creep.room.visual.text("🚧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.build(target) == 0) {

        creep.say("🚧 " + creep.myParts("work"))

        Memory.data.energySpentOnConstruction += creep.myParts("work")
    }
}
Creep.prototype.controllerUpgrade = function(target) {

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.upgradeController(target) == 0) {

        creep.say("🔋 " + creep.myParts("work"))
        Memory.data.controlPoints += creep.myParts("work")
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
Creep.prototype.avoidHostiles = function() {

    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => {
            return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0))
        }
    })

    if (hostiles.length > 0) {
        for (let hostile of hostiles) {

            if (creep.pos.getRangeTo(hostile) <= 6) {

                creep.say("H! RUN RUN")

                let goal = _.map([hostile], function(target) {
                    return { pos: target.pos, range: 7 }
                })

                creep.creepFlee(creep.pos, goal)
                break
            }
        }
    }
}
Creep.prototype.findDamagePossible = function(creep, healers, towers) {

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
Creep.prototype.findClosestDistancePossible = function(creep, healers, closestTower, towerCount) {

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
Creep.prototype.roadPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 3,
        swampCost: 8,

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

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
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

    //new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.offRoadPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 1,
        swampCost: 8,

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

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
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
Creep.prototype.intraRoomPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 3,
        swampCost: 8,
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

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
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
Creep.prototype.onlySafeRoomPathing = function(origin, goal, avoidStages) {

    creep = this

    let allowedRooms = {
        [origin.roomName]: true
    }

    let route = Game.map.findRoute(origin.roomName, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal[0].pos.roomName) {

                allowedRooms[roomName] = true
                return 1

            }
            if (Memory.rooms[roomName] && avoidStages.indexOf(Memory.rooms[roomName].stage) == -1) {

                allowedRooms[roomName] = true
                return 1

            }

            return Infinity
        }
    })

    if (route.length > 0) {

        goal = _.map([new RoomPosition(25, 25, route[0].room)], function(pos) {
            return { pos: pos, range: 1 }
        })
    }

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

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
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

Creep.prototype.findSafeDistance = function(origin, goal, avoidStages) {

    let creep = this

    let allowedRooms = {
        [origin.roomName]: true
    }

    let route = Game.map.findRoute(origin.roomName, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal[0].pos.roomName) {

                allowedRooms[roomName] = true
                return 1

            }
            if (Memory.rooms[roomName] && avoidStages.indexOf(Memory.rooms[roomName].stage) == -1) {

                allowedRooms[roomName] = true
                return 1

            }

            return Infinity
        }
    })

    return route.length
}
Creep.prototype.rampartPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 20,
        swampCost: 60,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            cm = new PathFinder.CostMatrix

            let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
            })

            for (let site of constructionSites) {

                cm.set(site.pos.x, site.pos.y, 255)
            }

            let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            for (let rampart of ramparts) {

                cm.set(rampart.pos.x, rampart.pos.y, 1)
            }

            let roads = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_ROAD
            })

            for (let road of roads) {

                cm.set(road.pos.x, road.pos.y, 10)
            }

            let structures = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
            })

            for (let structure of structures) {

                cm.set(structure.pos.x, structure.pos.y, 255)
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
Creep.prototype.creepFlee = function(origin, target) {

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

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (var x = -1; x < 50; ++x) {
                    for (var y = -1; y < 50; ++y) {

                        if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {

                            cm.set(x, y, 255)
                        }
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