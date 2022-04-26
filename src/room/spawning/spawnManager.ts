
import { customLog } from 'international/generalFunctions'
import './spawnFunctions'
import { spawnRequester } from './spawnRequestManager'

export function spawnManager(room: Room) {

    // Get spawns in the room

    const spawns: StructureSpawn[] = room.get('spawn'),

    // Find spawns that aren't spawning

    inactiveSpawns = spawns.filter(spawn => !spawn.spawning)

    // Stop if there are no inactiveSpawns

    if (!inactiveSpawns.length) return

    // Otherwise get spawnRequests by running the spawnRequester

    const spawnRequests = spawnRequester(room),

    // Sort spawnRequests by their priority

    requestsByPriority = Object.keys(spawnRequests).sort((a, b) => parseInt(a) - parseInt(b))
    for (const i in spawnRequests) customLog('Spawn Reqs', i + ', ' + spawnRequests[i].extraOpts.memory.role + ', ' + spawnRequests[i].body)
    // Track the inactive spawn index

    let spawnIndex = inactiveSpawns.length - 1

    // Loop through priorities inside requestsByPriority

    for (const priority of requestsByPriority) {

        // Stop if the spawnIndex is negative

        if (spawnIndex < 0) break

        // Try to find inactive spawn, if can't, stop the loop

        const spawn = inactiveSpawns[spawnIndex],

        // Otherwise get the spawnRequest using its priority

        spawnRequest = spawnRequests[priority],

        // See if creep can be spawned

        testSpawnResult = spawn.advancedSpawn(spawnRequest)

        // If creep can't be spawned

        if (testSpawnResult != OK) {

            // Log the error and stop the loop

            customLog('Failed to spawn', testSpawnResult + ', ' + spawnRequest.extraOpts.memory.role + ', ' + spawnRequest.cost + ', ' + spawnRequest.body)
            break
        }

        // Disable dry run

        spawnRequest.extraOpts.dryRun = false

        // Spawn the creep

        spawn.advancedSpawn(spawnRequest)

        // Decrease the spawnIndex

        spawnIndex--
    }
}
