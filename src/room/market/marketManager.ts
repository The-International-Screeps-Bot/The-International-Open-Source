import { minerals } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './marketFunctions'
import { allyManager } from './simpleAllies'

export function marketManager(room: Room) {

    const terminal = room.terminal

    // Stop if there is no terminal

    if (!terminal) return

    // Handle ally requests

    allyManager.tickConfig()

    allyManager.getAllyRequests()

    // Filter out allyRequests that are requesting resources

    const resourceRequests = allyManager.allyRequests.filter(request => request.requestType == allyManager.requestTypes.RESOURCE),

    // Filter resourceRequests by priority, highest to lowest

    resourceRequestsByPriority = resourceRequests.sort((a, b) => a.priority - b.priority).reverse()

    // Iterate through resourceRequests

    for (const resourceRequest of resourceRequestsByPriority) {

        // Iterate if there is no requested amount

        if (!resourceRequest.maxAmount) continue

        // If the request resourceType is a mineral

        if (minerals.includes(resourceRequest.resourceType)) {

            // If the terminal doesn't have enough, iterate

            if (terminal.store.getUsedCapacity(resourceRequest.resourceType) < 20000) continue

            // Otherwise send the resource and stop the loop

            terminal.send(resourceRequest.resourceType, Math.min(resourceRequest.maxAmount, terminal.store.getUsedCapacity(resourceRequest.resourceType) / 2), resourceRequest.roomName, 'Sending minerals to ally')
            break
        }

        // If the resourceType is energy

        if (resourceRequest.resourceType == RESOURCE_ENERGY) {

            // If the terminal doesn't have enough, iterate

            if (terminal.store.getUsedCapacity(resourceRequest.resourceType) < 120000) continue

            // Otherwise send the resource and stop the loop

            terminal.send(resourceRequest.resourceType, Math.min(resourceRequest.maxAmount, terminal.store.getUsedCapacity(resourceRequest.resourceType) / 2), resourceRequest.roomName, 'Sending energy to ally')
            break
        }

        // Otherwise iterate

        continue
    }

    // If there is less than x energy in the terminal, request y

    if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 60000) allyManager.requestResource(room.name, RESOURCE_ENERGY, 80000 - terminal.store.getUsedCapacity(RESOURCE_ENERGY), 0.25)

    // For each mineral

    for (const mineral of minerals) {

        const mineralAmount = terminal.store.getUsedCapacity(mineral)

        if (mineralAmount > 5000) continue

        allyManager.requestResource(room.name, mineral, 7000 - mineralAmount, 0.15)
    }

    allyManager.endTickManager()
}
