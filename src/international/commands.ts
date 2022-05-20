import { constants } from './constants'

global.killAllCreeps = function (roles?: CreepRoles[]) {
     // Loop through each creepName

     for (const creepName in Game.creeps) {
          // Construct and suicide the creep

          const creep = Game.creeps[creepName]

          if (!roles || roles.includes(creep.memory.role)) creep.suicide()
     }

     // Inform the result

     return `Killed all creeps of role ${roles || 'all'}`
}

global.removeAllCSites = function (types?: BuildableStructureConstant[]) {
     // Loop through cSite IDs in construction sites

     for (const ID in Game.constructionSites) {
          // Get the site using its ID

          const cSite = Game.constructionSites[ID]

          // If the cSite type matches the specified types, delete the cSite

          if (!types || types.includes(cSite.structureType)) cSite.remove()
     }

     // Inform the result

     return `Destroyed all construction sites of types ${types || 'all'}`
}

global.destroyAllStructures = function (roomName: string, types?: StructureConstant[]) {
     // Get the room with the roomName

     const room = Game.rooms[roomName]

     // Stop if the room isn't defined

     if (!room) return `You have no vision in ${roomName}`

     // Otherwise loop through each structureType

     for (const structureType of constants.allStructureTypes) {
          // If types is constructed and the part isn't in types, iterate

          if (types && !types.includes(structureType)) continue

          // Get the structures of the type

          const structures = room.structures[structureType]

          // Loop through the structures

          for (const structure of structures) structure.destroy()
     }

     // Inform the result

     return `Destroyed all structures of types ${types || 'all'} in ${roomName}`
}

/**
 *
 * @param commune The commune to respond to the claimRequest
 * @param claimRequest The roomName of the claimRequest to respond to
 */
global.claim = function (claimRequest: string, communeName: string) {
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
     return `${communeName} is responding to claimRequest for ${claimRequest}`
}
