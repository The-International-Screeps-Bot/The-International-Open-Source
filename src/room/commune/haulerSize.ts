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
        /*
        const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit
        const newMinHaulerCost =
            (Math.floor(
                Math.max(Math.pow(avgCPUUsagePercent, 1.3) - 0.4, 0) *
                    Math.min(
                        this.communeManager.room.energyCapacityAvailable / BODYPART_COST.move,
                        MAX_CREEP_SIZE,
                    ),
            ) +
                this.communeManager.room.roomManager.structures.spawn.length * 2) *
            BODYPART_COST[CARRY]
        */
        /*
        const newMinHaulerCost = Math.max(
            Math.floor(
                this.communeManager.room.energyCapacityAvailable *
                    Math.pow((Memory.stats.cpu.usage / Game.cpu.limit) * 1.1, 4),
            ),
            this.communeManager.room.roomManager.structures.spawn.length * 2 * BODYPART_COST[CARRY],
        )

        const diff = (newMinHaulerCost - roomMemory[RoomMemoryKeys.minHaulerCost]) / 2

        roomMemory[RoomMemoryKeys.minHaulerCost] += Math.floor(diff)
        roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time
 */

        roomMemory[RoomMemoryKeys.minHaulerCost] -= Math.floor(
            (roomMemory[RoomMemoryKeys.minHaulerCost] * Memory.minHaulerCostError) / 2,
        )

        roomMemory[RoomMemoryKeys.minHaulerCost] = Math.max(
            roomMemory[RoomMemoryKeys.minHaulerCost],
            BODYPART_COST[CARRY] * 2 + BODYPART_COST[MOVE],
        )

        // don't let it exceed the max possible cost by too much (will take awhile to match delta)
        roomMemory[RoomMemoryKeys.minHaulerCost] = Math.min(
            roomMemory[RoomMemoryKeys.minHaulerCost],
            this.communeManager.room.energyCapacityAvailable * 1.2,
        )

        roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time
    }
}
