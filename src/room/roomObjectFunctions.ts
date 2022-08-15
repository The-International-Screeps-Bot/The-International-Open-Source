RoomObject.prototype.usedStore = function (this: RoomObject & { store?: StoreDefinition }, resourceType) {
    if (!this.store) return 0

    let amount = 0

    if (resourceType) return this.store[resourceType]

    for (const type in this.store) amount += this.store[type as ResourceConstant]

    return amount
}

RoomObject.prototype.freeStore = function (this: RoomObject & { store?: StoreDefinition }, resourceType = RESOURCE_ENERGY) {
    return this.store.getCapacity(resourceType) - this.usedStore()
}

RoomObject.prototype.freeSpecificStore = function (this: RoomObject & { store?: StoreDefinition }, resourceType = RESOURCE_ENERGY) {
    return this.store.getCapacity(resourceType) - this.store[resourceType]
}
