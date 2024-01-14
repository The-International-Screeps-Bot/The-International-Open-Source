import { CreepMemoryKeys, creepRoles } from 'international/constants'
import { SpawnRequest } from 'types/spawnRequest'

export class SpawnUtils {
  testSpawn(spawn: StructureSpawn, body: BodyPartConstant[], requestID: number) {
    return spawn.spawnCreep(body, requestID.toString(), { dryRun: true })
  }

  advancedSpawn(
    spawn: StructureSpawn,
    spawnRequest: SpawnRequest,
    body: BodyPartConstant[],
    requestID: number,
  ) {
    const creepName = `${creepRoles.indexOf(spawnRequest.role)}_${spawn.room.name}_${requestID}`

    spawnRequest.extraOpts.energyStructures = spawn.room.communeManager.spawningStructuresByPriority

    spawnRequest.extraOpts.memory[CreepMemoryKeys.defaultParts] = spawnRequest.defaultParts
    spawnRequest.extraOpts.memory[CreepMemoryKeys.cost] = spawnRequest.cost

    const spawnResult = spawn.spawnCreep(body, creepName, spawnRequest.extraOpts)
    return spawnResult
  }
}

export const spawnUtils = new SpawnUtils()
