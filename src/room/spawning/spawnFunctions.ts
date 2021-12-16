StructureSpawn.prototype.advancedSpawn = function(spawningObject: {[key: string]: any}) {

    const spawn: StructureSpawn = this

    const spawnResult = spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role + ', T' + spawningObject.tier + ', ' + global.newID(), spawningObject.extraOpts)
    return spawnResult
}
