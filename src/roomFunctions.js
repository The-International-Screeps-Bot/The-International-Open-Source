let { structures } = require("roomVariables")

Room.prototype.get = function(roomVar) {

    let room = this

    // If value is cached in cachedValues return it

    if (cachedValues[room.name] && cachedValues[room.name].roomVars && cachedValues[room.name].roomVars[roomVar]) return cachedValues[room.name].roomVars[roomVar]

    // If value isn't cached recreate roomVars

    let roomVars = {}

    // Structures
    roomVars.allStructures = room.find(FIND_STRUCTURES)
    roomVars.allyStructures = findObjectWithOwner(FIND_HOSTILE_STRUCTURES, allyList)
    roomVars.enemyStructures = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => !allyList.indexOf(structure.owner.username)
    })

    roomVars.spawns = room.find(FIND_MY_SPAWNS)
    roomVars.extensions = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTENSION)
    roomVars.towers = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_TOWER)
    roomVars.links = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LINK)
    roomVars.labs = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LAB)

    roomVars.containers = findConstructionOfType(FIND_STRUCTURES, STRUCTURE_CONTAINER)
    roomVars.roads = findConstructionOfType(FIND_STRUCTURES, STRUCTURE_ROAD)

    roomVars.controller = room.controller
    roomVars.storage = room.storage
    roomVars.terminal = room.terminal

    roomVars.extractor = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTRACTOR)[0]
    roomVars.factory = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_FACTORY)[0]
    roomVars.powerSpawn = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_POWER_SPAWN)[0]

    roomVars.baseContainer = findContainers("baseContainer")
    roomVars.controllerContainer = findContainers("controllerContainer")
    roomVars.mineralContainer = findContainers("mineralContainer")
    roomVars.sourceContainer1 = findContainers("sourceContainer1")
    roomVars.sourceContainer2 = findContainers("sourceContainer2")

    roomVars.baseLink = findLinks("baseLink")
    roomVars.controllerLink = findLinks("controllerLink")
    roomVars.sourceLink1 = findLinks("sourceLink1")
    roomVars.sourceLink2 = findLinks("sourceLink2")

    roomVars.primaryLabs = findLabs("primaryLabs")
    roomVars.secondaryLabs = findLabs("secondaryLabs")
    roomVars.tertiaryLabs = findLabs("tertiaryLabs")

    // Resources
    roomVars.mineral = room.find(FIND_MINERALS)[0]

    roomVars.sources = room.find(FIND_SOURCES)
    roomVars.source1 = findSources("source1")
    roomVars.source2 = findSources("source2")

    // Construction sites
    roomVars.allSites = room.find(FIND_CONSTRUCTION_SITES)
    roomVars.mySites = findObjectWithOwner(FIND_CONSTRUCTION_SITES[me])

    // Creeps
    roomVars.allCreeps = room.find(FIND_CREEPS)
    roomVars.myCreeps = findObjectWithOwner(FIND_CREEPS, [me])
    roomVars.allyCreeps = findObjectWithOwner(FIND_HOSTILE_CREEPS, allyList)
    roomVars.hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // Power creeps
    roomVars.allPowerCreeps = room.find(FIND_POWER_CREEPS)
    roomVars.myPowerCreeps = findObjectWithOwner(FIND_CREEPS, [me])
    roomVars.allyPowerCreeps = findObjectWithOwner(FIND_HOSTILE_POWER_CREEPS, allyList)
    roomVars.hostilePowerCreeps = room.find(FIND_HOSTILE_POWER_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // Other
    roomVars.anchorPoint = room.memory.anchorPoint
    roomVars.storedEnergy = storedEnergy()

    //

    function findObjectWithOwner(constant, usernames) {

        return room.find(constant, {
            filter: object => object.owner && usernames.indexOf(object.owner.username)
        })
    }

    function findConstructionOfType(constant, type) {

        return room.find(constant, {
            filter: construction => construction.structureType == type
        })
    }

    function findSources(desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        if (sources[0]) cache.source1 = sources[0]

        if (sources[1]) cache.source2 = sources[1]

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findContainers(desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        for (let container of roomVars.containers) {

            if (roomVars.anchorPoint && roomVars.anchorPoint.getRangeTo(container) == 0) {

                cache.baseContainer = container
                continue
            }
            if (roomVars.controller && container.pos.getRangeTo(roomVars.controller) <= 2) {

                cache.controllerContainer = container
                continue
            }
            if (roomVars.mineral && container.pos.getRangeTo(roomVars.mineral) == 1) {

                cache.mineralContainer = container
                continue
            }

            if (container != cache.sourceContainer2 && container.pos.getRangeTo(roomVars.source1) == 1) {

                cache.sourceContainer1 = container
                continue
            }
            if (container != cache.sourceContainer1 && container.pos.getRangeTo(roomVars.source2) == 1) {

                cache.sourceContainer2 = container
                continue
            }
        }

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findLinks(desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        for (let link of roomVars.links) {

            if (roomVars.storage && link.pos.getRangeTo(roomVars.storage) == 1) {

                cache.baseLink = link
                continue
            }
            if (link.pos.getRangeTo(roomVars.controller) <= 2) {

                cache.controllerLink = link
                continue
            }

            if (link != cache.sourceLink2 && roomVars.sourceContainer1 && link.pos.getRangeTo(roomVars.sourceContainer1) == 1) {

                cache.sourceLink1 = link
                continue
            }
            if (link != cache.sourceLink1 && roomVars.sourceContainer2 && link.pos.getRangeTo(roomVars.sourceContainer2) == 1) {

                cache.sourceLink2 = link
                continue
            }
        }

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findLabs(desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        cache.primaryLabs = []
        cache.secondaryLabs = []
        cache.tertiaryLabs = []

        for (let lab of roomVars.labs) {

            var nearbyLab = lab.pos.findInRange(roomVars.labs, 2)

            if (nearbyLab.length == roomVars.labs.length && cache.primaryLabs.length < 2) {

                cache.primaryLabs.push(lab)
                continue
            }

            cache.secondaryLabs.push(lab)
        }

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function storedEnergy() {

        let storedEnergy = 0

        if (roomVars.storage) storedEnergy += roomVars.storage.store[RESOURCE_ENERGY]

        if (roomVars.terminal) storedEnergy += roomVars.terminal.store[RESOURCE_ENERGY]

        return storedEnergy
    }

    // Assign new values to cachedValues

    cachedValues[room.name] = { roomVars: {} }

    for (let property in roomVars) {

        cachedValues[room.name].roomVars[property] = roomVars[property]
    }

    if (roomVar in roomVars) return roomVars[roomVar]


    console.log("Not a proper room object")
}

Room.prototype.findExitRooms = function(roomName) {

    let exits = Game.map.describeExits(roomName)
    let exitRoomNames = []

    for (let property in exits) {

        exitRoomNames.push(exits[property])
    }

    return exitRoomNames
}
Room.prototype.storedEnergy = function() {

    let storedEnergy = 0

    if (structures.storage) storedEnergy += structures.storage.store[RESOURCE_ENERGY]

    if (structures.terminal) storedEnergy += structures.terminal.store[RESOURCE_ENERGY]

    return storedEnergy
}
Room.prototype.findSafeDistance = function(origin, goal, avoidStages) {

    let route = Game.map.findRoute(origin.roomName, goal.pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal.pos.roomName) {

                return 1
            }
            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                return 1
            }

            return Infinity
        }
    })

    return route.length
}
Room.prototype.findTowerDamage = function(towers, pos) {

    let totalDamage = 0

    for (let tower of towers) {

        let range = tower.pos.getRangeTo(pos)

        if (range <= TOWER_OPTIMAL_RANGE) {

            totalDamage += TOWER_POWER_ATTACK
            continue
        }

        const factor = (range < TOWER_FALLOFF_RANGE) ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE) : 1
        totalDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor));
    }

    creep.room.visual.text(totalDamage, pos.x, pos.y + 0.25, { align: 'center', color: colors.communeBlue, font: "0.7" })

    return totalDamage
}
Room.prototype.findHealPower = function(pos, range, creeps) {

    let healPower = 0

    for (let creep of creeps) {

        if (creep.pos.getRangeTo(pos) <= range) healPower += creep.findParts("heal") * HEAL_POWER
    }

    creep.room.visual.text(healPower, pos.x, pos.y + 0.25, { align: 'center', color: colors.allyGreen, font: "0.7" })

    return healPower
}