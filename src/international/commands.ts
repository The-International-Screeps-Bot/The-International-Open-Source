import { constants } from './constants'

global.clearMemory = function () {
    for (const key in Memory) delete Memory[key as keyof typeof Memory]

    return 'Cleared all of Memory'
}

global.killAllCreeps = function (roles?: CreepRoles[]) {
    const filteredCreeps = Object.entries(Game.creeps).filter(
        ([creepName, creep]) => !roles || roles.includes(creep.memory.role)
    )
    let killedCreepCount = 0
    filteredCreeps.forEach(([creepName, creep]) => {
        if (creep.suicide() === OK) killedCreepCount += 1
    })

    return `Killed an total of ${killedCreepCount} creeps ${
        roles ? `with the roles ${roles}` : ''
    }`
}

global.removeAllCSites = function (types?: BuildableStructureConstant[]) {
    const filteredCS = Object.entries(Game.constructionSites).filter(
        ([ID, cSite]) => types || types.includes(cSite.structureType)
    )
    let removedCSCount = 0
    filteredCS.forEach(([id, cSite]) => {
        if (cSite.remove() === OK) removedCSCount += 1
    })

    return `Removed a total of ${removedCSCount} construction sites ${
        types ? `with the types ${types}` : ''
    }`
}

global.destroyAllStructures = function (
    roomName: string,
    types?: StructureConstant[]
) {
    // Get the room with the roomName

    const room = Game.rooms[roomName]

    // Stop if the room isn't defined

    if (!room) return `You have no vision in ${roomName}`

    // Otherwise loop through each structureType

    let destroyedStructureCount = 0

    for (const structureType of constants.allStructureTypes) {
        // If types is constructed and the part isn't in types, iterate

        if (types && !types.includes(structureType)) continue

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

global.claim = function (claimRequest, communeName) {
    const roomMemory = Memory.rooms[communeName]
    if (!roomMemory) return `No memory for ${communeName}`

    let log = ``

    if (!Memory.claimRequests[claimRequest]) {
        Memory.claimRequests[claimRequest] = {
            needs: [1, 20, 0],
            score: 0,
        }

        log += `Created a claimRequest for ${claimRequest}
        `
    }

     roomMemory.claimRequest = claimRequest
     return `${communeName} is responding to the claimRequest for ${claimRequest}`
}
