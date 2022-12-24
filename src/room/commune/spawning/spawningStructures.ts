import { customColors, offsetsByDirection, partsByPriority, partsByPriorityPartType } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog, getRangeOfCoords, newID } from 'international/utils'
import { CommuneManager } from '../commune'
import './spawnFunctions'
import './spawnRequestManager'

export class SpawningStructuresManager {
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
                creep.manageSpawning(spawn)
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
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
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
            if (request.cost > this.communeManager.nextSpawnEnergyAvailable) break

            // We're trying to build a creep larger than this room can spawn
            // If this is ran then there is a bug in spawnRequest creation

            if (request.cost > this.communeManager.room.energyCapacityAvailable) {
                customLog(
                    'Failed to spawn',
                    `cost greater then energyCapacityAvailable, role: ${request.role}, cost: ${request.cost}, body: (${request.bodyPartCounts}) ${request.body}`,
                    {
                        textColor: customColors.white,
                        bgColor: customColors.red,
                    },
                )

                continue
            }

            this.configSpawnRequest(parseInt(index))

            // Try to find inactive spawn, if can't, stop the loop

            const spawn = this.inactiveSpawns[spawnIndex]
            const ID = newID()

            // See if creep can be spawned

            const testSpawnResult = spawn.testSpawn(request, ID)

            // If creep can't be spawned

            if (testSpawnResult !== OK) {
                // Log the error and stop the loop

                customLog(
                    'Failed to spawn',
                    `error: ${testSpawnResult}, role: ${request.role}, cost: ${request.cost}, body: (${request.body.length}) ${request.body}`,
                    {
                        textColor: customColors.white,
                        bgColor: customColors.red,
                    },
                )
                /*
                //We don't want one bad spawn request to block all of spawning.
                if (testSpawnResult == ERR_INVALID_ARGS) continue
 */
                return
            }

            // Spawn the creep for real

            request.extraOpts.directions = this.findDirections(spawn.pos)
            spawn.advancedSpawn(request, ID)

            // Record in stats the costs

            this.communeManager.nextSpawnEnergyAvailable -= request.cost
            globalStatsUpdater(this.communeManager.room.name, 'eosp', request.cost)

            // Decrease the spawnIndex

            spawnIndex -= 1
            if (spawnIndex < 0) return
        }
    }

    private configSpawnRequest(index: number) {
        const request = this.communeManager.room.spawnRequests[index]

        request.body = []

        if (request.role === 'hauler' || request.role === 'remoteHauler') {
            const ratio = (request.bodyPartCounts[CARRY] + request.bodyPartCounts[WORK]) / request.bodyPartCounts[MOVE]

            for (let i = -1; i < request.bodyPartCounts[CARRY] - 1; i++) {
                request.body.push(CARRY)
                if (i % ratio === 0) request.body.push(MOVE)
            }

            for (let i = -1; i < request.bodyPartCounts[WORK] - 1; i++) {
                request.body.push(WORK)
                if (i % ratio === 0) request.body.push(MOVE)
            }

            return
        }

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

    private findDirections(pos: RoomPosition) {
        const adjacentCoords: Coord[] = []

        for (let x = pos.x - 1; x <= pos.x + 1; x += 1) {
            for (let y = pos.y - 1; y <= pos.y + 1; y += 1) {
                if (pos.x === x && pos.y === y) continue

                const coord = { x, y }

                /* if (room.coordHasStructureTypes(coord, impassibleStructureTypesSet)) continue */

                // Otherwise ass the x and y to positions

                adjacentCoords.push(coord)
            }
        }

        const anchor = this.communeManager.room.anchor

        // Sort by distance from the first pos in the path

        adjacentCoords.sort((a, b) => {
            return getRangeOfCoords(a, anchor) - getRangeOfCoords(b, anchor)
        })
        adjacentCoords.reverse()

        const directions: DirectionConstant[] = []

        for (const coord of adjacentCoords) {
            directions.push(pos.getDirectionTo(coord.x, coord.y))
        }

        return directions
    }

    createPowerTasks() {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        // There is a vivid benefit to powering spawns

        if (this.inactiveSpawns.length) return

        for (const spawn of this.activeSpawns) {
            this.communeManager.room.createPowerTask(spawn, PWR_OPERATE_SPAWN, 2)
        }
    }

    createRoomLogisticsRequests() {
        for (const structure of this.communeManager.room.spawningStructuresByNeed) {

            this.communeManager.room.createRoomLogisticsRequest({
                target: structure,
                type: 'transfer',
                priority: 3,
            })
        }
    }

    /**
     * Spawn request debugging
     */
    private test() {
        return

        if (!this.communeManager.room.spawnRequests.length) this.communeManager.room.spawnRequester()

        for (const request of this.communeManager.room.spawnRequests) {
            customLog(
                'SPAWN REQUEST',
                request.role + ', ' + request.priority + ', ' + request.cost + ', ' + request.bodyPartCounts,
            )
        }
    }
}
