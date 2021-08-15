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

    if (!roomName || !Game.rooms[roomName]) return "room is undefined"

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => !type || (type && s.structureType == type)
    })

    for (let structure of structures) {

        structure.destroy()
    }

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

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => !type || (type && s.structureType == type)
    })

    for (let structure of structures) {

        structure.destroy()
    }

    return "destroyed all structures"
}

global.resetRoom = function(roomName) {

    if (!roomName || !Game.rooms[roomName]) return "room is undefined"

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType != STRUCTURE_SPAWN
    })

    for (let structure of structures) {

        structure.destroy()
    }

    return "reset " + roomName
}