Creep.prototype.signWithMessage = function() {

    creep = this

    let signType = Math.floor(Math.random() * (signMessages.length - 1))

    creep.signController(creep.room.get("controller"), signMessages[signType])
}

Creep.prototype.isEdge = function() {

    creep = this

    if (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49) return true

    return false
}

Creep.prototype.withdrawStoredResource = function(minAmount, withdrawAmount, resource) {

    creep = this

    let storedEnergy = creep.room.get("storedEnergy")
    let storage = creep.room.get("storage")
    let terminal = creep.room.get("terminal")

    if (storedEnergy < minAmount || (!storage && !terminal)) return false

    if (!resource) resource = RESOURCE_ENERGY

    function targetWithdrawAmount(target) {

        if (withdrawAmount) return

        return Math.min(creep.store.getFreeCapacity(), storage.store.getUsedCapacity(resource))
    }

    if (storage && storage.store.getUsedCapacity(resource) >= targetWithdrawAmount(storage)) {

        creep.say("S")
        return creep.advancedWithdraw(storage, resource, targetWithdrawAmount(storage))

    } else if (terminal && terminal.store.getUsedCapacity(resource) >= targetWithdrawAmount(terminal)) {

        creep.say("T")
        return creep.advancedWithdraw(terminal, resource, targetWithdrawAmount(terminal))
    }

    return -100
}

Creep.prototype.moveToNextTarget = function(state, target, range) {

    if (!state) return false

    if (creep.pos.getRangeTo != range) {

        creep.travel({
            origin: creep.pos,
            goal: { pos: target, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })
    }
}

Creep.prototype.findRampartToRepair = function(ramparts) {

    let creep = this

    if (findObjectWithId(creep.memory.target) && findObjectWithId(creep.memory.target).hits < creep.memory.quota + creep.findParts("work") * 1000) {

        creep.target = findObjectWithId(creep.memory.target)

    } else {

        for (let quota = creep.memory.quota || creep.findParts("work") * 1000; quota < ramparts[0].hitsMax; quota += creep.findParts("work") * 1000) {

            let rampartsUnderQuota = ramparts.filter(r => r.hits < quota)

            if (rampartsUnderQuota.length == 0) continue

            let rampart = creep.pos.findClosestByRange(rampartsUnderQuota)

            creep.target = rampart
            creep.memory.target = creep.target.id
            creep.memory.quota = quota

            break
        }
    }

    if (creep.target) return true
}

Creep.prototype.repairRamparts = function(target, ramparts) {

    if (!target) return

    creep = this

    creep.room.visual.text("🧱", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.repair(target) == ERR_NOT_IN_RANGE) {

        creep.say("MR")

        creep.travel({
            origin: creep.pos,
            goal: { pos: target.pos, range: 3 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

        let temporaryTarget = ramparts.filter(rampart => creep.pos.getRangeTo(rampart) <= 3 && rampart.hits < rampart.hitsMax - creep.findParts(WORK) * 100)[0]

        if (temporaryTarget) {

            if (creep.repair(temporaryTarget) == 0) return
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
}
Creep.prototype.hasActivePartsOfTypes = function(partTypes) {

    let creep = this

    for (let partType of partTypes) {

        if (creep.getActiveBodyparts(partType) > 0) return true
    }
}
Creep.prototype.hasBoost = function(partType, boostType) {

    let creep = this

    for (let part of creep.body) {

        if (part.hits == 0) continue
        if (part.type != partType) continue
        if (part.boost != boostType) continue

        return true
    }
}
Creep.prototype.advancedHarvest = function(target) {

    creep = this

    if (creep.harvest(target) != 0) return creep.harvest(target)

    let energyHarvested = (target.energy - target.energy) + (creep.findParts("work") * 2)

    creep.say("⛏️ " + energyHarvested)
    Memory.data.energyHarvested += energyHarvested

    return 0
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

        creep.travel({
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

    creep = this

    if (!target) return
    if (creep.memory.dying) return

    if (!resource) {

        resource = RESOURCE_ENERGY
    }
    if (!amount || amount > creep.store.getFreeCapacity()) {

        amount = Math.min(creep.store.getFreeCapacity(), target.store[resource])
    }

    if (creep.pos.getRangeTo(target) <= 1) {

        return creep.withdraw(target, resource, amount)

    } else {

        creep.travel({
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

        return creep.transfer(target, resource)

    } else {

        creep.travel({
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
Creep.prototype.repairStructure = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🔧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        creep.travel({
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
Creep.prototype.buildSite = function(target) {

    creep = this

    if (creep.pos.getRangeTo(target) > 3) {

        creep.travel({
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

        creep.travel({
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

    let sourceContainers = [creep.room.get("sourceContainer1"), creep.room.get("sourceContainer2")]

    viableContainers = sourceContainers.filter(container => container && container.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity())

    if (viableContainers.length == 0) return false

    return creep.pos.findClosestByRange(viableContainers)
}

Creep.prototype.findDroppedEnergyOfAmount = function(amount) {

    creep = this

    let droppedEnergy = creep.room.get("droppedEnergy")

    if (droppedEnergy.length == 0) return false

    droppedEnergyOfAmount = droppedEnergy.filter(resource => resource && resource.amount >= amount)

    if (droppedEnergyOfAmount.length == 0) return false

    return creep.pos.findClosestByRange(droppedEnergyOfAmount)
}
Creep.prototype.remoteRequests = function() {

    creep = this
    let room = creep.room
    let remoteRoomMemory = Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.memory.remoteRoom]

    // Make sure creep is in remoteRoom

    if (!remoteRoomMemory) return

    let enemyCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM, HEAL])
    })

    if (enemyCreeps.length > 0) {

        remoteRoomMemory.enemy = true
    }

    let invaderCores = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
    })

    if (invaderCores.length > 0) {

        remoteRoomMemory.invaderCore = true
    }

    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    let lowEcoStructures = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax * 0.2
    })

    if (mySites.length > 0 || lowEcoStructures.length > 0) {

        remoteRoomMemory.builderNeed = true
    }
}
Creep.prototype.avoidHostiles = function() {

    let creep = this

    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: hostile => !allyList.includes(hostile.owner.username) && hostile.hasActivePartsOfTypes([ATTACK, RANGED_ATTACK])
    })

    if (hostiles.length == 0) return false

    let hostile = creep.pos.findClosestByRange(hostiles)

    if (creep.pos.getRangeTo(hostile) > 5) return false

    creep.say("H R")

    creep.travel({
        origin: creep.pos,
        goal: { pos: hostile.pos, range: 8 },
        plainCost: false,
        swampCost: false,
        defaultCostMatrix: creep.memory.defaultCostMatrix,
        avoidStages: [],
        flee: true,
        cacheAmount: 1,
    })

    return true
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
creep.travel({
    origin: creep.pos,
    goal: { pos: target.pos, range: 1 },
    plainCost: 1,
    swampCost: 1,
    avoidStages: [],
    defaultCostMatrix: 1,
    flee: false,
    cacheAmount: 50,
})
 */
Creep.prototype.travel = function(opts) {

    let creep = this

    // Make sure the creep can move

    if (creep.fatigue > 0 || creep.spawning) return

    // Assign defaults if values arn't provided

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

        opts.cacheAmount = 20
    }

    let origin = opts.origin
    let goal = opts.goal

    if (findInterRoomGoal() == ERR_NO_PATH) return

    function findInterRoomGoal() {

        // If we are in the room of the goal exit function

        if (origin.roomName == goal.pos.roomName) return

        let route = creep.memory.route

        // Check if we need a new route. If so make one

        if (!route || route.length == 0) findNewRoute()

        function findNewRoute() {

            creep.room.visual.text("New Route", creep.pos.x, creep.pos.y - 0.5, { color: '#AAF837' })

            newRoute = Game.map.findRoute(origin.roomName, goal.pos.roomName, {
                routeCallback(roomName) {

                    if (roomName == goal.pos.roomName) return 1

                    if (!Memory.rooms[roomName]) return 5

                    if (!opts.avoidStages.includes(Memory.rooms[roomName].stage)) return 1

                    return Infinity
                }
            })

            route = newRoute
            creep.memory.route = route
        }

        // Make sure we can path to the goal's room

        if (route == ERR_NO_PATH) return ERR_NO_PATH

        // Make sure we have a valid route

        if (!route || route.length == 0) return

        let goalRoom = route[0].room

        if (goalRoom == creep.room.name) {

            route = removePropertyFromArray(route, route[0])
            creep.memory.route = route
        }

        // Set new goal in the goalRoom

        goal = { pos: new RoomPosition(25, 25, goalRoom), range: 1 }
    }

    let path = creep.memory.path
    const lastCache = creep.memory.lastCache
    const lastRoom = creep.memory.lastRoom

    findNewPath()

    function findNewPath() {

        if (!path || lastRoom != creep.room.name || !lastCache || Game.time - lastCache >= opts.cacheAmount) {

            if (path && path.length == 1) {

                let lastPos = path[path.length - 1]
                lastPos = new RoomPosition(lastPos.x, lastPos.y, lastPos.roomName)

                let rangeFromGoal = lastPos.getRangeTo(goal.x, goal.y)
                if (rangeFromGoal == 0) return
            }

            creep.room.visual.text("New Path", creep.pos.x, creep.pos.y + 0.5, { color: colors.neutralYellow })

            let newPath = PathFinder.search(origin, goal, {
                plainCost: opts.plainCost,
                swampCost: opts.swampCost,
                maxRooms: 1,
                maxOps: 100000,
                flee: opts.flee,

                roomCallback: function(roomName) {

                    let room = Game.rooms[roomName]

                    if (!room) return false

                    let cm = new PathFinder.CostMatrix

                    // Prioritize roads if creep will benefit from them

                    if (opts.swampCost != 1) {

                        for (let road of room.get("roads")) {

                            cm.set(road.pos.x, road.pos.y, 1)
                        }
                    }

                    // Find each exit pos and set to unwalkable if goal is in room

                    if (goal.pos.roomName == room.name) {

                        for (let x = 0; x < 50; x++) {

                            for (let y = 0; y < 50; y++) {

                                if (x <= 0 || x >= 49 || y <= 0 || y >= 49) cm.set(x, y, 255)
                            }
                        }
                    }

                    // Set sorrounding area of hostileCreeps to unwalkable if position does not have a rampart

                    for (let hostile of room.get("hostileCreeps")) {

                        cm.set(hostile.pos.x, hostile.pos.y, 255)
                    }

                    // Set unwalkable mySites as unwalkable

                    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => (s.structureType != STRUCTURE_RAMPART || (s.structureType == STRUCTURE_RAMPART && !s.my)) && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let site of mySites) {

                        cm.set(site.pos.x, site.pos.y, 255)
                    }

                    // Set unwalkable structures as unwalkable

                    let structures = room.find(FIND_STRUCTURES, {
                        filter: s => (s.structureType != STRUCTURE_RAMPART || (s.structureType == STRUCTURE_RAMPART && !s.my)) && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let structure of structures) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

                    // Set all creeps as unwalkable

                    for (let creep of room.get("allCreeps")) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    // Set all power creeps as unwalkable

                    for (let creep of room.get("allPowerCreeps")) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    return cm
                }
            }).path

            // Change path to newPath

            path = newPath
            creep.memory.path = path

            // Record room to track if we enter a new room

            creep.memory.lastRoom = creep.room.name

            // Record time to find next time to path

            creep.memory.lastCache = Game.time
        }
    }

    if (moveWithPath() == ERR_NO_PATH) return

    function moveWithPath() {

        if (!path || path.length == 0) return

        let pos = path[0]

        if (!pos) return

        // Move to first position of path

        let direction = creep.pos.getDirectionTo(new RoomPosition(pos.x, pos.y, creep.room.name))
        if (creep.move(direction) == ERR_NO_PATH) return

        // Show path if move worked

        creep.room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

        // Delete pos from path

        path = removePropertyFromArray(path, pos)
        creep.memory.path = path

        /* if (creep.move(creep.pos.getDirectionTo(new RoomPosition(pos.x, pos.y, creep.room.name))) != 0) return
    
                if (creep.pos != pos) return
    
                creep.room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })
    
                path = removePropertyFromArray(path, pos)
                creep.memory.path = path */
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
        plainCost: 255,
        swampCost: 255,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            cm = new PathFinder.CostMatrix

            let roads = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_ROAD
            })

            for (let road of roads) {

                cm.set(road.pos.x, road.pos.y, 50)
            }

            let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            for (let rampart of ramparts) {

                cm.set(rampart.pos.x, rampart.pos.y, 1)
            }

            let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
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