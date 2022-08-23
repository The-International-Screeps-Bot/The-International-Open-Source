import { allStructureTypes } from './constants'

const importantStructures: StructureConstant[] = [STRUCTURE_SPAWN, STRUCTURE_STORAGE, STRUCTURE_TERMINAL]

global.clearGlobal = function () {
    // Clear global and stop CPU usage for a tick

    Game.cpu?.halt()
}
global.CG = global.clearGlobal

global.clearMemory = function () {
    // Clear all properties in memory

    for (const key in Memory) delete Memory[key as keyof typeof Memory]

    return 'Cleared all of Memory'
}
global.CM = global.clearMemory

global.killCreeps = function (roles?) {
    // Cancel spawning in communes

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        if (!room.controller || !room.controller.my) continue

        for (const spawn of room.structures.spawn) {
            if (!spawn.spawning) continue

            // If there are specific role requirements and the creep doesn't meet them

            if (roles && !roles.includes(Game.creeps[spawn.spawning.name].role)) continue

            spawn.spawning.cancel()
        }
    }

    const filteredCreeps = Object.values(Game.creeps).filter(creep => {
        return !roles || roles.includes(creep.role)
    })

    let killedCreepCount = 0

    for (const creep of filteredCreeps) if (creep.suicide() === OK) killedCreepCount += 1

    return `Killed an total of ${killedCreepCount} creeps ${roles ? `with the roles ${roles}` : ''}`
}
global.marxistLeninism = global.killCreeps
global.genocide = global.killCreeps

global.removeCSites = function (types?) {
    let removedCSCount = 0

    for (const cSiteID in Game.constructionSites) {
        const cSite = Game.constructionSites[cSiteID]

        if (types && !types.includes(cSite.structureType)) continue

        if (cSite.remove() === OK) removedCSCount += 1
    }

    return `Removed a total of ${removedCSCount} construction sites ${types ? `with the types ${types}` : ''}`
}

global.destroyStructures = function (roomName, types?) {
    // Get the room with the roomName

    const room = Game.rooms[roomName]

    // Stop if the room isn't defined

    if (!room) return `You have no vision in ${roomName}`

    // Otherwise loop through each structureType

    let destroyedStructureCount = 0

    for (const structureType of allStructureTypes) {
        // If types is constructed and the part isn't in types, iterate

        if ((types && !types.includes(structureType)) || (importantStructures.includes(structureType) && !types))
            continue

        // Get the structures of the type

        const structures = room.structures[structureType]

        // Loop through the structures

        for (const structure of structures) {
            if (structure.destroy() === OK) destroyedStructureCount += 1
        }
    }

    // Inform the result

    return `Destroyed a total of ${destroyedStructureCount} structures in ${roomName} ${
        types ? `with the types ${types}` : ''
    }`
}

global.destroyCommuneStructures = function (types?) {
    let log = ``
    let destroyedStructureCount: number

    for (const roomName of global.communes) {
        // Get the room with the roomName

        const room = Game.rooms[roomName]

        // Otherwise loop through each structureType

        destroyedStructureCount = 0

        for (const structureType of allStructureTypes) {
            // If types is constructed and the part isn't in types, iterate

            if ((types && !types.includes(structureType)) || (importantStructures.includes(structureType) && !types))
                continue

            // Get the structures of the type

            const structures = room.structures[structureType]

            // Loop through the structures

            for (const structure of structures) {
                if (structure.destroy() === OK) destroyedStructureCount += 1
            }

            log += `Destroyed a total of ${destroyedStructureCount} structures in ${roomName}
               `
        }
    }

    // Inform the result

    return log + ` ${types ? `with the types ${types}` : ''}`
}

global.claim = function (request, communeName) {
    if (!Memory.claimRequests[request]) {
        Memory.claimRequests[request] = {
            responder: communeName,
            needs: [0],
            score: 0,
        }
    }

    if (communeName) {
        const roomMemory = Memory.rooms[communeName]
        if (!roomMemory) return `No memory for ${communeName}`

        roomMemory.claimRequest = request
    }

    return `${communeName ? `${communeName} is responding to the` : `created`} claimRequest for ${request}`
}

global.attack = function (request, communeName) {
    if (!Memory.attackRequests[request]) {
        Memory.attackRequests[request] = {
            responder: communeName,
            needs: [0],
        }
    }

    if (communeName) {
        const roomMemory = Memory.rooms[communeName]
        if (!roomMemory) return `No memory for ${communeName}`

        roomMemory.attackRequests.push(request)
    }

    return `${communeName ? `${communeName} is responding to the` : `created`} attackRequest for ${request}`
}

global.allyCreepRequest = function (request, communeName?) {
    if (!Memory.allyCreepRequests[request]) {
        Memory.allyCreepRequests[request] = {
            responder: communeName,
            needs: [0],
        }
    }

    if (communeName) {
        const roomMemory = Memory.rooms[communeName]
        if (!roomMemory) return `No memory for ${communeName}`

        roomMemory.allyCreepRequest = request
    }

    return `${communeName ? `${communeName} is responding to the` : `created`} allyCreepRequest for ${request}`
}
global.ACR = global.allyCreepRequest
