import { myColors } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog } from 'international/utils'
import { CommuneManager } from '../communeManager'
import './spawnFunctions'
import './spawnRequestManager'

export class SpawnManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public run() {
        const { room } = this.communeManager
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        // Find spawns that are and aren't spawning

        const inactiveSpawns: StructureSpawn[] = []
        const activeSpawns: StructureSpawn[] = []

        for (const spawn of this.communeManager.structures.spawn) {
            if (spawn.spawning) {
                const creep = Game.creeps[spawn.spawning.name]
                creep.spawnID = spawn.id
                activeSpawns.push(spawn)
                continue
            }

            if (spawn.renewed) continue
            if (!spawn.RCLActionable) continue

            inactiveSpawns.push(spawn)
        }

        this.runSpawning(inactiveSpawns)
        this.createPowerTasks(activeSpawns)
        this.test()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Spawn Manager', cpuUsed.toFixed(2), myColors.white, myColors.lightBlue)
            const statName: RoomCommuneStatNames = 'smcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }

    private runSpawning(inactiveSpawns: StructureSpawn[]) {
        if (!inactiveSpawns.length) return

        // Construct spawnRequests

        this.communeManager.room.spawnRequester()

        // Sort spawnRequests by their priority

        const requestsByPriority = Object.keys(this.communeManager.room.spawnRequests).sort((a, b) => {
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
            const spawnRequest = this.communeManager.room.spawnRequests[priority]

            //We want to continue instead of break in this sub-case.  If we're asked to build a creep larger
            // than what we can possibly build, if we break out, we'll get stuck in a loop where the rest of the
            // spawns never run.
            if (spawnRequest.cost > this.communeManager.room.energyCapacityAvailable) {
                customLog(
                    'Failed to spawn',
                    `cost greater then energyCapacityAvailable, role: ${spawnRequest.role}, cost: ${spawnRequest.cost}, body: (${spawnRequest.body.length}) ${spawnRequest.body}`,
                    myColors.white,
                    myColors.red,
                )

                continue
            }

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

                //We don't want one bad spawn request to block all of spawning.
                if (testSpawnResult == ERR_INVALID_ARGS) continue

                break
            }

            // Disable dry run

            spawnRequest.extraOpts.dryRun = false

            // Spawn the creep

            spawn.advancedSpawn(spawnRequest)

            // Record in stats the costs

            this.communeManager.room.energyAvailable -= spawnRequest.cost

            globalStatsUpdater(this.communeManager.room.name, 'eosp', spawnRequest.cost)

            // Decrease the spawnIndex

            spawnIndex -= 1
        }
    }

    private createPowerTasks(activeSpawns: StructureSpawn[]) {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        for (const spawn of activeSpawns) {
            this.communeManager.room.createPowerTask(spawn, PWR_OPERATE_SPAWN, 2)
        }
    }

    /**
     * Spawn request debugging
     */
    private test() {

        return

        if (!Object.keys(this.communeManager.room.spawnRequests).length) this.communeManager.room.spawnRequester()

        const requestsByPriority = Object.keys(this.communeManager.room.spawnRequests).sort((a, b) => {
            return parseInt(a) - parseInt(b)
        })

        for (const priority of requestsByPriority) {
            const request = this.communeManager.room.spawnRequests[priority]

            /* customLog('SPAWN REQUESTS', priority + ', ' + request.role + ', ') */

            if (request.role !== 'remoteSourceHarvester0' && request.role !== 'remoteSourceHarvester1') continue

            customLog('SPAWN REQUEST REMOTE HARVESTER', priority + ', ' + request.extraOpts.memory.RN + ', ' + request.extraOpts.memory.SI)
        }

    }
}
