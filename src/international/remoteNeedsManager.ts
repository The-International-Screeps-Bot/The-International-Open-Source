import { remoteHarvesterRoles, remoteNeedsIndex } from "./constants"
import { customLog, findCarryPartsRequired } from "./generalFunctions"

/**
 * Construct remote needs using data collected from the creepOrganizer
 */
export function remoteNeedsManager() {

    // For each roomName in the memory's communes

    for (const roomName of Memory.communes) {

        // Get the room using the roomName

        const room = Game.rooms[roomName]

        // Loop through each remote operated by the room

        for (const remoteName of room.memory.remotes) {

            // Get the remote's memory using its name

            const remoteMemory = Memory.rooms[remoteName],

            // See if the remote is reserved

            isReserved = remoteMemory.needs[remoteNeedsIndex.remoteReserver] == 0

            // If the remote is reserved

            if (isReserved) {

                // Increase the remoteHarvester need accordingly

                remoteMemory.needs[remoteNeedsIndex.source1RemoteHarvester] =+ 3
                remoteMemory.needs[remoteNeedsIndex.source2RemoteHarvester] =+ remoteMemory.source2 ? 3 : 0
            }

            // Loop through each index of sourceEfficacies

            for (let index = 0; index < remoteMemory.sourceEfficacies.length; index++) {

                // Get the efficacy using the index

                const efficacy = remoteMemory.sourceEfficacies[index]

                // Get the income based on the reservation of the room and remoteHarvester need

                let income = (isReserved ? 10 : 5) /* - (remoteMemory.needs[remoteNeedsIndex[remoteHarvesterRoles[index]]] + (isReserved ? 4 : 2)) */

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteMemory.needs[remoteNeedsIndex.remoteHauler] += findCarryPartsRequired(efficacy, income)
            }
        }
    }
}
