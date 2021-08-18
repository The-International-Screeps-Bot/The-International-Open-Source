let { structures } = require("roomVariables")
require("creepFunctions")

Room.prototype.get = function(roomObject) {

    let room = this

    if (cachedValues[roomObject]) return cachedValues[roomObject]



    cacheValue(Object.values(roomObjects))

    if (roomObject[roomObject]) return roomObject[roomObject]

    console.log("Not a proper room object")
}
Room.prototype.makeVariables = function() {


}

/* Room.prototype.get = function(roomObject) {

    let room = this

    if (cachedValues[roomObject]) return cachedValues[roomObject]

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

    function findSources(sources, desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        if (sources[0]) cache.source1 = sources[0]

        if (sources[1]) cache.source2 = sources[1]

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findContainers(containers, desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        for (let container of containers) {

            if (room.get("anchorPoint") && room.get("anchorPoint").getRangeTo(container) == 0) {

                cache.baseContainer = container
                continue
            }
            if (room.get(controller) && container.pos.getRangeTo(room.get(controller)) <= 2) {

                cache.controllerContainer = container
                continue
            }
            if (room.get(mineral) && container.pos.getRangeTo(room.get(mineral)) == 1) {

                cache.mineralContainer = container
                continue
            }

            if (container != cache.sourceContainer2 && container.pos.getRangeTo(room.get(source1)) == 1) {

                cache.sourceContainer1 = container
                continue
            }
            if (container != cache.sourceContainer1 && container.pos.getRangeTo(room.get(source2)) == 1) {

                cache.sourceContainer2 = container
                continue
            }
        }

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findLinks(links, desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        for (let link of links) {

            if (room.get(storage) && link.pos.getRangeTo(room.get(storage)) == 1) {

                cache.baseLink = link
                continue
            }
            if (link.pos.getRangeTo(room.get(controller)) <= 2) {

                cache.controllerLink = link
                continue
            }

            if (link != cache.sourceLink2 && room.get(sourceContainer1) && link.pos.getRangeTo(room.get(sourceContainer1)) == 1) {

                cache.sourceLink1 = link
                continue
            }
            if (link != cache.sourceLink1 && room.get(sourceContainer2) && link.pos.getRangeTo(room.get(sourceContainer2)) == 1) {

                cache.sourceLink2 = link
                continue
            }
        }

        for (let object in cache) {

            room.memory[object] = cache[object.id]
        }

        return cache[desiredObject]
    }

    function findLabs(labs, desiredObject) {

        if (findObjectWithId(room.memory[desiredObject])) return findObjectWithId(room.memory[desiredObject])

        let cache = {}

        cache.primaryLabs = []
        cache.secondaryLabs = []
        cache.tertiaryLabs = []

        for (let lab of labs) {

            var nearbyLab = lab.pos.findInRange(labs, 2)

            if (nearbyLab.length == labs.length && primaryLabs.length < 2) {

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

    let containers = findConstructionOfType(FIND_STRUCTURES, STRUCTURE_CONTAINER)
    let links = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LINK)
    let labs = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LAB)

    let sources = room.find(FIND_SOURCES)

    let roomObjects = {

        // Other
        anchorPoint: room.memory.anchorPoint,

        // Structures
        allStructures: room.find(FIND_STRUCTURES),
        enemyStructures: room.find(FIND_HOSTILE_STRUCTURES, {
            filter: structure => !allyList.indexOf(structure.owner.username)
        }),

        spawns: room.find(FIND_MY_SPAWNS),
        extensions: findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTENSION),
        towers: findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_TOWER),
        links: links,
        labs: labs,

        containers: containers,
        roads: findConstructionOfType(FIND_STRUCTURES, STRUCTURE_ROAD),

        controller: room.controller,
        storage: room.storage,
        terminal: room.terminal,

        extractor: findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTRACTOR)[0],
        factory: findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_FACTORY)[0],
        powerSpawn: findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_POWER_SPAWN)[0],

        baseContainer: findContainers(containers, "baseContainer"),
        controllerContainer: findContainers(containers, "controllerContainer"),
        mineralContainer: findContainers(containers, "mineralContainer"),
        sourceContainer1: findContainers(containers, "sourceContainer1"),
        sourceContainer2: findContainers(containers, "sourceContainer2"),

        baseLink: findLinks(links, "baseLink"),
        controllerLink: findLinks(links, "controllerLink"),
        sourceLink1: findLinks(links, "sourceLink1"),
        sourceLink2: findLinks(links, "sourceLink2"),

        primaryLabs: findLabs(labs, "primaryLabs"),
        secondaryLabs: findLabs(labs, "secondaryLabs"),
        tertiaryLabs: findLabs(labs, "tertiaryLabs"),

        // Resources
        mineral: room.find(FIND_MINERALS)[0],

        sources: sources,
        source1: findSources(sources, "source1"),
        source2: findSources(sources, "source2"),

        // Construction sites
        allSites: room.find(FIND_CONSTRUCTION_SITES),
        mySites: findObjectWithOwner(FIND_CONSTRUCTION_SITES, [me]),

        // Creeps
        allCreeps: room.find(FIND_CREEPS),
        myCreeps: findObjectWithOwner(FIND_CREEPS, [me]),
        allyCreeps: findObjectWithOwner(FIND_HOSTILE_CREEPS, allyList),
        hostileCreeps: room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !allyList.includes(creep.owner.username)
        }),

        // Power creeps
        allPowerCreeps: room.find(FIND_POWER_CREEPS),
        myPowerCreeps: findObjectWithOwner(FIND_CREEPS, [me]),
        allyPowerCreeps: findObjectWithOwner(FIND_HOSTILE_POWER_CREEPS, allyList),
        hostilePowerCreeps: room.find(FIND_HOSTILE_POWER_CREEPS, {
            filter: creep => !allyList.includes(creep.owner.username)
        }),
    }

    cacheValue(Object.values(roomObjects))

    if (roomObject[roomObject]) return roomObject[roomObject]

    console.log("Not a proper room object")
} */
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