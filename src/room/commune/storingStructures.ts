import { RoomLogisticsRequestTypes, customColors } from 'international/constants'
import { statsManager } from 'international/statsManager'
import { customLog } from 'utils/logging'
import { findCPUOf, findObjectWithID, randomTick, scalePriority } from 'utils/utils'
import { packCoord } from 'other/codec'
import { CommuneManager } from './commune'

export class StoringStructuresManager {
    communeManager: CommuneManager

    public constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        this.createRoomLogisticsRequests()
    }

    private createRoomLogisticsRequests() {
        const storingStructures: AnyStoreStructure[] = []

        const storage = this.communeManager.room.storage
        if (storage) storingStructures.push(storage)

        const terminal = this.communeManager.room.terminal
        if (terminal && !terminal.effectsData.get(PWR_DISRUPT_TERMINAL))
            storingStructures.push(terminal)

        for (const structure of storingStructures) {
            this.communeManager.room.createRoomLogisticsRequest({
                target: structure,
                onlyFull: true,
                type: RoomLogisticsRequestTypes.offer,
                priority: 0,
            })

            // We are close to full

            if (structure.usedReserveStore > structure.store.getCapacity() * 0.9) continue

            this.communeManager.room.createRoomLogisticsRequest({
                target: structure,
                type: RoomLogisticsRequestTypes.transfer,
                priority: 100,
            })

            /*
            for (const resourceType of RESOURCES_ALL) {
                this.communeManager.room.createRoomLogisticsRequest({
                    target: structure,
                    resourceType,
                    onlyFull: true,
                    type: 'offer',
                    priority: 0,
                })

                if (!createTransfer) continue

                this.communeManager.room.createRoomLogisticsRequest({
                    target: structure,
                    resourceType,
                    onlyFull: true,
                    type: 'transfer',
                    priority: 10,
                })
            }
             */
        }
    }
}
