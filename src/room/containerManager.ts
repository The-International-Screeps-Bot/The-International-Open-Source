import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"
import { RoomTransferTask, RoomWithdrawTask } from "./roomTasks"

/**
 * Creates tasks for containers in the room
 */
export function containerManager(room: Room) {

    sourceContainers()

    function sourceContainers() {

        // Get the room's sourceContainers

        const sourceContainers: StructureContainer[] = [room.get('source1Container'), room.get('source2Container')]

        // Loop through sourceContainers

        for (const container of sourceContainers) {

            // If the container isn't defined, iterate

            if (!container) continue

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

            // Get the amount of energy the container needs at a max of the container's used capacity

            const withdrawAmount = container.store.getUsedCapacity(RESOURCE_ENERGY)

            // If the withdrawAmount is more than 0

            if (withdrawAmount > 500) {

                // Create a new transfer task for the container

                new RoomWithdrawTask(room.name, RESOURCE_ENERGY, withdrawAmount, container.id, 1)
            }
        }
    }

    //

    controllerContainer()

    function controllerContainer() {

        // Get the controllerContainer

        const controllerContainer = room.get('controllerContainer')

        // If it doesn't exist, stop

        if (!controllerContainer) return

        // Otherwise

        // if there is no global for the container, make one

        if (!global[controllerContainer.id]) global[controllerContainer.id] = {}

        // If there is no created task ID obj for the container's global, create one

        if (!global[controllerContainer.id].createdTaskIDs) global[controllerContainer.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the container's tasks of type tansfer

            const containersTransferTasks = room.findTasksOfTypes(global[controllerContainer.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesRequested = 0

            // Loop through each pickup task

            for (const task of containersTransferTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesRequested += task.transferAmount
            }

            // If there are more or equal resources offered than the free capacity of the container, stop

            if (totalResourcesRequested >= controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY)) return
        }

        // Get the amount of energy the container can offer at a max of the container's free capacity

        const transferAmount = controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY)

        // If the transferAmount is more than 0

        if (transferAmount > 500) {

            // Create a new transfer task for the container

            new RoomTransferTask(room.name, RESOURCE_ENERGY, transferAmount, controllerContainer.id, 0)
        }
    }

    fastFillerContainers()

    function fastFillerContainers() {

        // Get the room's fastFillerContainers

        const fastFillerContainers: StructureContainer[] = [room.get('fastFillerContainerLeft'), room.get('fastFillerContainerRight')]

        // Loop through fastFillerContainers

        for (const container of fastFillerContainers) {

            // If the container isn't defined, iterate

            if (!container) continue

            // if there is no global for the container, make one

            if (!global[container.id]) global[container.id] = {}

            // If there is no created task ID obj for the container's global, create one

            if (!global[container.id].createdTaskIDs) global[container.id].createdTaskIDs = {}

            // Otherwise

            else {

                // Find the container's tasks of type tansfer

                const containersTransferTasks = room.findTasksOfTypes(global[container.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

                // Track the amount of energy the resource has offered in tasks

                let totalResourcesRequested = 0

                // Loop through each pickup task

                for (const task of containersTransferTasks) {

                    // Otherwise find how many resources the task has requested to pick up

                    totalResourcesRequested += task.transferAmount
                }

                // If there are more or equal resources offered than the free capacity of the container, stop

                if (totalResourcesRequested >= container.store.getFreeCapacity(RESOURCE_ENERGY)) return
            }

            // Get the amount of energy the container can offer at a max of the container's free capacity

            const transferAmount = container.store.getFreeCapacity(RESOURCE_ENERGY)

            // If the transferAmount is more than 0

            if (transferAmount > 500) {

                // Create a new transfer task for the container

                new RoomTransferTask(room.name, RESOURCE_ENERGY, transferAmount, container.id, 2)
            }
        }
    }
}
