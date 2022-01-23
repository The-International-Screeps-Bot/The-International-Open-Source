import { generalFuncs } from "international/generalFunctions"
import { RoomPickupTask } from "./roomTasks"

/**
 * Creates pickup tasks for dropped resources
 */
export function droppedResourceManager(room: Room) {

    // Find dropped resources and loop through them

    const droppedResources = room.find(FIND_DROPPED_RESOURCES)

    for (const droppedResource of droppedResources) {

        // if there is no global for the droppedResource, make one

        if (!global[droppedResource.id]) global[droppedResource.id] = {}

        // Otherwise if there is no created task ID obj for the droppedResource's global, create one

        if (!global[droppedResource.id].createdTaskIDs) global[droppedResource.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the resource's tasks of type pickup

            const droppedResourcePickupTasks = room.findTasksOfTypes(global[droppedResource.id].createdTaskIDs, new Set(['pickup'])) as RoomPickupTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesOffered = 0

            // Loop through each pickup task

            for (const task of droppedResourcePickupTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesOffered += task.pickupAmount
            }

            // If there are more or equal resources offered than the droppedResource has in amount, iterate
            
            if (totalResourcesOffered >= droppedResource.amount) continue
        }

        // Create a pickup task for the droppedResource

        new RoomPickupTask(room.name, droppedResource.id, droppedResource.resourceType)
    }
}
