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

    let room = Game.rooms[roomName]

    let structures = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType != STRUCTURE_SPAWN
    })

    for (let structure of structures) {

        structure.destroy()
    }

    return "reset " + roomName
}

global.consoleMessages = function(state) {

    Memory.global.consoleMessages = state
}

global.newCommune = function(newCommune) {

    for (let stage = 8; stage != 0; stage--) {
        for (let maxDistance = 1; maxDistance < 11; maxDistance++) {

            for (let roomName in Game.rooms) {

                room = Game.rooms[roomName]

                if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.stage >= 3 && room.memory.anchorPoint) {

                    let distance = room.findSafeDistance(room.memory.anchorPoint, { pos: new RoomPosition(25, 25, newCommune), range: 1 }, ["enemyRoom", "keeperRoom", "allyRoom"])

                    if (distance < maxDistance) {

                        Memory.global.newCommune = newCommune
                        Memory.global.communeEstablisher = room.name
                        return room.name
                    }
                }
            }
        }
    }

    return "No commune able to establish " + newCommune
}

global.attackTarget = function(attackTarget) {

    Memory.global.attackTarget = attackTarget

    for (let stage = 8; stage != 0; stage--) {
        for (let maxDistance = 1; maxDistance <= 10; maxDistance++) {

            for (let room in Game.rooms) {

                room = Game.rooms[room]

                if (room.controller && room.controller.my && room.memory.stage && room.memory.stage >= stage && room.memory.totalEnergy && room.memory.totalEnergy >= 30000) {

                    let distance = Game.map.getRoomLinearDistance(attackTarget, room.name)

                    if (distance < maxDistance) {

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

global.nukeTarget = function(position) {


}