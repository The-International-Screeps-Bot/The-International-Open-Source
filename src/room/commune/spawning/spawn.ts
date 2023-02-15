import { creepRoles } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

StructureSpawn.prototype.testSpawn = function(spawnRequest, ID) {
    return this.spawnCreep(spawnRequest.body, ID.toString(), { dryRun: true })
}

StructureSpawn.prototype.advancedSpawn = function(spawnRequest, ID) {
    const { body, role, cost, defaultParts, extraOpts } = spawnRequest

    extraOpts.energyStructures = this.room.spawningStructuresByPriority

    const creepNameComponents = [
        creepRoles.indexOf(role),
        cost,
        this.room.name,
        defaultParts,
        ID
    ]

    const creepName = creepNameComponents.join('_')

    return this.spawnCreep(body, creepName, extraOpts)
}