import { creepRoles } from 'international/constants'
import { SpawnRequest } from 'types/spawnRequest'

export class SpawnUtils {
    testSpawn(spawn: StructureSpawn, body: BodyPartConstant[], requestID: number) {
        return spawn.spawnCreep(body, requestID.toString(), { dryRun: true })
    }

    advancedSpawn(spawn: StructureSpawn, spawnRequest: SpawnRequest, body: BodyPartConstant[], requestID: number) {
        spawnRequest.extraOpts.energyStructures =
            spawn.room.communeManager.spawningStructuresByPriority

        const creepName = [
            creepRoles.indexOf(spawnRequest.role),
            spawnRequest.cost,
            spawn.room.name,
            spawnRequest.defaultParts,
            requestID,
        ].join('_')

        const spawnResult = spawn.spawnCreep(body, creepName, spawnRequest.extraOpts)
        return spawnResult
    }
}

export const spawnUtils = new SpawnUtils()
