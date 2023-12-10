import { CPUBucketCapacity, RoomMemoryKeys, haulerUpdateDefault } from 'international/constants'
import { CommuneManager } from './commune'
import { randomIntRange } from 'utils/utils'

export class HaulerSizeManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]

        // If there is no Hauler Size

        if (roomMemory[RoomMemoryKeys.minHaulerCost] === undefined) {

            roomMemory[RoomMemoryKeys.minHaulerCost] = Memory.minHaulerCost
            roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(1500, 3000)
            return
        }

        if (Game.time - roomMemory[RoomMemoryKeys.minHaulerCostUpdate] < haulerUpdateDefault) return

        this.updateMinHaulerCost()
    }

    private updateMinHaulerCost() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]

        roomMemory[RoomMemoryKeys.minHaulerCost] = Memory.minHaulerCost
        roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(0, 10)
    }
}
