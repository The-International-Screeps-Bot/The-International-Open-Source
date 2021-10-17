module.exports = function factories(room) {

    let factory = room.get("factory")

    // Stop if factory doesn't exist

    if (!factory) return

    // Stop if factory is on cooldown

    if (factory.cooldown) return

    // Stop if factory is full

    if (factory.store.getFreeCapacity() == 0) return

    processBatteries()

    function processBatteries() {

        // Stop if factory has no batteries

        if (factory.store.getUsedCapacity(RESOURCE_BATTERY) == 0) return

        // Process batteries into energy

        factory.produce(RESOURCE_ENERGY)
        return true
    }
}