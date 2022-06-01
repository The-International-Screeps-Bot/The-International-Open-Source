import { RoomPickupTask } from './roomTasks'

/**
 * Creates pickup tasks for dropped resources
 */
export function droppedResourceManager(room: Room) {
    // Find dropped resources and loop through them

    const droppedResources = room.find(FIND_DROPPED_RESOURCES)

    for (const droppedResource of droppedResources) {
        // Construct an undefined taskWithoutResponder

        let taskWithoutResponder: RoomPickupTask

        // Construct totalResourcesOffered at 0

        let totalResourcesOffered = 0

        // if there is no global for the droppedResource, make one

        if (!global[droppedResource.id]) global[droppedResource.id] = {}

        // Otherwise if there is no created task ID obj for the droppedResource's global, create one

        if (!global[droppedResource.id].createdTaskIDs)
            global[droppedResource.id].createdTaskIDs = {}
        // Otherwise
        else {
            // Find the resource's tasks of type pickup

            const droppedResourcePickupTasks: RoomPickupTask[] =
                room.findTasksOfTypes(
                    global[droppedResource.id].createdTaskIDs,
                    new Set(['pickup'])
                ) as RoomPickupTask[]

            // Loop through each pickup task

            for (const task of droppedResourcePickupTasks) {
                // Otherwise find how many resources the task has requested to pick up

                totalResourcesOffered += task.taskAmount

                // If the task doesn't have a responder, set it as taskWithoutResponder

                if (!task.responderID) taskWithoutResponder = task
            }

            // If there are more or equal resources offered than the droppedResource has in amount, iterate

            if (totalResourcesOffered >= droppedResource.amount) continue
        }

        // Assign amountToOffer as the energy left not assigned to tasks, iterating if 0

        const amountToOffer = droppedResource.amount - totalResourcesOffered
        if (amountToOffer === 0) continue

        // If there is a taskWithoutResponder

        if (taskWithoutResponder) {
            // Set the taskAmount to match amountToOffer

            taskWithoutResponder.taskAmount = amountToOffer

            // Update the task's priority to match new amountToOffer

            taskWithoutResponder.priority = Math.max(amountToOffer * 0.002, 1)

            // And iterate

            continue
        }

        // Create a pickup task for the droppedResource

        new RoomPickupTask(
            room.name,
            droppedResource.id,
            droppedResource.resourceType,
            amountToOffer,
            Math.max(amountToOffer * 0.002, 1)
        )
    }
}
