import { myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'
import './spawnFunctions'
import { spawnRequester } from './spawnRequestManager'

export function spawnManager(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     // Find spawns that aren't spawning

     const inactiveSpawns = room.structures.spawn.filter(spawn => !spawn.spawning)
     if (!inactiveSpawns.length) return

     // Construct spawnRequests

     spawnRequester(room)

     // Sort spawnRequests by their priority

     const requestsByPriority = Object.keys(room.spawnRequests).sort(function (a, b) {
          return parseInt(a) - parseInt(b)
     })

     // Track the inactive spawn index

     let spawnIndex = inactiveSpawns.length - 1

     // Loop through priorities inside requestsByPriority

     for (const priority of requestsByPriority) {
          // Stop if the spawnIndex is negative

          if (spawnIndex < 0) break

          // Try to find inactive spawn, if can't, stop the loop

          const spawn = inactiveSpawns[spawnIndex]

          // Otherwise get the spawnRequest using its priority

          const spawnRequest = room.spawnRequests[priority]

          // See if creep can be spawned

          const testSpawnResult = spawn.advancedSpawn(spawnRequest)

          // If creep can't be spawned

          if (testSpawnResult !== OK) {
               // Log the error and stop the loop

               customLog(
                    'Failed to spawn',
                    `error: ${testSpawnResult}, role: ${spawnRequest.extraOpts.memory.role}, cost: ${spawnRequest.cost}, body: (${spawnRequest.body.length}) ${spawnRequest.body}`,
                    myColors.white,
                    myColors.red
               )

               break
          }

          // Disable dry run

          spawnRequest.extraOpts.dryRun = false

          // Spawn the creep

          spawn.advancedSpawn(spawnRequest)

          // Record in stats the costs

          room.energyAvailable -= spawnRequest.cost

          if (global.roomStats[room.name]) global.roomStats[room.name].eosp += spawnRequest.cost

          // Decrease the spawnIndex

          spawnIndex -= 1
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Spawn Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               myColors.lightGrey,
          )
}
