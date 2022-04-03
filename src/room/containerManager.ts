import { constants } from "international/constants"
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

            // Construct an undefined taskWithoutResponder

            let taskWithoutResponder: RoomWithdrawTask,

            // Construct totalResourcesOffered at 0

            totalResourcesOffered = 0

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

                    totalResourcesOffered += task.taskAmount

                    // If the task doesn't have a responder, set it as taskWithoutResponder

                    if (!task.responderID) taskWithoutResponder = task
                }

                // If there are more or equal resources offered than the used capacity of the container, iterate

                if (totalResourcesOffered >= container.store.getUsedCapacity(RESOURCE_ENERGY)) continue
            }

            // Assign amountToOffer as the energy left not assigned to tasks

            const amountToOffer = container.store.getUsedCapacity(RESOURCE_ENERGY) - totalResourcesOffered

            // If there is a taskWithoutResponder

            if (taskWithoutResponder) {

                // Set the taskAmount to match amountToOffer

                taskWithoutResponder.taskAmount = amountToOffer

                // Update the task's priority to match new amountToOffer

                taskWithoutResponder.priority = 1 + amountToOffer / 500

                // And iterate

                continue
            }

            // If the amountToOffer is more than x

            if (amountToOffer > 500) {

                // Create a new transfer task for the container

                new RoomWithdrawTask(room.name, RESOURCE_ENERGY, amountToOffer, container.id, 1 + amountToOffer / 500)
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

        // Construct an undefined taskWithoutResponder

        let taskWithoutResponder: RoomTransferTask,

        // Construct totalResourcesRequested at 0

        totalResourcesRequested = 0

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

                totalResourcesRequested += task.taskAmount

                // If the task doesn't have a responder, set it as taskWithoutResponder

                if (!task.responderID) taskWithoutResponder = task
            }

            // If there are more or equal resources offered than the free capacity of the container, stop

            if (totalResourcesRequested >= controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY)) return
        }

        // Assign amountToRequest as the energy left not assigned to tasks

        const amountToRequest = controllerContainer.store.getFreeCapacity(RESOURCE_ENERGY) - totalResourcesRequested

        // If there is a taskWithoutResponder

        if (taskWithoutResponder) {

            // Set the taskAmount to match amountToRequest

            taskWithoutResponder.taskAmount = amountToRequest

            // Update the task's priority to match new amountToRequest

            taskWithoutResponder.priority = 0 + amountToRequest / 800

            // And stop

            return
        }

        // If the amountToRequest is more than x

        if (amountToRequest > 500) {

            // Create a new transfer task for the container

            new RoomTransferTask(room.name, RESOURCE_ENERGY, amountToRequest, controllerContainer.id, 0 + amountToRequest / 800)
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

            // Construct an undefined taskWithoutResponder

            let taskWithoutResponder: RoomTransferTask,

            // Construct totalResourcesRequested at 0

            totalResourcesRequested = 0

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

                    totalResourcesRequested += task.taskAmount

                    // If the task doesn't have a responder, set it as taskWithoutResponder

                    if (!task.responderID) taskWithoutResponder = task
                }

                // If there are more or equal resources offered than the free capacity of the container, stop

                if (totalResourcesRequested >= container.store.getFreeCapacity(RESOURCE_ENERGY)) return
            }

            // Assign amountToRequest as the energy left not assigned to tasks

            const amountToRequest = container.store.getFreeCapacity(RESOURCE_ENERGY) - totalResourcesRequested

            // If there is a taskWithoutResponder

            if (taskWithoutResponder) {

                // Set the taskAmount to match amountToRequest

                taskWithoutResponder.taskAmount = amountToRequest

                // Update the task's priority to match new amountToRequest

                taskWithoutResponder.priority = 2 + amountToRequest / 300

                // And iterate

                continue
            }

            // If the amountToRequest is more than 0

            if (amountToRequest > 500) {

                // Create a new transfer task for the container

                new RoomTransferTask(room.name, RESOURCE_ENERGY, amountToRequest, container.id, 2 + amountToRequest / 300)
            }
        }
    }
}
