global.killAllCreeps = function() {

    // Loop through each creepName

    for (const creepName in Game.creeps) {

        // Construct and suicide the creep

        const creep = Game.creeps[creepName]
        creep.suicide()
    }

    return 'Killed all creeps'
}
