import { customLog, scalePriority } from 'international/utils'
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

        const fastFillerContainers = [
            this.roomManager.room.fastFillerContainerLeft,
            this.roomManager.room.fastFillerContainerRight,
        ]

        for (const container of fastFillerContainers) {
            if (!container) continue
            if (container.reserveStore.energy > container.store.getCapacity() * 0.8) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'transfer',
                threshold: container.store.getCapacity(),
                onlyFull: true,
                priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20),
            })

            if (container.reserveStore.energy < container.store.getCapacity() * 0.6) {
                this.roomManager.room.createRoomLogisticsRequest({
                    target: container,
                    maxAmount: container.reserveStore.energy * 0.5,
                    onlyFull: true,
                    type: 'offer',
                    priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20, true),
                })
            }
        }
    }

    private runSourceContainers() {
        for (const container of this.roomManager.room.sourceContainers) {
            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'withdraw',
                onlyFull: true,
                priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20, true),
            })
        }
    }

    private runControllerContainer() {
        const container = this.roomManager.room.controllerContainer
        if (!container) return

        this.roomManager.room.createRoomLogisticsRequest({
            target: container,
            type: 'transfer',
            threshold: container.store.getCapacity() * 0.75,
            priority: 50 + scalePriority(container.store.getCapacity(), container.reserveStore.energy, 20),
        })
    }

    private runMineralContainer() {
        const container = this.roomManager.room.mineralContainer
        if (!container) return

        const resourceType = this.roomManager.room.mineral.mineralType

        this.roomManager.room.createRoomLogisticsRequest({
            target: container,
            resourceType,
            type: 'withdraw',
            onlyFull: true,
            priority: 20 + scalePriority(container.store.getCapacity(), container.reserveStore[resourceType], 20, true),
        })
    }
}
