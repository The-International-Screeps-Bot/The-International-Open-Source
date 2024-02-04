import { separateStoreStructureTypes } from "../constants/structures"

export class RoomObjectUtils {
  static freeNextStoreOf(
    roomObject: RoomObject & { store: StoreDefinition },
    resourceType: ResourceConstant,
  ) {
    // If our storing system is like a lab, nuker, power spawn
    if (
      roomObject instanceof Structure &&
      separateStoreStructureTypes.has(roomObject.structureType)
    ) {
      return roomObject.store.getCapacity(resourceType) - roomObject.nextStore[resourceType]
    }

    return roomObject.store.getCapacity(resourceType) - roomObject.usedNextStore
  }

  static freeReserveStoreOf(
    roomObject: RoomObject & { store: StoreDefinition },
    resourceType: ResourceConstant,
  ) {
    // If our storing system is like a lab, nuker, power spawn
    if (
      roomObject instanceof Structure &&
      separateStoreStructureTypes.has(roomObject.structureType)
    ) {
      return roomObject.store.getCapacity(resourceType) - roomObject.reserveStore[resourceType]
    }

    return roomObject.store.getCapacity(resourceType) - roomObject.usedReserveStore
  }
}
