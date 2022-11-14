import { myColors } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog } from 'international/utils'
import { CommuneManager } from '../communeManager'
import './spawnFunctions'
import './spawnRequestManager'

export class SpawnManager {
    communeManager: CommuneManager
    inactiveSpawns: StructureSpawn[]
    activeSpawns: StructureSpawn[]

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    /**
     * Find spawns that are inactive and active
     * Assign spawnIDs to creeps
     */
    public organizeSpawns() {

        const spawns = this.communeManager.structures.spawn
        if (!spawns.length) return

        // Find spawns that are and aren't spawning

        this.inactiveSpawns = []
        this.activeSpawns = []

        for (const spawn of spawns) {
            if (spawn.spawning) {
                const creep = Game.creeps[spawn.spawning.name]
                creep.spawnID = spawn.id

                this.activeSpawns.push(spawn)
                continue
            }

            if (spawn.renewed) continue
            if (!spawn.RCLActionable) continue

            this.inactiveSpawns.push(spawn)
        }
    }

    public run() {
        const { room } = this.communeManager
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        if (!this.communeManager.structures.spawn.length) return

        this.runSpawning()
        this.createPowerTasks()
        this.test()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Spawn Manager', cpuUsed.toFixed(2), myColors.white, myColors.lightBlue)
            const statName: RoomCommuneStatNames = 'smcu'
            globalStatsUpdater(room.name, statName, cpuUsed)
        }
    }

    private runSpawning() {
        if (!this.inactiveSpawns.length) return

        // Construct spawnRequests

        this.communeManager.room.spawnRequester()

        // Track the inactive spawn index

        let spawnIndex = this.inactiveSpawns.length - 1

        // Loop through priorities inside requestsByPriority

        for (const request of this.communeManager.room.spawnRequests) {

            // Try to find inactive spawn, if can't, stop the loop

            const spawn = this.inactiveSpawns[spawnIndex]

            //We want to continue instead of break in this sub-case.  If we're asked to build a creep larger
            // than what we can possibly build, if we break out, we'll get stuck in a loop where the rest of the
            // spawns never run.
            if (request.cost > this.communeManager.room.energyCapacityAvailable) {
                customLog(
                    'Failed to spawn',
                    `cost greater then energyCapacityAvailable, role: ${request.role}, cost: ${request.cost}, body: (${request.body.length}) ${request.body}`,
                    myColors.white,
                    myColors.red,
                )

                continue
            }

            // See if creep can be spawned
            const testSpawnResult = spawn.advancedSpawn(request)

            // If creep can't be spawned

            if (testSpawnResult !== OK) {
                // Log the error and stop the loop

                customLog(
                    'Failed to spawn',
                    `error: ${testSpawnResult}, role: ${request.role}, cost: ${request.cost}, body: (${request.body.length}) ${request.body}`,
                    myColors.white,
                    myColors.red,
                )
/*
                //We don't want one bad spawn request to block all of spawning.
                if (testSpawnResult == ERR_INVALID_ARGS) continue
 */
                return
            }

            // Disable dry run

            request.extraOpts.dryRun = false

            // Spawn the creep

            spawn.advancedSpawn(request)
/*
            // Record in stats the costs

            this.communeManager.room.energyAvailable -= spawnRequest.cost
 */
            globalStatsUpdater(this.communeManager.room.name, 'eosp', request.cost)

            // Decrease the spawnIndex

            spawnIndex -= 1
            if (spawnIndex < 0) return
        }
    }

    private createPowerTasks() {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        for (const spawn of this.activeSpawns) {
            this.communeManager.room.createPowerTask(spawn, PWR_OPERATE_SPAWN, 2)
        }
    }

    /**
     * Spawn request debugging
     */
    private test() {

        return

        if (!Object.keys(this.communeManager.room.spawnRequests).length) this.communeManager.room.spawnRequester()

        for (const request of this.communeManager.room.spawnRequests) {

            /* customLog('SPAWN REQUESTS', priority + ', ' + request.role + ', ') */

            if (request.role !== 'remoteSourceHarvester0' && request.role !== 'remoteSourceHarvester1') continue

            customLog('SPAWN REQUEST REMOTE HARVESTER', request.priority + ', ' + request.extraOpts.memory.RN + ', ' + request.extraOpts.memory.SI)
        }

    }
}
