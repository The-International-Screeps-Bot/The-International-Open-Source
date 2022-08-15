Room.prototype.factoryManager = function () {
    const factory = this.structures.factory[0]
    if (!factory) return

    if (factory.cooldown > 0) return

    if (factory.createEnergy()) return

    if (factory.createBatteries()) return
}

StructureFactory.prototype.createBatteries = function () {
    // If there is some energy

    if (this.store.energy >= 600) {

        // Convert energy into batteries

        return this.produce(RESOURCE_BATTERY) === OK
    }

    return false
}

StructureFactory.prototype.createEnergy = function () {
    // If there are some batteries and not much energy

    if (this.store.battery >= 1000 && this.store.energy < 20000) {

        // Convert batteries into energy

        return this.produce(RESOURCE_ENERGY) === OK
    }

    return false
}
