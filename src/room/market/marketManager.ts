import { minerals } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './marketFunctions'
import { allyManager } from '../../international/simpleAllies'

export function marketManager(room: Room) {
     const { terminal } = room

     // Stop if there is no terminal

     if (!terminal) return

     // If the terminal has less than x energy in the terminal, request y

     if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 50000)
          allyManager.requestResource(
               room.name,
               RESOURCE_ENERGY,
               60000 - terminal.store.getUsedCapacity(RESOURCE_ENERGY),
               0.75,
          )

     // If the market is disabled, stop

     if (!Game.market.getHistory(RESOURCE_ENERGY).length) return

     // For each mineral

     for (const mineral of minerals) {
          const mineralAmount = terminal.store.getUsedCapacity(mineral)

          if (mineralAmount > 5000) continue

          allyManager.requestResource(room.name, mineral, 7000 - mineralAmount, 0.25)
     }

     // If the terminal is on cooldown, stop

     if (terminal.cooldown > 0) return

     // Filter out allyRequests that are requesting resources

     const resourceRequests = allyManager.allyRequests.filter(
          request => request.requestType === allyManager.requestTypes.RESOURCE,
     )

     // Filter resourceRequests by priority, highest to lowest

     resourceRequests.sort((a, b) => a.priority - b.priority).reverse()

     let amount = 0

     // Iterate through resourceRequests

     for (const request of resourceRequests) {
          // Iterate if there is no requested amount

          if (!request.maxAmount) continue

          amount = 0

          // If the request resourceType is a mineral

          if (minerals.includes(request.resourceType)) {
               // If the terminal doesn't have enough, iterate

               if (terminal.store.getUsedCapacity(request.resourceType) < 20000) continue

               amount = Math.min(request.maxAmount, terminal.store.getUsedCapacity(request.resourceType) / 2)

               // Otherwise send the resource and stop

               terminal.send(request.resourceType, amount, request.roomName, `Sending ${request} to ally`)
               return
          }

          // If the resourceType is energy

          if (request.resourceType === RESOURCE_ENERGY) {
               // If the terminal doesn't have enough, iterate

               if (terminal.store.getUsedCapacity(request.resourceType) < 60000) continue

               amount = Math.min(request.maxAmount, terminal.store.getUsedCapacity(request.resourceType) / 2)

               // Otherwise send the resource and stop

               terminal.send(request.resourceType, amount, request.roomName, `Sending ${request} to ally`)
               return
          }

          // Otherwise iterate

          continue
     }

     let resourceType: ResourceConstant
     let targetAmount = 8000

     // Minerals

     // Loop through each mineral

     for (resourceType of minerals) {
          // If there is an acceptable amount of resources, iterate

          if (terminal.store[resourceType] <= targetAmount) continue

          targetAmount *= 0.75

          // Otherwise, try to sell the excess amount

          if (room.advancedSell(resourceType, terminal.store[resourceType] - targetAmount, targetAmount)) return
     }

     // Energy

     resourceType = RESOURCE_ENERGY
     targetAmount = 30000

     // If there is insufficient energy

     if (terminal.store[resourceType] < targetAmount) {

          targetAmount *= 1.2

          // Try to buy some more

          if (room.advancedBuy(resourceType, targetAmount - terminal.store[resourceType], targetAmount)) return
     }
}
