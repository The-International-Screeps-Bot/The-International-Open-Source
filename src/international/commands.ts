import { constants } from "./constants"

global.killAllCreeps = function() {

    // Loop through each creepName

    for (const creepName in Game.creeps) {

        // Construct and suicide the creep

        const creep = Game.creeps[creepName]
        creep.suicide()
    }

    // Inform the result

    return 'Killed all creeps'
}

global.destroyAllCSites = function(types) {

    // Loop through cSite IDs in construction sites

    for (const ID in Game.constructionSites) {

        // Get the site using its ID

        const cSite = Game.constructionSites[ID]

        // If the cSite type matches the specified types, delete the cSite

        if (!types || types.includes(cSite.structureType)) cSite.remove()
    }

    // Inform the result

    return 'Destroyed all construction sites of types ' + types
}

global.destroyAllStructures = function(roomName: string, types?: StructureConstant[]) {

    // Get the room with the roomName

    const room = Game.rooms[roomName]

    // Stop if the room isn't defined

    if (!room) return 'You have no vision in ' + roomName

    // Otherwise loop through each structureType

    for (const structureType of constants.allStructureTypes) {

        // If types is constructed and the part isn't in types, iterate

        if (types && !types.includes(structureType)) continue

        // Get the structures of the type

        const structures: Structure[] = room.get(structureType)

        // Loop through the structures

        for (const structure of structures) structure.destroy()
    }

    // Inform the result

    return 'Destroyed all structures of types ' + types + ' in ' + roomName
}
