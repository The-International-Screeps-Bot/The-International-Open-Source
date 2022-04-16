import { findObjectWithID } from "international/generalFunctions";
import { HubHauler } from "room/creeps/creepClasses";

HubHauler.prototype.travelToHub = function() {

    const creep = this,
    room = creep.room

    // Get the hub, informing false if it's undefined

    const hub: RoomPosition | undefined = global[room.name].stampAnchors?.hub[0]
    if(!hub) return true

    // Otherwise if the creep is on the hub, inform false

    if (creep.pos.getRangeTo(hub) == 0) return false

    // Otherwise move to the hub and inform true

    creep.say('⏩ H')

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: hub, range: 0 }
    })

    return true
}


HubHauler.prototype.balanceStoringStructures = function() {

    const creep = this,
    room = creep.room,

    // Define the storage and termina

    storage = room.storage,
    terminal = room.terminal

    // If there is no terminal or storage, inform false

    if (!storage || !terminal) return false

    creep.say('BSS')

    // If the creep has a taskTarget

    if (creep.memory.taskTarget) {

        // If the taskTarget isn't the storage or terminal, inform false

        if (creep.memory.taskTarget != storage.id && creep.memory.taskTarget != terminal.id) return false

        // Otherwise transfer to the taskTarget. If a success, delete the taskTarget

        if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY)) delete creep.memory.taskTarget

        // And inform true

        return true
    }

    // If the terminal is unbalanced and the storage has free capacity

    if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) * 0.5 > storage.store.getUsedCapacity(RESOURCE_ENERGY) + creep.store.getCapacity() && storage.store.getCapacity() > creep.store.getCapacity()) {

        // Withdraw from the unbalanced structure

        creep.withdraw(terminal, RESOURCE_ENERGY)

        // Assign the taskTarget as the reciever

        creep.memory.taskTarget = storage.id

        // And inform true

        return true
    }

    // If the storage is unbalanced and the terminal has free capacity

    if (storage.store.getUsedCapacity(RESOURCE_ENERGY) > terminal.store.getUsedCapacity(RESOURCE_ENERGY) * 2 + creep.store.getCapacity() && terminal.store.getCapacity() > creep.store.getCapacity()) {

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
