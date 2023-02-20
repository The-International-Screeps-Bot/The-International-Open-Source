import { customLog, scalePriority } from 'international/utils'
import { RoomManager } from 'room/room'

export class TombstoneManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    runCommune() {
        for (const tombstone of this.roomManager.room.find(FIND_TOMBSTONES)) {
            for (const key in tombstone.reserveStore) {
                const resourceType = key as ResourceConstant
                const amount = tombstone.reserveStore[resourceType]
                if (amount < 50) continue

                this.roomManager.room.createRoomLogisticsRequest({
                    target: tombstone,
                    resourceType: resourceType,
                    type: 'withdraw',
                    priority: Math.max(5, 20 - amount / 200),
                })
            }
        }
    }

    runRemote() {
        const resourceType = RESOURCE_ENERGY

        for (const tombstone of this.roomManager.room.find(FIND_TOMBSTONES)) {
            const amount = tombstone.reserveStore[resourceType]
            if (amount < 50) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: tombstone,
                resourceType: resourceType,
                type: 'withdraw',
                priority: Math.max(5, 20 - amount / 200),
            })
        }
    }
}
