global.removeSites = function(roomName, type) {

    if (!roomName || !Game.rooms[roomName]) return "room is undefined"

    let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: s => !type || (type && s.structureType == type)
    })

    for (let cSite of constructionSites) {

        cSite.remove()
    }

    return "removed sites in " + roomName
}

global.destroyStructures = function(roomName, type) {

    let room = Game.rooms[roomName]

    if (!roomName || !room) return "room is undefined"

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => !type || (type && s.structureType == type)
    })

    for (let structure of structures) structure.destroy()

    return "destroyed structures in " + roomName
}

global.removeAllSites = function() {

    for (let value in Game.constructionSites) {

        let cSite = Game.constructionSites[value]

        cSite.remove()
    }

    return "removed all sites"
}

global.destroyAllStructures = function(type) {

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        let structures = room.find(FIND_STRUCTURES, {
            filter: s => !type || (type && s.structureType == type)
        })

        for (let structure of structures) structure.destroy()
    }

    return "destroyed all structures " + type
}

global.resetRoom = function(roomName) {

    if (!roomName || !Game.rooms[roomName]) return "room is undefined"

    let room = Game.rooms[roomName]

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType != STRUCTURE_SPAWN
    })

    for (let structure of structures) structure.destroy()


    return "reset " + roomName
}

global.consoleMessages = function(state) {

    Memory.global.consoleMessages = state
    return "console messages " + state
}

global.mapVisuals = function(state) {

    Memory.global.mapVisuals = state
    return "map visuals " + state
}

global.roomVisuals = function(state) {

    Memory.global.roomVisuals = state
    return "room visuals " + state
}

global.attackTarget = function(attackTarget) {

    Memory.global.attackTarget = attackTarget

    for (let stage = 8; stage != 0; stage--) {
        for (let maxDistance = 1; maxDistance <= 10; maxDistance++) {

            for (let room in Game.rooms) {

                room = Game.rooms[room]

                if (room.controller && room.controller.my && room.memory.stage && room.memory.stage == stage && room.memory.storedEnergy && room.memory.storedEnergy >= 30000) {

                    let distance = Game.map.getRoomLinearDistance(attackTarget, room.name)

                    if (distance == maxDistance) {

                        console.log("AT, D: " + distance + ", MD: " + maxDistance + ", RN: " + room.name)

                        Memory.global.attackingRoom = room.name
                        Memory.global.attackTarget = attackTarget
                        return room.name
                    }
                }
            }
        }
    }

    return "no commune able to attack " + attackTarget
}

global.nukeTarget = function(x, y, roomName) {


}

global.killAllCreeps = function() {

    for (let creepName in Game.creeps) {

        let creep = Game.creeps[creepName]

        creep.suicide()

    }

    return "killed all creeps"
}