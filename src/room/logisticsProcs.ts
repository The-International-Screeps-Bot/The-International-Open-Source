import { RoomLogisticsRequestTypes } from '../constants/general'
import { scalePriority } from 'utils/utils'

export class LogisticsProcs {
  static createCommuneContainerLogisticsRequests(room: Room) {
    this.createSourceContainerRequests(room)
    this.createFastFillerContainerRequests(room)
    this.createControllerContainerRequests(room)
    this.createMineralContainerRequests(room)
  }

  static createRemoteContainerLogisticsRequests(room: Room) {
    this.createSourceContainerRequests(room)
  }

  private static createFastFillerContainerRequests(room: Room) {
    const fastFillerContainers = room.roomManager.fastFillerContainers
    if (!fastFillerContainers.length) return

    for (const container of fastFillerContainers) {
      const energy = container.reserveStore.energy
      const capacity = container.store.getCapacity()

      if (energy > capacity * 0.5) {
        room.createRoomLogisticsRequest({
          target: container,
          maxAmount: energy * 0.5,
          onlyFull: true,
          type: RoomLogisticsRequestTypes.offer,
          priority: scalePriority(capacity, energy, 10, true),
        })
      }

      // If we're sufficiently full, we don't need to ask for more
      if (energy < capacity * 0.6) {
        room.createRoomLogisticsRequest({
          target: container,
          type: RoomLogisticsRequestTypes.transfer,
          onlyFull: true,
          priority: scalePriority(capacity, energy, 20),
        })
      }
    }
  }

  private static createSourceContainerRequests(room: Room) {
    for (const container of room.roomManager.sourceContainers) {
      if (!container) continue

      room.createRoomLogisticsRequest({
        target: container,
        type: RoomLogisticsRequestTypes.withdraw,
        onlyFull: true,
        priority: scalePriority(
          container.store.getCapacity(),
          container.reserveStore.energy,
          20,
          true,
        ),
      })
    }
  }

  private static createControllerContainerRequests(room: Room) {
    const container = room.roomManager.controllerContainer
    if (!container) return

    if (container.usedReserveStore > container.store.getCapacity() * 0.9) return

    let priority =
      room.controller.ticksToDowngrade < room.communeManager.controllerDowngradeUpgradeThreshold
        ? 0
        : 50
    priority += scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20)

    room.createRoomLogisticsRequest({
      target: container,
      type: RoomLogisticsRequestTypes.transfer,
      onlyFull: true,
      priority,
    })
  }

  private static createMineralContainerRequests(room: Room) {
    const container = room.roomManager.mineralContainer
    if (!container) return

    const resourceType = room.roomManager.mineral.mineralType

    room.createRoomLogisticsRequest({
      target: container,
      resourceType,
      type: RoomLogisticsRequestTypes.withdraw,
      onlyFull: true,
      priority:
        20 +
        scalePriority(
          container.store.getCapacity(),
          container.reserveStore[resourceType],
          20,
          true,
        ),
    })
  }

  static createCommuneRuinLogisticsRequests(room: Room) {
    for (const ruin of room.find(FIND_RUINS)) {
      for (const key in ruin.reserveStore) {
        const resourceType = key as ResourceConstant
        const amount = ruin.reserveStore[resourceType]
        if (amount < 50) continue

        room.createRoomLogisticsRequest({
          target: ruin,
          resourceType: resourceType,
          type: RoomLogisticsRequestTypes.withdraw,
          priority: Math.max(5, 20 - amount / 200),
        })
      }
    }
  }

  static createCommuneTombstoneLogisticsRequests(room: Room) {
    for (const tombstone of room.find(FIND_TOMBSTONES)) {
      for (const key in tombstone.reserveStore) {
        const resourceType = key as ResourceConstant
        const amount = tombstone.reserveStore[resourceType]
        if (amount < 50) continue

        room.createRoomLogisticsRequest({
          target: tombstone,
          resourceType: resourceType,
          type: RoomLogisticsRequestTypes.withdraw,
          priority: Math.max(5, 20 - amount / 200),
        })
      }
    }
  }

  static createCommuneDroppedResourceLogisticsRequests(room: Room) {
    for (const resource of room.roomManager.droppedResources) {
      if (resource.amount < 50) continue

      room.createRoomLogisticsRequest({
        target: resource,
        resourceType: resource.resourceType,
        type: RoomLogisticsRequestTypes.pickup,
        priority: Math.max(5, 20 - resource.reserveAmount / 200),
        onlyFull: true,
      })
    }
  }

  static createRemoteRuinLogisticsRequests(room: Room) {
    const resourceType = RESOURCE_ENERGY

    for (const ruin of room.find(FIND_RUINS)) {
      const amount = ruin.reserveStore[resourceType]
      if (amount < 50) continue

      room.createRoomLogisticsRequest({
        target: ruin,
        resourceType: resourceType,
        type: RoomLogisticsRequestTypes.withdraw,
        priority: Math.max(5, 20 - amount / 200),
      })
    }
  }

  static createRemoteTombstoneLogisticsRequests(room: Room) {
    const resourceType = RESOURCE_ENERGY

    for (const tombstone of room.find(FIND_TOMBSTONES)) {
      const amount = tombstone.reserveStore[resourceType]
      if (amount < 50) continue

      room.createRoomLogisticsRequest({
        target: tombstone,
        resourceType: resourceType,
        type: RoomLogisticsRequestTypes.withdraw,
        priority: Math.max(5, 20 - amount / 200),
      })
    }
  }

  static createRemoteDroppedResourceLogisticsRequests(room: Room) {
    for (const resource of room.roomManager.droppedResources) {
      if (resource.resourceType !== RESOURCE_ENERGY) continue
      if (resource.amount < 50) continue

      room.createRoomLogisticsRequest({
        target: resource,
        type: RoomLogisticsRequestTypes.pickup,
        priority: Math.max(5, 10 - resource.reserveAmount / 200),
      })
    }
  }

  static createCommuneStoringStructureLogisticsRequests(room: Room) {
    const storingStructures: AnyStoreStructure[] = []

    const storage = room.storage
    if (storage) storingStructures.push(storage)

    const terminal = room.terminal
    if (terminal && !terminal.effectsData.get(PWR_DISRUPT_TERMINAL))
      storingStructures.push(terminal)

    for (const structure of storingStructures) {
      room.createRoomLogisticsRequest({
        target: structure,
        onlyFull: true,
        type: RoomLogisticsRequestTypes.offer,
        priority: 0,
      })

      // We are close to full

      if (structure.usedReserveStore > structure.store.getCapacity() * 0.9) continue

      room.createRoomLogisticsRequest({
        target: structure,
        type: RoomLogisticsRequestTypes.transfer,
        priority: 100,
      })
    }
  }
}
