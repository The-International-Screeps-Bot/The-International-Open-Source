let { structures } = require("roomVariables")
require("creepFunctions")

Room.prototype.get = function(roomObject) {

    let room = this

    // If value is cached in global return it

    if (cachedValues[room.name] && cachedValues[room.name].roomObjects && cachedValues[room.name].roomObjects[roomObject]) {

        console.log("got from cache " + JSON.stringify(cachedValues[room.name].roomObjects[roomObject]))
        return cachedValues[room.name].roomObjects[roomObject]
    }

    // If value isn't in global recreate values

    let roomObjects = {}

    // Structures
    roomObjects.allStructures = room.find(FIND_STRUCTURES)
    roomObjects.allyStructures = "Coming soon near you"
    roomObjects.enemyStructures = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => !allyList.indexOf(structure.owner.username)
    })

    roomObjects.spawns = room.find(FIND_MY_SPAWNS)
    roomObjects.extensions = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTENSION)
    roomObjects.towers = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_TOWER)
    roomObjects.links = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LINK)
    roomObjects.labs = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LAB)

    roomObjects.containers = findConstructionOfType(FIND_STRUCTURES, STRUCTURE_CONTAINER)
    roomObjects.roads = findConstructionOfType(FIND_STRUCTURES, STRUCTURE_ROAD)

    roomObjects.controller = room.controller
    roomObjects.storage = room.storage
    roomObjects.terminal = room.terminal

    roomObjects.extractor = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTRACTOR)[0]
    roomObjects.factory = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_FACTORY)[0]
    roomObjects.powerSpawn = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_POWER_SPAWN)[0]

    roomObjects.baseContainer = findContainers("baseContainer")
    roomObjects.controllerContainer = findContainers("controllerContainer")
    roomObjects.mineralContainer = findContainers("mineralContainer")
    roomObjects.sourceContainer1 = findContainers("sourceContainer1")
    roomObjects.sourceContainer2 = findContainers("sourceContainer2")

    roomObjects.baseLink = findLinks("baseLink")
    roomObjects.controllerLink = findLinks("controllerLink")
    roomObjects.sourceLink1 = findLinks("sourceLink1")
    roomObjects.sourceLink2 = findLinks("sourceLink2")

    roomObjects.primaryLabs = findLabs("primaryLabs")
    roomObjects.secondaryLabs = findLabs("secondaryLabs")
    roomObjects.tertiaryLabs = findLabs("tertiaryLabs")

    // Resources
    roomObjects.mineral = room.find(FIND_MINERALS)[0]

    roomObjects.sources = room.find(FIND_SOURCES)
    roomObjects.source1 = findSources("source1")
    roomObjects.source2 = findSources("source2")

    // Construction sites
    roomObjects.allSites = room.find(FIND_CONSTRUCTION_SITES)
    roomObjects.mySites = findObjectWithOwner(FIND_CONSTRUCTION_SITES[me])

    // Creeps
    roomObjects.allCreeps = room.find(FIND_CREEPS)
    roomObjects.myCreeps = findObjectWithOwner(FIND_CREEPS[me])
    roomObjects.allyCreeps = findObjectWithOwner(FIND_HOSTILE_CREEPS, allyList)
    roomObjects.hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // Power creeps
    roomObjects.allPowerCreeps = room.find(FIND_POWER_CREEPS)
    roomObjects.myPowerCreeps = findObjectWithOwner(FIND_CREEPS[me])
    roomObjects.allyPowerCreeps = findObjectWithOwner(FIND_HOSTILE_POWER_CREEPS, allyList)
    roomObjects.hostilePowerCreeps = room.find(FIND_HOSTILE_POWER_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // Other
    roomObjects.anchorPoint = room.memory.anchorPoint

    //

    function findObjectWithOwner(constant, usernames) {

        return room.find(constant, {
            filter: object => usernames.indexOf(object.owner.username)
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

        for (let container of roomObjects.containers) {

            if (roomObjects.anchorPoint && roomObjects.anchorPoint.getRangeTo(container) == 0) {

                cache.baseContainer = container
                continue
            }
            if (roomObjects.controller && container.pos.getRangeTo(roomObjects.controller) <= 2) {

                cache.controllerContainer = container
                continue
            }
            if (roomObjects.mineral && container.pos.getRangeTo(roomObjects.mineral) == 1) {

                cache.mineralContainer = container
                continue
            }

            if (container != cache.sourceContainer2 && container.pos.getRangeTo(roomObjects.source1) == 1) {

                cache.sourceContainer1 = container
                continue
            }
            if (container != cache.sourceContainer1 && container.pos.getRangeTo(roomObjects.source2) == 1) {

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

        for (let link of roomObjects.links) {

            if (roomObjects.storage && link.pos.getRangeTo(roomObjects.storage) == 1) {

                cache.baseLink = link
                continue
            }
            if (link.pos.getRangeTo(roomObjects.controller) <= 2) {

                cache.controllerLink = link
                continue
            }

            if (link != cache.sourceLink2 && roomObjects.sourceContainer1 && link.pos.getRangeTo(roomObjects.sourceContainer1) == 1) {

                cache.sourceLink1 = link
                continue
            }
            if (link != cache.sourceLink1 && roomObjects.sourceContainer2 && link.pos.getRangeTo(roomObjects.sourceContainer2) == 1) {

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

        for (let lab of roomObjects.labs) {

            var nearbyLab = lab.pos.findInRange(roomObjects.labs, 2)

            if (nearbyLab.length == roomObjects.labs.length && cache.primaryLabs.length < 2) {

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

    // Assign new values to cachedValues

    cachedValues[room.name] = { roomObjects: {} }

    for (let property in roomObjects) {

        cachedValues[room.name].roomObjects[property] = roomObjects[property]
    }

    if (roomObject in roomObjects) return roomObjects[roomObject]


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