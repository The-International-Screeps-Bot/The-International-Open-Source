import './spawnFunctions'
import { spawnRequests } from './spawnRequests'

export function spawnManager(room: Room) {
    global.customLog('test', 'hi')
    const spawns: StructureSpawn[] = room.get('spawn')

    // Find spawns that aren't spawning

    const inactiveSpawns = spawns.filter(spawn => !spawn.spawning)

    // Stop if there are no inactiveSpawns

    if (inactiveSpawns.length == 0) return

    // Import spawningOpts

    const {
        spawningOpts,
        requiredCreeps,
    } = spawnRequests(room)

    let i = 0

    for (const spawningObject of spawningOpts) {

        // Iterate if there are no required creeps of role

        if (requiredCreeps[spawningObject.extraOpts.memory.role] == 0) continue

        // Try to find inactive spawn, if can't, stop

        const spawn = inactiveSpawns[i]
        if (!spawn) break

        // Enable dry run

        spawningObject.extraOpts.dryRun = true

        // See if creep can be spawned

        const testSpawnResult = spawn.advancedSpawn(spawningObject)

        // If creep can't be spawned

        if (testSpawnResult != 0) {

            // Log the error and stop

            global.customLog('Failed to spawn', testSpawnResult + ', ' + spawningObject.cost)
            break
        }

        // Disable dry run

        spawningObject.extraOpts.dryRun = false

        // Spawn creep

        spawn.advancedSpawn(spawningObject)

        // Remove one from requireCreeps of role

        requiredCreeps[spawningObject.extraOpts.memory.role] -= 1

        // Record an inactive spawn was used and iterate

        i++
        continue
    }
}
