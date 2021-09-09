Room.prototype.get = function(roomVar) {

    let room = this

    // If value is cached in cachedValues return it

    if (cachedValues[room.name] && cachedValues[room.name].roomVars && cachedValues[room.name].roomVars[roomVar]) {

        if (roomVar == "terrainCM") console.log("Got from cachedValues: " + JSON.stringify(cachedValues[room.name].roomVars[roomVar]))
        return cachedValues[room.name].roomVars[roomVar]
    }

    // If value isn't cached recreate roomVars

    let roomVars = {}

    // Resources
    roomVars.mineral = room.find(FIND_MINERALS)[0]

    roomVars.sources = room.find(FIND_SOURCES)
    roomVars.source1 = findSources("source1")
    roomVars.source2 = findSources("source2")

    roomVars.droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
        filter: resource => resource.resourceType == RESOURCE_ENERGY
    })

    // Structures
    roomVars.allStructures = room.find(FIND_STRUCTURES)
    roomVars.allyStructures = findObjectWithOwner(FIND_HOSTILE_STRUCTURES, allyList)
    roomVars.enemyStructures = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => !allyList.includes(structure.owner.username)
    })

    roomVars.spawns = room.find(FIND_MY_SPAWNS)
    roomVars.extensions = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_EXTENSION)
    roomVars.towers = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_TOWER)
    roomVars.links = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LINK)
    roomVars.labs = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_LAB)

    roomVars.myRamparts = findConstructionOfType(FIND_MY_STRUCTURES, STRUCTURE_RAMPART)
    roomVars.enemyRamparts = findConstructionOfType(FIND_HOSTILE_STRUCTURES, STRUCTURE_RAMPART)

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

    // Construction sites
    roomVars.allSites = room.find(FIND_CONSTRUCTION_SITES)
    roomVars.mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    // Creeps
    roomVars.allCreeps = room.find(FIND_CREEPS)
    roomVars.myCreeps = findObjectWithOwner(FIND_CREEPS, [me])
    roomVars.allyCreeps = findObjectWithOwner(FIND_HOSTILE_CREEPS, allyList)
    roomVars.hostileCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // Power creeps
    roomVars.allPowerCreeps = room.find(FIND_POWER_CREEPS)
    roomVars.myPowerCreeps = findObjectWithOwner(FIND_POWER_CREEPS, [me])
    roomVars.allyPowerCreeps = findObjectWithOwner(FIND_HOSTILE_POWER_CREEPS, allyList)
    roomVars.hostilePowerCreeps = room.find(FIND_HOSTILE_POWER_CREEPS, {
        filter: creep => !allyList.includes(creep.owner.username)
    })

    // CostMatrixes

    // Other
    roomVars.anchorPoint = room.memory.anchorPoint ? new RoomPosition(room.memory.anchorPoint.x, room.memory.anchorPoint.y, room.memory.anchorPoint.roomName) : false
    roomVars.groupedRampartPositions = findGroupedRampartPositions()
    roomVars.storedEnergy = findStoredEnergy()

    roomVars.source1HarvestPositions = findHarvestPositions("source1")
    roomVars.source2HarvestPositions = findHarvestPositions("source2")

    roomVars.source1LinkPosition = findLinkPositions("source1")
    roomVars.source2LinkPosition = findLinkPositions("source2")

    roomVars.controllerUpgradePosition = []
    roomVars.mineraHarvestPosition = []

    //

    function findObjectWithOwner(constant, usernames) {

        return room.find(constant, {
            filter: object => object.owner && usernames.includes(object.owner.username)
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

        if (roomVars.sources[0]) cache.source1 = roomVars.sources[0]

        if (roomVars.sources[1]) cache.source2 = roomVars.sources[1]

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

            room.memory[object] = cache[object].id
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

            room.memory[object] = cache[object].id
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

            room.memory[object] = cache[object].id
        }

        return cache[desiredObject]
    }

    function findHarvestPositions(desiredObject) {

        if (room.memory.harvestPositions && room.memory.harvestPositions[desiredObject]) return room.memory.harvestPositions[desiredObject]

        if (!roomVars.anchorPoint) return
        if (!roomVars.source1 || !roomVars.source2) return

        let cache = {}

        cache.harvestPositions = {}

        let sources = { source1: roomVars.source1, source2: roomVars.source2 }

        for (let sourceName in sources) {

            cache.harvestPositions[sourceName] = { closest: undefined, positions: [] }

            let source = sources[sourceName]
            if (!source) continue

            let top = source.pos.y - 1
            let left = source.pos.x - 1
            let bottom = source.pos.y + 1
            let right = source.pos.x + 1

            let area = room.lookAtArea(top, left, bottom, right, true)

            for (let square of area) {

                let pos = new RoomPosition(square.x, square.y, room.name)
                let type = square.type
                let terrain = square.terrain

                if (type != "terrain" || terrain == "wall") continue

                cache.harvestPositions[sourceName].positions.push(pos)
            }

            cache.harvestPositions[sourceName].closest = roomVars.anchorPoint.findClosestByPath(cache.harvestPositions[sourceName].positions)
        }

        console.log("hi")

        for (let object in cache) {

            room.memory[object] = cache[object]
        }

        if (cache.harvestPositions[desiredObject]) return cache.harvestPositions[desiredObject]

        return []
    }

    function findLinkPositions(desiredObject) {

        return

        if (room.memory.linkPositions && room.memory.linkPositions[desiredObject]) return room.memory.linkPositions[desiredObject]

        if (!roomVars.anchorPoint) return
        if (!roomVars.source1HarvestPositions || !roomVars.source2HarvestPositions) return

        let cache = {}

        cache.linkPositions = {}

        let harvestPositions = { source1: roomVars.source1HarvestPositions, source2: roomVars.source2HarvestPositions }

        for (let sourceName in linkPositions) {

            let closestHarvestPos = linkPositions[sourceName].closest
            if (!closestHarvestPos) continue

            let top = closestHarvestPos.pos.y - 1
            let left = closestHarvestPos.pos.x - 1
            let bottom = closestHarvestPos.pos.y + 1
            let right = closestHarvestPos.pos.x + 1

            let area = room.lookAtArea(top, left, bottom, right, true)

            for (let square of area) {

                let pos = new RoomPosition(square.x, square.y, room.name)
                let type = square.type
                let terrain = square.terrain

                if ((type != "terrain" || terrain == "wall") && (type != "structure")) continue

                cache.linkPositions[sourceName].positions.push(pos)
            }

            cache.linkPositions[sourceName] = roomVars.anchorPoint.findClosestByPath(cache.linkPositions[sourceName].positions)
        }

        console.log("hi")

        for (let object in cache) {

            room.memory[object] = cache[object]
        }

        if (cache.linkPositions[desiredObject]) return cache.linkPositions[desiredObject]

        return []
    }

    function findStoredEnergy() {

        let storedEnergy = 0

        if (roomVars.storage) storedEnergy += roomVars.storage.store.getUsedCapacity(RESOURCE_ENERGY)

        if (roomVars.terminal) storedEnergy += roomVars.terminal.store.getUsedCapacity(RESOURCE_ENERGY)

        return storedEnergy
    }

    function findGroupedRampartPositions() {

        const groupedRampartPositions = room.memory.groupedRampartPositions
        if (!groupedRampartPositions) return

        let newGroupedRampartPositions = []

        for (let group of groupedRampartPositions) {

            let newGroup = []

            for (let pos of group) {

                newGroup.push(new RoomPosition(pos.x, pos.y, pos.roomName))
            }

            newGroupedRampartPositions.push(newGroup)
        }

        return newGroupedRampartPositions
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
Room.prototype.findSafeDistance = function(origin, goal, avoidStages) {

    let route = Game.map.findRoute(origin.roomName, goal.pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal.pos.roomName) return 1

            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) return 1

            if (!Memory.rooms[roomName]) return 5

            return Infinity
        }
    })

    return route.length
}
Room.prototype.findTowerDamage = function(towers, hostile) {

    room = this

    let totalDamage = 0

    for (let tower of towers) {

        let range = tower.pos.getRangeTo(hostile.pos)

        if (range <= TOWER_OPTIMAL_RANGE) {

            totalDamage += TOWER_POWER_ATTACK
            continue
        }

        const factor = (range < TOWER_FALLOFF_RANGE) ? (range - TOWER_OPTIMAL_RANGE) / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE) : 1
        totalDamage += Math.floor(TOWER_POWER_ATTACK * (1 - TOWER_FALLOFF * factor));
    }

    if (hostile.hasBoost(TOUGH, "GO")) totalDamage -= totalDamage * 0.3
    if (hostile.hasBoost(TOUGH, "GHO2")) totalDamage -= totalDamage * 0.5
    if (hostile.hasBoost(TOUGH, "XGHO2")) totalDamage -= totalDamage * 0.7

    room.visual.text(totalDamage, hostile.pos.x, hostile.pos.y + 0.25, { align: 'center', color: colors.allyBlue, font: "0.7" })

    return totalDamage
}
Room.prototype.findHealPower = function(hostile, creeps) {

    room = this

    let healPower = 0

    for (let creep of creeps) {

        if (creep.pos.getRangeTo(hostile.pos) <= 1) {

            healPower += creep.findParts("heal") * HEAL_POWER

            if (creep.hasBoost(HEAL, "LO")) healPower += healPower * 1
            if (creep.hasBoost(HEAL, "LHO2")) healPower += healPower * 2
            if (creep.hasBoost(HEAL, "XLHO2")) healPower += healPower * 3
        }
    }

    room.visual.text(healPower, hostile.pos.x, hostile.pos.y + 0.75, { align: 'center', color: colors.communeGreen, font: "0.7" })

    return healPower
}