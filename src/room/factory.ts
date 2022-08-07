Room.prototype.factoryManager = function() {

    const factory = this.structures.factory[0]
    if (!factory) return

    if (factory.createEnergy()) return

    if (factory.createBatteries()) return
}

StructureFactory.prototype.createBatteries = function() {


    return true
}

StructureFactory.prototype.createEnergy = function() {


    return true
}
