import { creepRoles } from 'international/constants'
import { collectiveManager } from 'international/collective'
import { customLog, newID } from 'utils/utils'

export const spawnFunctions = {
    testSpawn: function (spawn: StructureSpawn, spawnRequest: SpawnRequest, requestID: number) {
        return spawn.spawnCreep(spawnRequest.body, requestID.toString(), { dryRun: true })
    },
    advancedSpawn: function (spawn: StructureSpawn, spawnRequest: SpawnRequest, requestID: number) {
        spawnRequest.extraOpts.energyStructures = spawn.room.spawningStructuresByPriority

        const creepName = [
            creepRoles.indexOf(spawnRequest.role),
            spawnRequest.cost,
            spawn.room.name,
            spawnRequest.defaultParts,
            requestID,
        ].join('_')

        return spawn.spawnCreep(spawnRequest.body, creepName, spawnRequest.extraOpts)
    },
}
