
import { constants } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './spawnFunctions'
import { spawnRequester } from './spawnRequestManager'

export function spawnManager(room: Room) {

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

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

        // Record in stats the costs

        room.energyAvailable -= spawnRequest.cost

        Memory.stats.energySpentOnCreeps += spawnRequest.cost

        // Decrease the spawnIndex

        spawnIndex--
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.cpuLogging) customLog('Spawn Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, constants.colors.lightGrey)
}
