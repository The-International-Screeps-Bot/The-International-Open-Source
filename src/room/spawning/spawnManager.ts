import { generalFuncs } from 'international/generalFunctions'
import './spawnFunctions'
import { spawnRequester } from './spawnRequester'

export function spawnManager(room: Room) {

    const spawns: StructureSpawn[] = room.get('spawn')

    // Find spawns that aren't spawning

    const inactiveSpawns = spawns.filter(spawn => !spawn.spawning)

    // Stop if there are no inactiveSpawns

    if (inactiveSpawns.length == 0) return

    // Otherwise get spawnRequests by running the spawnRequester

    const spawnRequests = spawnRequester(room)

    // Sort spawnRequests by their priority

    const prioritiesByAmount = Object.keys(spawnRequests).sort((a, b) => parseInt(a) - parseInt(b))

    // Track the inactive spawn index

    let spawnIndex = inactiveSpawns.length - 1

    // Loop through priorities inside prioritiesByAmount

    for (const priority of prioritiesByAmount) {

        // Try to find inactive spawn, if can't, stop the loop

        const spawn = inactiveSpawns[spawnIndex]
        if (!spawn) break

        // Otherwise get the spawnRequest using its priority

        const spawnRequest = spawnRequests[priority]

        // See if creep can be spawned

        const testSpawnResult = spawn.advancedSpawn(spawnRequest)

        // If creep can't be spawned

        if (!testSpawnResult) {

            // Log the error and stop the loop

            generalFuncs.customLog('Failed to spawn', testSpawnResult + ', ' + spawnRequest.cost + ', ' + spawningObj.body)
            break
        }

        // Disable dry run

        spawnRequest.extraOpts.dryRun = false

        // Spawn the creep

        spawn.advancedSpawn(spawnRequest)

        // Decrease the spawnIndex

        spawnIndex--

        // Remove the spawn from inactiveSpawns

        inactiveSpawns.pop()
    }
}
