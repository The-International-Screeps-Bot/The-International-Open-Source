import { NukeRequestKeys, Result, RoomLogisticsRequestTypes, RoomMemoryKeys } from 'international/constants'
import { scalePriority } from 'utils/utils'
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

        if (this.createRoomLogisticsRequests() === Result.action) return

        const request = Memory.nukeRequests[requestName]
        this.nuker.launchNuke(
            new RoomPosition(request[NukeRequestKeys.x], request[NukeRequestKeys.y], requestName),
        )
    }

    private createRoomLogisticsRequests() {
        let result = Result.noAction

        for (const resource of nukerResources) {
            if (this.nuker.freeReserveStoreOf(resource) <= 0) continue

            this.communeManager.room.createRoomLogisticsRequest({
                target: this.nuker,
                type: RoomLogisticsRequestTypes.transfer,
                priority: 100,
            })

            result = Result.action
        }

        return result
    }
}
