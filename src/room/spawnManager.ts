import { spawnRequests } from './spawnRequests'

export function spawnManager(room: Room) {

    const spawns: StructureSpawn[] = room.get('spawns')

    // Find spawns that aren't spawning

    const inactiveSpawns = spawns.filter(function(spawn: StructureSpawn) { return !spawn.spawning })

    // Stop if there are no inactiveSpawns

    if (inactiveSpawns.length == 0) return

    // Import spawningOpts

    const {
        spawningOpts,
        requiredCreeps,
     } = spawnRequests(room)

    //

    let i = 0

    for (let spawningObject of spawningOpts) {

        // Iterate if there are no required creeps of role

        if (requiredCreeps[spawningObject.extraOpts.memory.role] == 0) continue

        // Try to find inactive spawn, if can't, stop

        const spawn = inactiveSpawns[i]
        if (!spawn) break

        // Enable dry run

        spawningObject.extraOpts.dryRun = true

        // See if creep can be spawned, stop if it can't

        const testSpawn = spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role, spawningObject.extraOpts)
        if (testSpawn == 0) break

        // Disable dry run

        spawningObject.extraOpts.dryRun = false

        // Spawn creep

        spawn.spawnCreep(spawningObject.body, spawningObject.extraOpts.memory.role, spawningObject.extraOpts)

        // Record an inactive spawn was used and iterate

        i++
        continue

        // Game.spawns.Spawn1.spawnCreep([MOVE], 'sourceHarvester', { memory: { role: 'sourceHarvester' } })
    }
}
