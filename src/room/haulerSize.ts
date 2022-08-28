import { CPUBucketCapacity, haulerUpdateDefault } from 'international/constants'

Room.prototype.haulerSizeManager = function () {
    const { memory } = this

    memory.HU -= 1
    if (memory.HU > 0) return

    memory.HU = haulerUpdateDefault

    const avgCPUUsagePercent = (Memory.stats.cpu.usage || 20) / Game.cpu.limit

    // Use to average energy usage percent and the energy capacity availible in the room to determine the max hauler size

    memory.MHC =
        (Math.floor(
            Math.max(Math.pow(avgCPUUsagePercent, 1.5) - 0.4, 0) *
                Math.min(this.energyCapacityAvailable / BODYPART_COST.move, MAX_CREEP_SIZE),
        ) + this.structures.spawn.length * 2) * BODYPART_COST[CARRY]

    /* memory.MHC = Number.MAX_SAFE_INTEGER */
    /* memory.MHC = Math.min(
        Math.max(
            Math.floor(((CPUBucketCapacity - CPUBucketCapacity * 0.3 - Game.cpu.bucket) / CPUBucketCapacity) * 50),
            1,
        ),
        MAX_CREEP_SIZE,
    ) * BODYPART_COST[MOVE] || Number.MAX_SAFE_INTEGER */
}
