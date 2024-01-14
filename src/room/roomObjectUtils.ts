import { separateStoreStructureTypes } from "international/constants"

export class RoomObjectUtils {
  freeNextStoreOf(roomObject: RoomObject & { store: StoreDefinition }, resourceType: ResourceConstant) {
    // If our storing system is like a lab, nuker, power spawn
    if (roomObject instanceof Structure && separateStoreStructureTypes.has(roomObject.structureType)) {
      return roomObject.store.getCapacity(resourceType) - roomObject.nextStore[resourceType]
    }

    return roomObject.store.getCapacity(resourceType) - roomObject.usedNextStore
  }

  freeReserveStoreOf(
    roomObject: RoomObject & { store: StoreDefinition },
    resourceType: ResourceConstant,
  ) {
    // If our storing system is like a lab, nuker, power spawn
    if (roomObject instanceof Structure && separateStoreStructureTypes.has(roomObject.structureType)) {
      return roomObject.store.getCapacity(resourceType) - roomObject.reserveStore[resourceType]
    }

    return roomObject.store.getCapacity(resourceType) - roomObject.usedReserveStore
  }
}

export const roomObjectUtils = new RoomObjectUtils()
