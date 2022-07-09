import { findObjectWithID, unpackAsRoomPos } from 'international/generalFunctions'
import { HubHauler } from 'room/creeps/creepClasses'

HubHauler.prototype.travelToHub = function () {
     const creep = this
     const { room } = creep

     // Get the hub, informing false if it's undefined

     const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name)
     if (!hubAnchor) return true

     // Otherwise if the creep is on the hub, inform false

     if (creep.pos.getRangeTo(hubAnchor) === 0) return false

     // Otherwise move to the hub and inform true

     creep.say('⏩H')

     creep.createMoveRequest({
          origin: creep.pos,
          goal: { pos: hubAnchor, range: 0 },
     })

     return true
}

HubHauler.prototype.balanceStoringStructures = function () {
     const creep = this
     const { room } = creep

     // Define the storage and termina

     const { storage } = room
     const { terminal } = room

     // If there is no terminal or storage, inform false

     if (!storage || !terminal) return false

     creep.say('BSS')

     // If the creep has a taskTarget

     if (creep.memory.taskTarget) {
          // If the taskTarget isn't the storage or terminal, inform false

          if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== terminal.id) return false

          // Otherwise transfer to the taskTarget. If a success, delete the taskTarget

          if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
               delete creep.memory.taskTarget

          // And inform true

          return true
     }

     // If the terminal is unbalanced and the storage has free capacity

     if (
          terminal.store.getUsedCapacity(RESOURCE_ENERGY) >
               storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 + creep.store.getCapacity() &&
          storage.store.getFreeCapacity() > creep.store.getCapacity()
     ) {
          // Withdraw from the unbalanced structure

          creep.withdraw(terminal, RESOURCE_ENERGY)

          // Assign the taskTarget as the reciever

          creep.memory.taskTarget = storage.id

          // And inform true

          return true
     }

     // If the storage is unbalanced and the terminal has free capacity

     if (
          storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 >
               terminal.store.getUsedCapacity(RESOURCE_ENERGY) + creep.store.getCapacity() &&
          terminal.store.getFreeCapacity() > creep.store.getCapacity()
     ) {
          // Withdraw from the unbalanced structure

          creep.withdraw(storage, RESOURCE_ENERGY)

          // Assign the taskTarget as the reciever

          creep.memory.taskTarget = terminal.id

          // And inform true

          return true
     }

     // Inform false

     return false
}

HubHauler.prototype.fillHubLink = function () {
     const creep = this
     const { room } = creep

     // Define the storage and hubLink

     const { storage } = room
     const hubLink = room.hubLink

     // If there is no terminal or hubLink, inform false

     if (!storage || !hubLink) return false

     creep.say('FHL')

     // If the creep has a taskTarget

     if (creep.memory.taskTarget) {
          // If the taskTarget isn't the storage or terminal, inform false

          if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== hubLink.id) return false

          // Otherwise transfer to the taskTarget. If a success, delete the taskTarget

          if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
               delete creep.memory.taskTarget

          // And inform true

          return true
     }

     // Get the fastFillerLink

     const fastFillerLink = room.fastFillerLink

     // If the controller is near to downgrade, the fastFillerLink is insufficiently full, or the storage is sufficiently full and the hubLink is not full

     if (
          (room.controller.ticksToDowngrade < 10000 ||
               (fastFillerLink &&
                    fastFillerLink.store.getUsedCapacity(RESOURCE_ENERGY) <
                         fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) ||
               storage.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity(RESOURCE_ENERGY)) &&
          hubLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0
     ) {
          // Withdraw from the unbalanced structure

          creep.withdraw(storage, RESOURCE_ENERGY)

          // Assign the taskTarget as the reciever

          creep.memory.taskTarget = hubLink.id

          // And inform true

          return true
     }

     // Inform false

     return false
}
