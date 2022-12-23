import { customLog, scalePriority } from 'international/utils'
import { RoomManager } from './room'

export class ContainerManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    run() {
        this.runSourceContainers()

        if (this.roomManager.room.memory.T === 'remote') return

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

            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'transfer',
                threshold: container.store.getCapacity(),
                onlyFull: true,
                priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 5, true),
            })

            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                threshold: container.store.getCapacity() * 0.75,
                maxAmount: container.reserveStore.energy * 0.75,
                onlyFull: true,
                type: 'offer',
                priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 5, true),
            })
        }
    }

    private runSourceContainers() {
        for (const container of this.roomManager.room.sourceContainers) {
            this.roomManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'withdraw',
                onlyFull: true,
                priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 5, true),
            })
        }
    }

    private runControllerContainer() {
        const container = this.roomManager.room.controllerContainer
        if (!container) return

        this.roomManager.room.createRoomLogisticsRequest({
            target: container,
            resourceType: this.roomManager.room.mineral.mineralType,
            type: 'transfer',
            threshold: container.store.getCapacity() * 0.75,
            priority: scalePriority(container.store.getCapacity(), container.reserveStore.energy, 5),
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
            priority: scalePriority(container.store.getCapacity(), container.reserveStore[resourceType], 5, true),
        })
    }
}
