import { creepRoles } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

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
    }
}
