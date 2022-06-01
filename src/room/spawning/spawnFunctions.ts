import { newID } from 'international/generalFunctions'

StructureSpawn.prototype.advancedSpawn = function (spawnRequest) {
    const spawn = this

    // Attempt to spawn using the values in the spawnRequest

    return spawn.spawnCreep(
        spawnRequest.body,
        `${spawnRequest.extraOpts.memory.role}, T${
            spawnRequest.tier
        }, ${newID()}`,
        spawnRequest.extraOpts
    )
}
