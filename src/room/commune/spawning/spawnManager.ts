import { myColors, partsByPriority, partsByPriorityPartType } from 'international/constants'
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
        this.test()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Spawn Manager', cpuUsed.toFixed(2), {
                textColor: myColors.white,
                bgColor: myColors.lightBlue,
            })
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

        for (const index in this.communeManager.room.spawnRequests) {
            const request = this.communeManager.room.spawnRequests[index]

            // Try to find inactive spawn, if can't, stop the loop

            const spawn = this.inactiveSpawns[spawnIndex]

            //We want to continue instead of break in this sub-case.  If we're asked to build a creep larger
            // than what we can possibly build, if we break out, we'll get stuck in a loop where the rest of the
            // spawns never run.
            // This should never be activated. If it is, there is a bug in spawn request creation
            if (request.cost > this.communeManager.room.energyCapacityAvailable) {
                customLog(
                    'Failed to spawn',
                    `cost greater then energyCapacityAvailable, role: ${request.role}, cost: ${request.cost}, body: (${request.bodyPartCounts}) ${request.body}`,
                    {
                        textColor: myColors.white,
                        bgColor: myColors.red,
                    },
                )

                continue
            }

            this.configSpawnRequest(parseInt(index))

            // See if creep can be spawned

            const testSpawnResult = spawn.advancedSpawn(request)

            // If creep can't be spawned

            if (testSpawnResult !== OK) {
                // Log the error and stop the loop

                customLog(
                    'Failed to spawn',
                    `error: ${testSpawnResult}, role: ${request.role}, cost: ${request.cost}, body: (${request.body.length}) ${request.body}`,
                    {
                        textColor: myColors.white,
                        bgColor: myColors.red,
                    },
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

    private configSpawnRequest(index: number) {
        const request = this.communeManager.room.spawnRequests[index]

        request.body = []
        const endParts: BodyPartConstant[] = []

        for (const partIndex in partsByPriority) {
            const partType = partsByPriority[partIndex]
            const part = partsByPriorityPartType[partType]

            if (!request.bodyPartCounts[part]) continue

            let skipEndPart: boolean

            let priorityPartsCount: number
            if (partType === RANGED_ATTACK) {
                priorityPartsCount = request.bodyPartCounts[part]
                skipEndPart = true
            } else if (partType === ATTACK || partType === TOUGH) {
                priorityPartsCount = Math.ceil(request.bodyPartCounts[part] / 2)
                skipEndPart = true
            } else if (partType === 'secondaryTough' || partType === 'secondaryAttack') {
                priorityPartsCount = Math.floor(request.bodyPartCounts[part] / 2)
                skipEndPart = true
            } else priorityPartsCount = request.bodyPartCounts[part] - 1

            for (let i = 0; i < priorityPartsCount; i++) {
                request.body.push(part)
            }

            if (skipEndPart) continue

            // Ensure each part besides tough has a place at the end to reduce CPU when creeps perform actions

            endParts.push(part)
        }

        request.body = request.body.concat(endParts)
    }

    createPowerTasks() {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        // There is a vivid benefit to powering spawns

        if (!this.inactiveSpawns.length) return

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
            customLog(
                'SPAWN REQUEST',
                request.role + ', ' + request.priority + ', ' + request.cost + ', ' + request.body,
            )
        }
    }
}
