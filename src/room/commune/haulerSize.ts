import { CPUBucketCapacity, haulerUpdateDefault } from 'international/constants'
import { CommuneManager } from './commune'

export class HaulerSizeManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {

        const roomMemory = Memory.rooms[this.communeManager.room.name]

        // If there is no Hauler Size

        if (roomMemory.MHC === undefined) {

            // We have multiple communes, start at max possible cost

            if (global.communes.size > 1) {

                roomMemory.HU = haulerUpdateDefault
                roomMemory.MHC = this.communeManager.room.energyCapacityAvailable
                return
            }

            // Make the cost the smallest possible

            roomMemory.MHC = BODYPART_COST[CARRY] + BODYPART_COST[MOVE]

            this.updateMinHaulerCost()
            return
        }

        roomMemory.HU -= 1
        if (roomMemory.HU > 0) return

        this.updateMinHaulerCost()
    }

    private updateMinHaulerCost() {

        const roomMemory = Memory.rooms[this.communeManager.room.name]

        roomMemory.HU = haulerUpdateDefault

        const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit
        const newMinHaulerCost =
            (Math.floor(
                Math.max(Math.pow(avgCPUUsagePercent, 1.3) - 0.4, 0) *
                    Math.min(this.communeManager.room.energyCapacityAvailable / BODYPART_COST.move, MAX_CREEP_SIZE),
            ) +
                this.communeManager.room.structures.spawn.length * 2) *
            BODYPART_COST[CARRY]

        let diff
        if (newMinHaulerCost < roomMemory.MHC) diff = (newMinHaulerCost - roomMemory.MHC) / 3
        else diff = newMinHaulerCost - roomMemory.MHC

        roomMemory.MHC += Math.floor(diff)
    }
}
