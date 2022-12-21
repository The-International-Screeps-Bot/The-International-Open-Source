import { CPUBucketCapacity, haulerUpdateDefault } from 'international/constants'
import { CommuneManager } from './commune'

export class HaulerSizeManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        const roomMemory = Memory.rooms[this.communeManager.room.name]

        roomMemory.HU -= 1
        if (roomMemory.HU > 0) return

        roomMemory.HU = haulerUpdateDefault

        const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit

        // Use to average energy usage percent and the energy capacity availible in the room to determine the max hauler size

        roomMemory.MHC =
            (Math.floor(
                Math.max(Math.pow(avgCPUUsagePercent, 1.3) - 0.4, 0) *
                    Math.min(this.communeManager.room.energyCapacityAvailable / BODYPART_COST.move, MAX_CREEP_SIZE),
            ) +
                this.communeManager.room.structures.spawn.length * 2) *
            BODYPART_COST[CARRY]
    }
}
