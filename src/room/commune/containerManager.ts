import { customLog } from 'international/utils'
import { CommuneManager } from './communeManager'

export class ContainerManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {

        this.runFastFillerContainers()
        this.runSourceContainers()
        this.runControllerContainer()
        this.runMineralContainer()
    }

    private runFastFillerContainers() {

        const fastFillerContainers = [this.communeManager.room.fastFillerContainerLeft, this.communeManager.room.fastFillerContainerRight]

        for (const container of fastFillerContainers) {

            if (!container) continue

            this.communeManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'transfer',
                onlyFull: true,
                priority: (container.store.getCapacity() / container.reserveStore.energy) * 5
            })

            this.communeManager.room.createRoomLogisticsRequest({
                target: container,
                threshold: container.store.getCapacity() / 2,
                maxAmount: container.reserveStore.energy / 2,
                onlyFull: true,
                type: 'offer',
                priority: (container.reserveStore.energy / container.store.getCapacity()) * 5
            })
        }
    }

    private runSourceContainers() {

        for (const container of this.communeManager.room.sourceContainers) {

            this.communeManager.room.createRoomLogisticsRequest({
                target: container,
                type: 'withdraw',
                onlyFull: true,
                priority: (container.reserveStore.energy / container.store.getCapacity()) * 5
            })
        }
    }

    private runControllerContainer() {

        const container = this.communeManager.room.mineralContainer
        if (!container) return

        this.communeManager.room.createRoomLogisticsRequest({
            target: container,
            resourceType: this.communeManager.room.mineral.mineralType,
            type: 'transfer',
            threshold: container.store.getCapacity() * 0.75,
            priority: (container.store.getCapacity() / container.reserveStore.energy) * 5
        })
    }

    private runMineralContainer() {

        const container = this.communeManager.room.mineralContainer
        if (!container) return

        const resourceType = this.communeManager.room.mineral.mineralType

        this.communeManager.room.createRoomLogisticsRequest({
            target: container,
            resourceType,
            type: 'withdraw',
            onlyFull: true,
            priority: (container.reserveStore[resourceType] / container.store.getCapacity()) * 5
        })
    }
}
