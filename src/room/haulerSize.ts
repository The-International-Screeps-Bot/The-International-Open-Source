import { CPUBucketCapacity, haulerUpdateDefault } from 'international/constants'

Room.prototype.haulerSizeManager = function () {
    const { memory } = this

    memory.HU -= 1
    if (memory.HU > 0) return

    memory.HU = haulerUpdateDefault

    memory.HS = Number.MAX_SAFE_INTEGER
        /* Math.min(
            Math.max(
                Math.floor(((CPUBucketCapacity - CPUBucketCapacity * 0.3 - Game.cpu.bucket) / CPUBucketCapacity) * 50),
                1,
            ),
            48,
        ) * BODYPART_COST[MOVE] */
}
