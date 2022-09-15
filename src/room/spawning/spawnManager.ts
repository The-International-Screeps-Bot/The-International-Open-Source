import { myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './spawnFunctions'
import './spawnRequestManager'

Room.prototype.spawnManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Find spawns that aren't spawning

    const inactiveSpawns = this.structures.spawn.filter(spawn => !spawn.spawning)
    if (!inactiveSpawns.length) return

    // Construct spawnRequests

    this.spawnRequester()

    // Sort spawnRequests by their priority

    const requestsByPriority = Object.keys(this.spawnRequests).sort((a, b) => {
        return parseInt(a) - parseInt(b)
    })
/*
    for (const priority in this.spawnRequests) {

        const request = this.spawnRequests[priority]

        customLog('SPAWN REQUESTS', priority + ', ' + request.role + ', ' + request.extraOpts.memory?.RN + ', ' + request.extraOpts.memory?.SI)
    } */

    // Track the inactive spawn index

    let spawnIndex = inactiveSpawns.length - 1

    // Loop through priorities inside requestsByPriority

    for (const priority of requestsByPriority) {
        // Stop if the spawnIndex is negative

        if (spawnIndex < 0) break

        // Try to find inactive spawn, if can't, stop the loop

        const spawn = inactiveSpawns[spawnIndex]

        // Otherwise get the spawnRequest using its priority

        const spawnRequest = this.spawnRequests[priority]

        // See if creep can be spawned

        const testSpawnResult = spawn.advancedSpawn(spawnRequest)

        // If creep can't be spawned

        if (testSpawnResult !== OK) {
            // Log the error and stop the loop

            customLog(
                'Failed to spawn',
                `error: ${testSpawnResult}, role: ${spawnRequest.role}, cost: ${spawnRequest.cost}, body: (${spawnRequest.body.length}) ${spawnRequest.body}`,
                myColors.white,
                myColors.red,
            )

            break
        }

        // Disable dry run

        spawnRequest.extraOpts.dryRun = false

        // Spawn the creep

        spawn.advancedSpawn(spawnRequest)

        // Record in stats the costs

        this.energyAvailable -= spawnRequest.cost

        if (global.roomStats.commune[this.name])
            (global.roomStats.commune[this.name] as RoomCommuneStats).eosp += spawnRequest.cost

        // Decrease the spawnIndex

        spawnIndex -= 1
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Spawn Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}
