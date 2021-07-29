function factories(factory) {

    if (factory) {

        if (factory.store.getUsedCapacity() != factory.store.getCapacity() && factory.cooldown == 0) {

            if (factory.store[RESOURCE_BATTERY] > 0) {

                factory.produce(RESOURCE_ENERGY)
            }
        }
    }
}

module.exports = factories