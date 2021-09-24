Creep.prototype.transferToStorageOrTerminal = function() {

    let creep = this
    let room = creep.room

    let storage = room.get("storage")

    if (storage && storage.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

        creep.say("S")

        for (let resourceType in creep.store) {

            creep.advancedTransfer(storage, resourceType)
            return true
        }
    }

    let terminal = room.get("terminal")

    if (terminal && terminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

        creep.say("T")

        for (let resourceType in creep.store) {

            creep.advancedTransfer(terminal, resourceType)
            return true
        }
    }
}

Creep.prototype.withdrawRoomResources = function() {

    let creep = this
    let room = creep.room

    let storage = room.get("storage")

    if (storage && storage.store.getUsedCapacity() > 0) {

        creep.say("S")

        for (let resourceType in storage.store) {

            creep.advancedWithdraw(storage, resourceType)
            return true
        }
    }

    let terminal = room.get("terminal")

    if (terminal && terminal.store.getUsedCapacity() > 0) {

        creep.say("T")

        for (let resourceType in terminal.store) {

            creep.advancedWithdraw(terminal, resourceType)
            return true
        }
    }
}