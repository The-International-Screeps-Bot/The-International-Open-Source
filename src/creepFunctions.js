let roomVariables = require("roomVariables")


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

        if (barricade && barricade.hits < barricade.hitsMax && barricade.hits < (creep.memory.quota + creep.findParts("work") * 1000)) {

            creep.repairBarricades(barricade)
        } else {

            creep.memory.target = undefined
        }
    } else {

        var barricades = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
        })

        if (barricades.length == 0) return

        for (let quota = creep.findParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.findParts("work") * 1000) {

            let barricade = creep.room.find(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
            })

            if (barricade.length > 0) {

                barricade = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
                })

                creep.repairBarricades(barricade)

                creep.memory.target = barricade.id
                creep.memory.quota = quota

                break
            } else {

                creep.say("No target")
            }
        }
    }
}
Creep.prototype.findParts = function(partType) {

    creep = this

    let partsAmount = 0

    for (let part of creep.body) {

        if (part.type == partType) partsAmount += 1
    }

    return partsAmount
}
Creep.prototype.hasPartsOfTypes = function(partTypes) {

    let creep = this

    for (let partType of partTypes) {

        if (creep.body.some(part => part.type == partType)) return true
    }

    return false
}
Creep.prototype.advancedHarvest = function(target) {

    creep = this

    if (creep.harvest(target) != 0) return false

    let energyHarvested = (target.energy - target.energy) + (creep.findParts("work") * 2)

    creep.say("⛏️ " + energyHarvested)
    Memory.data.energyHarvested += energyHarvested
}
Creep.prototype.findEnergyHarvested = function(source) {

    creep = this

    let energyHarvested = (source.energy - source.energy) + (creep.findParts("work") * 2)

    creep.say("⛏️ " + energyHarvested)
    Memory.data.energyHarvested += energyHarvested
}
Creep.prototype.findMineralsHarvested = function(mineral) {

    creep = this

    let mineralsHarvested = mineral.mineralAmount - mineral.mineralAmount + creep.findParts("work")

    creep.say("⛏️ " + mineralsHarvested)
    Memory.data.mineralsHarvested += mineralsHarvested
}
Creep.prototype.isFull = function() {

    creep = this

    if (creep.store.getUsedCapacity() == 0) {

        creep.memory.isFull = false

    } else if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {

        creep.memory.isFull = true
    }
}
Creep.prototype.hasResource = function() {

    creep = this

    if (creep.store.getUsedCapacity() === 0) {

        creep.memory.isFull = false

    } else {

        creep.memory.isFull = true

    }
}
Creep.prototype.pickupDroppedEnergy = function(target) {

    if (!target) return

    if (creep.pos.getRangeTo(target) <= 1) {

        creep.pickup(target, RESOURCE_ENERGY)
        return 0

    } else {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })
    }
}
Creep.prototype.advancedWithdraw = function(target, resource, amount) {

    if (!target) return

    if (!resource) {

        resource = RESOURCE_ENERGY
    }
    if (!amount || amount > creep.store.getFreeCapacity()) {

        amount = Math.min(creep.store.getFreeCapacity(), target.store[resource])
    }

    if (creep.pos.getRangeTo(target) <= 1) {

        creep.withdraw(target, resource, amount)
        return 0

    } else {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })
    }
}
Creep.prototype.advancedTransfer = function(target, resource) {

    let creep = this

    if (!target) return

    if (!resource) {

        resource = RESOURCE_ENERGY
    }

    if (creep.pos.getRangeTo(target) <= 1) {

        creep.transfer(target, resource)
        return 0

    } else {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })
    }
}
Creep.prototype.repairBarricades = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🧱", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 3 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

    } else if (creep.repair(target) == 0) {

        creep.say("🧱 " + creep.findParts("work"))

        Memory.data.energySpentOnBarricades += creep.findParts("work")
    }
}
Creep.prototype.repairStructure = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🔧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 3 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

    } else if (creep.repair(target) == 0) {

        creep.say("🔧 " + creep.findParts("work"))

        Memory.data.energySpentOnRepairs += creep.findParts("work")
    }
}
Creep.prototype.constructionBuild = function(target) {

    creep = this

    if (creep.pos.getRangeTo(target) > 3) {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 3 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

    } else if (creep.build(target) == 0) {

        creep.say("🚧 " + creep.findParts("work"))

        Memory.data.energySpentOnConstruction += creep.findParts("work")
    }
}
Creep.prototype.controllerUpgrade = function(target) {

    if (creep.pos.getRangeTo(target) > 3) {

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: target.pos, range: 3 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

    } else if (creep.upgradeController(target) == 0) {

        creep.say("🔋 " + creep.findParts("work"))
        Memory.data.controlPoints += creep.findParts("work")
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
Creep.prototype.isEdge = function() {

    let creep = this

    if ((creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)) return true

    return false
}
Creep.prototype.avoidHostiles = function() {

    let creep = this

    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => {
            return (allyList.indexOf(c.owner.username) === -1 && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0))
        }
    })

    if (hostiles.length > 0) {
        for (let hostile of hostiles) {

            if (creep.pos.getRangeTo(hostile) <= 6) {

                creep.say("H! R")

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: hostile.pos, range: 7 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: true,
                    cacheAmount: 1,
                })

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

/* 
creep.advancedPathing({
    origin: creep.pos,
    goal: { pos: target.pos, range: 1 },
    plainCost: 1,
    swampCost: 1,
    avoidStages: [],
    flee: false,
    cacheAmount: 50,
})
 */
Creep.prototype.advancedPathing = function(opts) {

    let creep = this

    let { creeps, powerCreeps, } = roomVariables(creep.room)

    if (creep.fatigue > 0 || creep.spawning) return

    if (!opts.plainCost) {

        opts.plainCost = 2
    }
    if (!opts.swampCost) {

        opts.swampCost = 6
    }
    if (!opts.avoidStages) {

        opts.avoidStages = []
    }
    if (!opts.flee) {

        opts.flee = false
    }
    if (!opts.cacheAmount) {

        opts.cacheAmount = 10
    }

    if (opts.origin.roomName != opts.goal.pos.roomName) {

        let route = creep.memory.route

        if (!route || route.length == 0) {

            creep.room.visual.text("New Route", creep.pos.x, creep.pos.y - 0.5, { color: '#AAF837' })

            newRoute = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {
                routeCallback(roomName) {

                    if (roomName == opts.goal.pos.roomName) {

                        return 1

                    }
                    if (Memory.rooms[roomName] && !opts.avoidStages.includes(Memory.rooms[roomName].stage)) {

                        return 1
                    }

                    return Infinity
                }
            })

            route = newRoute
            creep.memory.route = route
        }
        if (route && route.length >= 0) {
            if (route[0].room == creep.room.name) {

                route = route.slice(1, route.length + 1)
                creep.memory.route = route
            }

            if (route[0]) {

                opts.goal = { pos: new RoomPosition(25, 25, route[0].room), range: 1 }
            }
        }

        creep.memory.lastRoom = creep.room.name
    }

    let path = creep.memory.path
    const lastCache = Game.time
    const lastRoom = creep.memory.lastRoom

    if (!path || path.length <= 1 || !lastRoom || creep.room.name != lastRoom || !lastCache || lastCache - Game.time > opts.cacheAmount) {

        creep.room.visual.text("New Path", creep.pos.x, creep.pos.y + 0.5, { color: colors.neutralYellow })

        let newPath = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: 1,
            maxOps: 100000,
            flee: opts.flee,

            roomCallback: function(roomName) {

                let room = Game.rooms[roomName]

                if (!room) {

                    return false
                }

                let cm

                cm = new PathFinder.CostMatrix

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (let creep of creeps.allCreeps) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of powerCreeps.allCreeps) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                return cm
            }
        }).path

        path = newPath
        creep.memory.path = path

        creep.memory.lastRoom = creep.room.name
        creep.memory.lastCache = Game.time
    }

    if (path && path.length > 0) {

        let pos = path[0]

        if (!pos) return

        creep.room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

        if (creep.move(creep.pos.getDirectionTo(new RoomPosition(pos.x, pos.y, creep.room.name))) == 0) {

            path = creep.memory.path.slice(1, path.length + 1)
            creep.memory.path = path
        }
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

    avoidStages.push("allyRoom")

    var allowedRooms = {
        [origin.room.name]: true
    }

    let route = Game.map.findRoute(origin.room.name, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal[0].pos.roomName) {

                allowedRooms[roomName] = true
                return 1

            }
            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                allowedRooms[roomName] = true
                return 1
            }

            return Infinity
        }
    })

    if (!route) {

        return
    }
    if (route.length == 0 || !route[0]) {

        return
    }

    creep.memory.route = route

    goal = { pos: new RoomPosition(25, 25, route[0].room), range: 24 }

    var path = PathFinder.search(origin.pos, goal, {
        plainCost: 3,
        swampCost: 8,
        maxRooms: 1,
        maxOps: 10000,

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

    creep.moveByPath(path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
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
        swampCost: 8,
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