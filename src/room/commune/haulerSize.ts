import { CPUBucketCapacity, RoomMemoryKeys, haulerUpdateDefault } from 'international/constants'
import { CommuneManager } from './commune'

export class HaulerSizeManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]

        // If there is no Hauler Size

        if (roomMemory[RoomMemoryKeys.minHaulerCost] === undefined) {
            // Make the cost the smallest possible

            roomMemory[RoomMemoryKeys.minHaulerCost] = BODYPART_COST[CARRY] + BODYPART_COST[MOVE]

            this.updateMinHaulerCost()
            return
        }

        if (Game.time - roomMemory[RoomMemoryKeys.minHaulerCostUpdate] < haulerUpdateDefault) return

        this.updateMinHaulerCost()
    }

    private updateMinHaulerCost() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]

        const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit
        const newMinHaulerCost =
            (Math.floor(
                Math.max(Math.pow(avgCPUUsagePercent, 1.3) - 0.4, 0) *
                    Math.min(this.communeManager.room.energyCapacityAvailable / BODYPART_COST.move, MAX_CREEP_SIZE),
            ) +
                this.communeManager.room.roomManager.structures.spawn.length * 2) *
            BODYPART_COST[CARRY]

        let diff
        if (newMinHaulerCost < roomMemory[RoomMemoryKeys.minHaulerCost])
            diff = (newMinHaulerCost - roomMemory[RoomMemoryKeys.minHaulerCost]) / 2
        else diff = newMinHaulerCost - roomMemory[RoomMemoryKeys.minHaulerCost]

        roomMemory[RoomMemoryKeys.minHaulerCost] += Math.floor(diff)
        roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time
    }
}
