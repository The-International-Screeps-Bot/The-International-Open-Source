StructureLab.prototype.hasOnlyResource = function(resource) {

    for (let resourceType in this.store) {

        // Make sure resource isn't the specified resource

        if (resourceType == resource) continue

        // Make sure the resource isn't energy

        if (resourceType == RESOURCE_ENERGY) continue

        return
    }

    return true
}