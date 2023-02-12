import { creepRoles, customColors, partsByPriority } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

StructureSpawn.prototype.testSpawn = function (spawnRequest, ID) {
    return this.spawnCreep(spawnRequest.body, ID.toString(), { dryRun: true })
}

StructureSpawn.prototype.advancedSpawn = function (spawnRequest, ID) {

    spawnRequest.extraOpts.energyStructures = this.room.spawningStructuresByPriority

    return this.spawnCreep(
        spawnRequest.body,
        `${creepRoles.indexOf(spawnRequest.role)}_${spawnRequest.cost}_${this.room.name}_${
            spawnRequest.defaultParts
        }_${ID}`,
        spawnRequest.extraOpts,
    )
}
