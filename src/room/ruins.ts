import { customLog, scalePriority } from 'international/utils'
import { RoomManager } from 'room/room'

export class RuinManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    runCommune() {
        for (const ruin of this.roomManager.room.find(FIND_RUINS)) {
            for (const key in ruin.reserveStore) {
                const resourceType = key as ResourceConstant
                const amount = ruin.reserveStore[resourceType]
                if (amount < 50) continue

                this.roomManager.room.createRoomLogisticsRequest({
                    target: ruin,
                    resourceType: resourceType,
                    type: 'withdraw',
                    priority: Math.max(5, 20 - amount / 200),
                })
            }
        }
    }

    runRemote() {
        const resourceType = RESOURCE_ENERGY

        for (const ruin of this.roomManager.room.find(FIND_RUINS)) {
            const amount = ruin.reserveStore[resourceType]
            if (amount < 50) continue

            this.roomManager.room.createRoomLogisticsRequest({
                target: ruin,
                resourceType: resourceType,
                type: 'withdraw',
                priority: Math.max(5, 20 - amount / 200),
            })
        }
    }
}
