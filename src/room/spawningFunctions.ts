interface StructureSpawn {
    [key: string]: any
}

StructureSpawn.prototype.advancedSpawn = function(spawningObject: any) {

    const spawn: StructureSpawn = this

    const spawnResult = spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role + ', T' + spawningObject.tier + ', ' + Game.time % 20000, spawningObject.extraOpts)
    return spawnResult
}
