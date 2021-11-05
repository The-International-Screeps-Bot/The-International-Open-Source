interface StructureSpawn {
    [key: string]: any
}

StructureSpawn.prototype.advancedSpawn = function(spawningObject: any) {

    const spawn = this

    const spawnResult = spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role, spawningObject.extraOpts)
    return spawnResult
}
