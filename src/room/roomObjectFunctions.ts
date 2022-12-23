RoomObject.prototype.usedStore = function (this: RoomObject & { store?: StoreDefinition }, resourceType) {
    if (!this.store) return 0

    let amount = 0

    if (resourceType) return this.store[resourceType]

    for (const type in this.store) amount += this.store[type as ResourceConstant]

    return amount
}

RoomObject.prototype.freeStore = function (this: RoomObject & { store?: StoreDefinition }) {
    return this.store.getCapacity() - this.usedStore()
}

RoomObject.prototype.freeSpecificStore = function (
    this: RoomObject & { store?: StoreDefinition },
    resourceType = RESOURCE_ENERGY,
) {
    return this.store.getCapacity(resourceType) - this.store[resourceType]
}

RoomObject.prototype.freeNextStoreOf = function (this: RoomObject & { store?: StoreDefinition }, resourceType) {
    return this.store.getCapacity(resourceType) - this.nextStore[resourceType]
}

RoomObject.prototype.freeReserveStoreOf = function (this: RoomObject & { store?: StoreDefinition }, resourceType) {

    return this.store.getCapacity(resourceType) - this.reserveStore[resourceType]
}

/*
RoomObject.prototype.usedNextStore = function (this: RoomObject & { store?: StoreDefinition }) {
    let amount = 0
    for (const type in this.nextStore) amount += this.nextStore[type as ResourceConstant]

    return amount
}

RoomObject.prototype.usedReserveStore = function (this: RoomObject & { store?: StoreDefinition }) {
    let amount = 0
    for (const type in this.reserveStore) amount += this.reserveStore[type as ResourceConstant]

    return amount
}
 */
