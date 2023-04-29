import { NukeRequestKeys, RESULT_ACTION, RESULT_NO_ACTION, RoomMemoryKeys } from 'international/constants'
import { scalePriority } from 'international/utils'
import { CommuneManager } from './commune'

const nukerResources = [RESOURCE_ENERGY, RESOURCE_GHODIUM]

export class NukerManager {
    communeManager: CommuneManager
    nuker: StructureNuker

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
        this.nuker = this.communeManager.room.roomManager.structures.nuker[0]
    }

    run() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]
        const requestName = roomMemory[RoomMemoryKeys.nukeRequest]
        if (!requestName) return

        if (!this.nuker) {
            return
        }

        if (this.createRoomLogisticsRequests() === RESULT_ACTION) return

        const request = Memory.nukeRequests[requestName]
        this.nuker.launchNuke(new RoomPosition(request[NukeRequestKeys.x], request[NukeRequestKeys.y], requestName))
    }

    private createRoomLogisticsRequests() {
        let result = RESULT_NO_ACTION

        for (const resource of nukerResources) {
            if (this.nuker.freeReserveStoreOf(resource) <= 0) continue

            this.communeManager.room.createRoomLogisticsRequest({
                target: this.nuker,
                type: 'transfer',
                priority: 100,
            })

            result = RESULT_ACTION
        }

        return result
    }
}
