import { RoomTransferTask } from "./roomTasks"

export function storageStructuresManager(room: Room) {

    // Get the room's storage, stopping if it's undefined

    const storage = room.storage
    if (!storage) return

    // Construct an undefined taskWithoutResponder

    let taskWithoutResponder: RoomTransferTask,

    // Construct totalResourcesRequested at 0

    totalResourcesRequested = 0

    // if there is no global for the storage, make one

    if (!global[storage.id]) global[storage.id] = {}

    // If there is no created task ID obj for the storage's global, create one

    if (!global[storage.id].createdTaskIDs) global[storage.id].createdTaskIDs = {}

    // Otherwise

    else {

        // Find the storage's tasks of type tansfer

        const structuresTransferTasks = room.findTasksOfTypes(global[storage.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

        // Loop through each pickup task

        for (const task of structuresTransferTasks) {

            // Otherwise find how many resources the task has requested to pick up

            totalResourcesRequested += task.taskAmount

            // If the task doesn't have a responder, set it as taskWithoutResponder

            if (!task.responderID) taskWithoutResponder = task
        }

        // If there are more or equal resources offered than the free energy capacity of the structure, stop

        if (totalResourcesRequested >= storage.store.getFreeCapacity(RESOURCE_ENERGY)) return
    }

    // Assign amountToRequest as the energy left not assigned to tasks, iterating if 0

    const amountToRequest = storage.store.getFreeCapacity(RESOURCE_ENERGY) - totalResourcesRequested
    if (amountToRequest == 0) return

    // If there is a taskWithoutResponder

    if (taskWithoutResponder) {

        // Set the taskAmount to match amountToRequest

        taskWithoutResponder.taskAmount = amountToRequest

        // Update the task's priority to match new amountToRequest

        taskWithoutResponder.priority = 1 - storage.store.getUsedCapacity(RESOURCE_ENERGY) / 2000

        // And stop

        return
    }

    // Create a new transfer task for the storage

    new RoomTransferTask(room.name, RESOURCE_ENERGY, amountToRequest, storage.id, 1 - storage.store.getUsedCapacity(RESOURCE_ENERGY) / 2000)
}
