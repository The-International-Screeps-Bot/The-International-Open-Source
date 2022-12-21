import { customColors } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog, findObjectWithID, randomTick, scalePriority } from 'international/utils'
import { packCoord } from 'other/packrat'
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
        const storingStructures: AnyStoreStructure[] = [this.communeManager.room.storage]

        const terminal = this.communeManager.room.terminal
        if (!terminal.effectsData.get(PWR_DISRUPT_TERMINAL)) storingStructures.push(terminal)

        for (const structure of storingStructures) {
            if (!structure) continue

            const createTransfer = structure.freeNextStore() > structure.store.getCapacity() * 0.9

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
        }
    }
}
