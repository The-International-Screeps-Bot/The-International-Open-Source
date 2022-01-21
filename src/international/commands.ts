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
