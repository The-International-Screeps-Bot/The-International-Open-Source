import { generalFuncs } from "international/generalFunctions"

StructureSpawn.prototype.advancedSpawn = function(spawningObject: {[key: string]: any}) {

    const spawn: StructureSpawn = this

    const spawnResult = spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role + ', T' + spawningObject.tier + ', ' + generalFuncs.newID(), spawningObject.extraOpts)
    return spawnResult
}
