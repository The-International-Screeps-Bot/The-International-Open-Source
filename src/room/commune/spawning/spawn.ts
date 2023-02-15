import { creepRoles } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

const CREEP_NAME_SEPARATOR = '_';

StructureSpawn.prototype.testSpawn = function (spawnRequest, ID) {
    return this.spawnCreep(spawnRequest.body, ID.toString(), { dryRun: true });
}

StructureSpawn.prototype.advancedSpawn = function (spawnRequest, ID) {
    const { body, role, cost, defaultParts, extraOpts } = spawnRequest;
    extraOpts.energyStructures = this.room.spawningStructuresByPriority;

    return this.spawnCreep(
      body,
      `${creepRoles.indexOf(role)}${CREEP_NAME_SEPARATOR}${cost}${CREEP_NAME_SEPARATOR}${this.room.name}${CREEP_NAME_SEPARATOR}${defaultParts}${CREEP_NAME_SEPARATOR}${ID}`,
      extraOpts,
    );
}