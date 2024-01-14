import { NukeRequestKeys, Result, RoomLogisticsRequestTypes, RoomMemoryKeys } from 'international/constants'
import { scalePriority } from 'utils/utils'
import { CommuneManager } from './commune'
import { roomObjectUtils } from 'room/roomObjectUtils'

const nukerResources = [RESOURCE_ENERGY, RESOURCE_GHODIUM]

export class NukerManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]
        const requestName = roomMemory[RoomMemoryKeys.nukeRequest]
        if (!requestName) return

        const nuker = this.communeManager.room.roomManager.nuker
        if (!nuker) {
            return
        }

        if (this.createRoomLogisticsRequests(nuker) === Result.action) return

        const request = Memory.nukeRequests[requestName]
        nuker.launchNuke(
            new RoomPosition(request[NukeRequestKeys.x], request[NukeRequestKeys.y], requestName),
        )
    }

    private createRoomLogisticsRequests(nuker: StructureNuker) {
        let result = Result.noAction

        for (const resource of nukerResources) {
            if (roomObjectUtils.freeReserveStoreOf(nuker, resource) <= 0) continue

            this.communeManager.room.createRoomLogisticsRequest({
                target: nuker,
                type: RoomLogisticsRequestTypes.transfer,
                priority: 100,
            })

            result = Result.action
        }

        return result
    }
}
