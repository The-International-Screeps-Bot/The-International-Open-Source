import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { RoomWithdrawTask } from "./roomTasks"

/**
 * Creates tasks for containers in the room
 */
export function containerManager(room: Room) {

    // Get the room's sourceContainers

    const sourceContainers: StructureContainer[] = [room.get('source1Container'), room.get('source2Container')]

    // Loop through sourceContainers

    for (const container of sourceContainers) {

        // If the container isn't defined, iterate

        if (!container) continue
        room.visual.circle(container.pos, {fill: constants.colors.red})
        // if there is no global for the container, make one

        if (!global[container.id]) global[container.id] = {}

        // If there is no created task ID obj for the container's global, create one

        if (!global[container.id].createdTaskIDs) global[container.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the container's tasks of type tansfer

            const containersWithdrawTasks = room.findTasksOfTypes(global[container.id].createdTaskIDs, new Set(['withdraw'])) as RoomWithdrawTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesOffered = 0

            // Loop through each pickup task

            for (const task of containersWithdrawTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesOffered += task.withdrawAmount
            }

            // If there are more or equal resources offered than the used capacity of the container, iterate

            if (totalResourcesOffered >= container.store.getUsedCapacity(RESOURCE_ENERGY)) continue
        }

        // Get the amount of energy the container needs at a max of the hauler's capacity

        const withdrawAmount = Math.min(container.store.getUsedCapacity(RESOURCE_ENERGY), 100)

        // If the withdrawAmount is more than 0

        if (withdrawAmount > 0) {

            // Create a new transfer task for the container

            new RoomWithdrawTask(room.name, RESOURCE_ENERGY, withdrawAmount, container.id)
        }
    }
}
