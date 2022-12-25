import { customLog, scalePriority } from 'international/utils'
import { RoomManager } from 'room/room'


export class DroppedResourceManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    run() {

        this.runDroppedResources()
    }

    private runDroppedResources() {

        for (const resource of this.roomManager.room.droppedResources) {

            if (resource.amount < 50) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: resource,
                resourceType: resource.resourceType,
                type: 'pickup',
                priority: Math.max(5, 20 - resource.reserveAmount / 200),
            })
        }
    }
}
