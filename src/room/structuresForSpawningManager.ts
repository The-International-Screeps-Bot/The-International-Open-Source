import { generalFuncs } from "international/generalFunctions"
import { RoomTransferTask } from "./roomTasks"

/**
 * Creates tasks for spawns and extensions when they are empty
 */
export function structuresForSpawningManager(room: Room) {

    // Get exensions and spawns

    const structuresForSpawning: (StructureSpawn | StructureExtension)[] = room.get('structuresForSpawning')

    // Iterate through structures in structureForSpawning

    for (const structure of structuresForSpawning) {

        // if there is no global for the structure, make one

        if (!global[structure.id]) global[structure.id] = {}

        // If there is no created task ID obj for the structure's global, create one

        if (!global[structure.id].createdTaskIDs) global[structure.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the structures's tasks of type tansfer

            const structuresTransferTasks = room.findTasksOfTypes(global[structure.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesRequested = 0

            // Loop through each pickup task

            for (const task of structuresTransferTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesRequested += task.transferAmount
            }

            // If there are more or equal resources offered than the free energy capacity of the structure, iterate

            if (totalResourcesRequested >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) continue
        }

        // Get the amount of energy the structure needs at a max of the hauler's capacity

        const transferAmount = Math.min(structure.store.getFreeCapacity(RESOURCE_ENERGY), 100)

        // If the transferAmount is more than 0

        if (transferAmount > 0) {

            // Create a new transfer task for the structure

            new RoomTransferTask(room.name, RESOURCE_ENERGY, transferAmount, structure.id)
        }
    }
}
