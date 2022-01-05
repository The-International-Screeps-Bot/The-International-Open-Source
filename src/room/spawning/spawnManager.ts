import './spawnFunctions'
import { spawnRequests } from './spawnRequests'

export function spawnManager(room: Room) {

    const spawns: StructureSpawn[] = room.get('spawn')

    // Find spawns that aren't spawning

    const inactiveSpawns = spawns.filter(spawn => !spawn.spawning)

    // Stop if there are no inactiveSpawns

    if (inactiveSpawns.length == 0) return

    // Import spawningOpts

    const {
        spawningObjs,
        requiredCreeps,
    } = spawnRequests(room)

    let i = 0

    // Construct role and iterate through each key in spawnObjs

    let role: CreepRoles

    for (role in spawningObjs) {

        // Iterate if there are no required creeps of role

        if (requiredCreeps[role] == 0) continue

        // Try to find inactive spawn, if can't, stop

        const spawn = inactiveSpawns[i]
        if (!spawn) break

        // Find a spawningObject with a role of role

        const spawningObj = spawningObjs[role]

        // Enable dry run

        spawningObj.extraOpts.dryRun = true

        // See if creep can be spawned

        const testSpawnResult = spawn.advancedSpawn(spawningObj)

        // If creep can't be spawned

        if (testSpawnResult != 0) {

            // Log the error and stop

            global.customLog('Failed to spawn', testSpawnResult + ', ' + spawningObj.cost + ', ' + spawningObj.body)
            break
        }

        // Disable dry run

        spawningObj.extraOpts.dryRun = false

        // Spawn creep

        spawn.advancedSpawn(spawningObj)

        // Remove one from requireCreeps of role

        requiredCreeps[spawningObj.extraOpts.memory.role] -= 1

        // Record an inactive spawn was used and iterate

        i++
        continue
    }
}
