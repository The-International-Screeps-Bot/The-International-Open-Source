import { spawnRequests } from './spawnRequests'

export function spawnManager(room: Room) {

    const spawns: StructureSpawn[] = room.get('spawns')

    // Find spawns that aren't spawning

    const inactiveSpawns = spawns.filter(function(spawn: StructureSpawn) { return !spawn.spawning })

    // Stop if there are no inactiveSpawns

    if (inactiveSpawns.length == 0) return

    // Import spawningOpts

    const spawningOpts = spawnRequests(room)

    //

    for (let role of spawningOpts) {

        
    }
}
