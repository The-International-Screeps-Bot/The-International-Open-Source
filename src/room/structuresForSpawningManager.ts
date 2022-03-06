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

        // Construct an undefined taskWithoutResponder

        let taskWithoutResponder: RoomTransferTask,

        // Construct totalResourcesRequested at 0

        totalResourcesRequested = 0

        // if there is no global for the structure, make one

        if (!global[structure.id]) global[structure.id] = {}

        // If there is no created task ID obj for the structure's global, create one

        if (!global[structure.id].createdTaskIDs) global[structure.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the structures's tasks of type tansfer

            const structuresTransferTasks = room.findTasksOfTypes(global[structure.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

            // Loop through each pickup task

            for (const task of structuresTransferTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesRequested += task.transferAmount

                // If the task doesn't have a responder, set it as taskWithoutResponder

                if (!task.responderID) taskWithoutResponder = task
            }

            // If there are more or equal resources offered than the free energy capacity of the structure, iterate

            if (totalResourcesRequested >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) continue
        }

        // Assign amountToRequest as the energy left not assigned to tasks, iterating if 0

        const amountToRequest = structure.store.getFreeCapacity(RESOURCE_ENERGY) - totalResourcesRequested
        if (amountToRequest == 0) continue

        // If there is a taskWithoutResponder

        if (taskWithoutResponder) {

            // Set the pickupAmount to match amountToRequest

            taskWithoutResponder.transferAmount = amountToRequest

            // Update the task's priority to match new amountToRequest

            taskWithoutResponder.priority = 10

            // And iterate

            continue
        }

        // Create a new transfer task for the structure

        new RoomTransferTask(room.name, RESOURCE_ENERGY, amountToRequest, structure.id, 10)
    }
}
