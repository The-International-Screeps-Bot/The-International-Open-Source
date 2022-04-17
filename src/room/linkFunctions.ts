Room.prototype.hubToController = function(hubLink, controllerLink) {

    const room = this

    // If the storage has insufficient energy, stop

    if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 80000) return

    // If the hubLink or controllerLink aren't defined, stop

    if (!hubLink || !controllerLink) return

    // If the hubLink is not sufficiently full, stop

    if (hubLink.store.getFreeCapacity(RESOURCE_ENERGY) > 100) return

    // If the controllerLink is more than half full, stop

    if (controllerLink.store.getUsedCapacity(RESOURCE_ENERGY) > controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) return

    // Otherwise, have the sourceLink transfer to the recieverLink

    hubLink.transferEnergy(controllerLink)

    // Record the links have moved resources

    hubLink.hasMovedResources = true
    controllerLink.hasMovedResources = true
}
