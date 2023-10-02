import { customLog } from 'utils/logging'
import { scalePriority } from 'utils/utils'
import { RoomManager } from 'room/room'
import { RoomLogisticsRequestTypes } from 'international/constants'

export class DroppedResourceManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    runCommune() {
        for (const resource of this.roomManager.droppedResources) {
            if (resource.amount < 50) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: resource,
                resourceType: resource.resourceType,
                type: RoomLogisticsRequestTypes.pickup,
                priority: Math.max(5, 20 - resource.reserveAmount / 200),
                onlyFull: true,
            })
        }
    }

    runRemote() {
        for (const resource of this.roomManager.droppedResources) {
            if (resource.resourceType !== RESOURCE_ENERGY) continue
            if (resource.amount < 50) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: resource,
                type: RoomLogisticsRequestTypes.pickup,
                priority: Math.max(5, 10 - resource.reserveAmount / 200),
            })
        }
    }
}
