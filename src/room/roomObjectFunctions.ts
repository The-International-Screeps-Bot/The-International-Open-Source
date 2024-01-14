import { separateStoreStructureTypes } from "international/constants"

RoomObject.prototype.freeSpecificStore = function (
    this: RoomObject & { store?: StoreDefinition },
    resourceType = RESOURCE_ENERGY,
) {
    return this.store.getCapacity(resourceType) - this.store[resourceType]
}
