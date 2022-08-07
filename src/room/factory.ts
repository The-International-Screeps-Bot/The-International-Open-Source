StructureFactory.prototype.manager = function() {

    if (this.createEnergy()) return

    if (this.createBatteries()) return
}

StructureFactory.prototype.createBatteries = function() {


    return true
}

StructureFactory.prototype.createEnergy = function() {


    return true
}
