import { creepRoles } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

StructureSpawn.prototype.testSpawn = function (spawnRequest, ID) {
    return this.spawnCreep(spawnRequest.body, ID.toString(), { dryRun: true })
}

StructureSpawn.prototype.advancedSpawn = function (spawnRequest, ID) {
    spawnRequest.extraOpts.energyStructures = this.room.spawningStructuresByPriority

    const creepName = [
        creepRoles.indexOf(spawnRequest.role),
        spawnRequest.cost,
        this.room.name,
        spawnRequest.defaultParts,
        ID,
    ].join('_')

    return this.spawnCreep(spawnRequest.body, creepName, spawnRequest.extraOpts)
}
