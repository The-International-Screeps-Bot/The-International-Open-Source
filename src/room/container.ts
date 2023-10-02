import { RoomLogisticsRequestTypes, customColors } from 'international/constants'
import { customLog } from 'utils/logging'
import { scalePriority } from 'utils/utils'
import { RoomManager } from './room'

export class ContainerManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    runRemote() {
        this.runSourceContainers()
    }

    runCommune() {
        this.runSourceContainers()
        this.runFastFillerContainers()
        this.runControllerContainer()
        this.runMineralContainer()
    }

    private runFastFillerContainers() {
        if (!this.roomManager.room.myCreeps.fastFiller.length) return

        const fastFillerContainers = this.roomManager.fastFillerContainers

        for (const container of fastFillerContainers) {
            if (container.reserveStore.energy > container.store.getCapacity() * 0.9) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                type: RoomLogisticsRequestTypes.transfer,
                onlyFull: true,
                priority: scalePriority(
                    container.store.getCapacity(),
                    container.reserveStore.energy,
                    20,
                ),
            })

            if (container.reserveStore.energy < container.store.getCapacity() * 0.5) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                maxAmount: container.reserveStore.energy * 0.5,
                onlyFull: true,
                type: RoomLogisticsRequestTypes.offer,
                priority: scalePriority(
                    container.store.getCapacity(),
                    container.reserveStore.energy,
                    10,
                    true,
                ),
            })
        }
    }

    private runSourceContainers() {
        for (const container of this.roomManager.sourceContainers) {
            if (!container) continue

            this.roomManager.room.createRoomLogisticsRequest({
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

    private runControllerContainer() {
        const container = this.roomManager.controllerContainer
        if (!container) return

        if (container.usedReserveStore > container.store.getCapacity() * 0.9) return

        let priority =
            this.roomManager.room.controller.ticksToDowngrade <
            this.roomManager.room.communeManager.controllerDowngradeUpgradeThreshold
                ? 0
                : 50
        priority += scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20)

        this.roomManager.room.createRoomLogisticsRequest({
            target: container,
            type: RoomLogisticsRequestTypes.transfer,
            onlyFull: true,
            priority,
        })
    }

    private runMineralContainer() {
        const container = this.roomManager.mineralContainer
        if (!container) return

        const resourceType = this.roomManager.mineral.mineralType

        this.roomManager.room.createRoomLogisticsRequest({
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
}
