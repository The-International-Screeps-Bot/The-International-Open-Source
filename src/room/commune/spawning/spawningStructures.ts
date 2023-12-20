import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    RoomLogisticsRequestTypes,
    customColors,
    offsetsByDirection,
    partsByPriority,
    partsByPriorityPartType,
} from 'international/constants'
import { collectiveManager } from 'international/collective'
import { statsManager } from 'international/statsManager'
import { LogTypes, customLog, stringifyLog } from 'utils/logging'
import { findAdjacentCoordsToCoord, getRange, newID, utils } from 'utils/utils'
import { packCoord, unpackPosAt } from 'other/codec'
import { CommuneManager } from '../commune'
import './spawnUtils'
import './spawnRequests'
import { spawnUtils } from './spawnUtils'
import { Dashboard, Rectangle, Table } from 'screeps-viz'
import { debugUtils } from 'debug/debugUtils'
import { SpawnRequest, SpawnRequestArgs, SpawnRequestTypes } from 'types/spawnRequest'
import { SpawnRequestConstructor, spawnRequestConstructors } from './spawnRequestConstructors'

export const spawnRequestConstructorsByType: {[key in SpawnRequestTypes]: SpawnRequestConstructor } = {
    [SpawnRequestTypes.individualUniform]: spawnRequestConstructors.spawnRequestIndividualUniform,
    [SpawnRequestTypes.groupDiverse]: spawnRequestConstructors.spawnRequestGroupDiverse,
    [SpawnRequestTypes.groupUniform]: spawnRequestConstructors.spawnRequestGroupUniform,
}

export class SpawningStructuresManager {
    communeManager: CommuneManager
    inactiveSpawns: StructureSpawn[]
    activeSpawns: StructureSpawn[]

    spawnIndex: number

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    /**
     * Find spawns that are inactive and active
     * Assign spawnIDs to creeps
     */
    public organizeSpawns() {
        const spawns = this.communeManager.room.roomManager.structures.spawn
        if (!spawns.length) return

        // Find spawns that are and aren't spawning

        this.inactiveSpawns = []
        this.activeSpawns = []

        for (const spawn of spawns) {
            if (spawn.renewed) continue
            if (!spawn.isRCLActionable) continue

            if (spawn.spawning) {
                const creep = Game.creeps[spawn.spawning.name]
                creep.manageSpawning(spawn)
                creep.spawnID = spawn.id

                if (
                    spawn.spawning.remainingTime <= 2 &&
                    creep.memory[CreepMemoryKeys.path] &&
                    creep.memory[CreepMemoryKeys.path].length
                ) {
                    const coord = unpackPosAt(creep.memory[CreepMemoryKeys.path])
                    this.communeManager.room.roomManager.reservedCoords.set(
                        packCoord(coord),
                        ReservedCoordTypes.spawning,
                    )
                    creep.assignMoveRequest(coord)
                }

                this.activeSpawns.push(spawn)
                continue
            }

            this.inactiveSpawns.push(spawn)
        }
    }

    public run() {
        // There are no spawns
        if (!this.communeManager.room.roomManager.structures.spawn.length) return

        this.visualizeRequests()
        this.test()
        this.runSpawning()
    }

    private runSpawning() {
        // There are no spawns that we can spawn with (they are probably spawning something)
        if (!this.inactiveSpawns.length) {
            return
        }

        const spawnRequestsArgs = this.communeManager.spawnRequestsManager.run()

        this.spawnIndex = this.inactiveSpawns.length - 1

        for (const requestArgs of spawnRequestsArgs) {
            const spawnRequests = spawnRequestConstructorsByType[requestArgs.type](this.communeManager.room, requestArgs)

            // Loop through priorities inside requestsByPriority

            for (const spawnRequest of spawnRequests) {
                if (this.runSpawnRequest(spawnRequest) !== Result.success) return
            }
        }
    }

    private runSpawnRequest(request: SpawnRequest): Result {
        // We're trying to build a creep larger than this room can spawn
        // If this is ran then there is a bug in spawnRequest creation

        if (request.cost > this.communeManager.room.energyCapacityAvailable) {
            customLog(
                'Failed to spawn: not enough energy',
                `cost greater then energyCapacityAvailable, role: ${request.role}, cost: ${
                    this.communeManager.room.energyCapacityAvailable
                } / ${request.cost}, body: ${JSON.stringify(request.bodyPartCounts)}`,
                {
                    type: LogTypes.warning,
                },
            )

            return Result.fail
        }

        if (request.cost > this.communeManager.nextSpawnEnergyAvailable) {
            customLog(
                'Failed to spawn: not enough energy',
                `cost greater then nextSpawnEnergyAvailable, role: ${request.role}, cost: ${
                    request.cost
                } / ${this.communeManager.nextSpawnEnergyAvailable}, body: ${JSON.stringify(
                    request.bodyPartCounts,
                )}`,
                {
                    type: LogTypes.warning,
                },
            )
            return Result.fail
        }

        this.configSpawnRequest(request)

        // Try to find inactive spawn, if can't, stop the loop

        const spawn = this.inactiveSpawns[this.spawnIndex]
        const ID = collectiveManager.newCustomCreepID()

        // See if creep can be spawned

        const testSpawnResult = spawnUtils.testSpawn(spawn, request, ID)

        // If creep can't be spawned

        if (testSpawnResult !== OK) {
            if (testSpawnResult === ERR_NOT_ENOUGH_ENERGY) {
                customLog(
                    'Failed to spawn: dryrun failed',
                    `request: ${testSpawnResult}, role: ${request.role}, cost: ${request.cost} / ${this.communeManager.nextSpawnEnergyAvailable}, body: (${request.body.length}) ${request.body}`,
                    {
                        type: LogTypes.error,
                    },
                )
                return Result.fail
            }

            customLog(
                'Failed to spawn: dryrun failed',
                `request: ${testSpawnResult}, role: ${request.role}, cost: ${request.cost} / ${this.communeManager.nextSpawnEnergyAvailable}, body: (${request.body.length}) ${request.body}`,
                {
                    type: LogTypes.error,
                },
            )

            return Result.fail
        }

        // Spawn the creep for real

        request.extraOpts.directions = this.findDirections(spawn.pos)
        const result = spawnUtils.advancedSpawn(spawn, request, ID)
        if (result !== OK) {
            customLog(
                'Failed to spawn: spawning failed',
                `error: ${result}, request: ${debugUtils.stringify(request)}`,
                {
                    type: LogTypes.error,
                    position: 3,
                },
            )

            return Result.fail
        }

        // Record in stats the costs

        this.communeManager.nextSpawnEnergyAvailable -= request.cost
        statsManager.updateStat(this.communeManager.room.name, 'eosp', request.cost)

        // Record spawn usage and check if there is another spawn
        this.spawnIndex -= 1
        if (this.spawnIndex < 0) return Result.stop

        // Otherwise we succeeded
        return Result.success
    }

    private configSpawnRequest(request: SpawnRequest) {
        request.body = []

        if (request.role === 'hauler') {
            const ratio =
                (request.bodyPartCounts[CARRY] + request.bodyPartCounts[WORK]) /
                request.bodyPartCounts[MOVE]

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
        const anchor = this.communeManager.room.roomManager.anchor
        if (!anchor)
            throw Error('No anchor for spawning structures ' + this.communeManager.room.name)

        const adjacentCoords = findAdjacentCoordsToCoord(pos)

        // Sort by distance from the first pos in the path

        adjacentCoords.sort((a, b) => {
            return getRange(a, anchor) - getRange(b, anchor)
        })
        adjacentCoords.reverse()

        const directions: DirectionConstant[] = []

        for (const coord of adjacentCoords) {
            directions.push(pos.getDirectionTo(coord.x, coord.y))
        }

        return directions
    }

    createPowerTasks() {
        if (!this.communeManager.room.myPowerCreeps.length) return

        // There is a vivid benefit to powering spawns

        if (this.inactiveSpawns.length) return

        for (const spawn of this.activeSpawns) {
            this.communeManager.room.createPowerTask(spawn, PWR_OPERATE_SPAWN, 2)
        }
    }

    createRoomLogisticsRequests() {
        for (const structure of this.communeManager.spawningStructuresByNeed) {
            this.communeManager.room.createRoomLogisticsRequest({
                target: structure,
                type: RoomLogisticsRequestTypes.transfer,
                priority: 3,
            })
        }
    }

    /**
     * Spawn request debugging
     */
    private test() {
        /*
        const args = this.communeManager.spawnRequestsManager.run()
        stringifyLog('spawn request args', args)
        stringifyLog('request', spawnRequestConstructorsByType[requestArgs.type](this.communeManager.room, args[0]))
 */
        return

        this.testArgs()
        this.testRequests()
    }

    private testArgs() {
        const spawnRequestsArgs = this.communeManager.spawnRequestsManager.run()

        for (const request of spawnRequestsArgs) {
            if (request.role === 'remoteSourceHarvester') {
                customLog(
                    'SPAWN REQUEST ARGS',
                    request.role +
                        request.memoryAdditions[CreepMemoryKeys.remote] +
                        ', ' +
                        request.priority,
                )
                continue
            }
            customLog('SPAWN REQUEST ARGS', request.role + ', ' + request.priority)
        }
    }

    private testRequests() {}

    /**
     * Debug
     */
    private visualizeRequests() {
        if (!Game.flags.spawnRequestVisuals) return

        const headers = ['role', 'priority', 'cost', 'parts']
        const data: any[][] = []

        const spawnRequestsArgs = this.communeManager.spawnRequestsManager.run()

        for (const requestArgs of spawnRequestsArgs) {
            const spawnRequests = spawnRequestConstructorsByType[requestArgs.type](this.communeManager.room, requestArgs)

            for (const request of spawnRequests) {
                const row: any[] = []
                row.push(requestArgs.role)
                row.push(requestArgs.priority)
                row.push(`${request.cost} / ${this.communeManager.nextSpawnEnergyAvailable}`)
                row.push(request.body)

                data.push(row)
            }
        }

        const height = 3 + data.length

        Dashboard({
            config: {
                room: this.communeManager.room.name,
            },
            widgets: [
                {
                    pos: {
                        x: 1,
                        y: 1,
                    },
                    width: 47,
                    height,
                    widget: Rectangle({
                        data: Table(() => ({
                            data,
                            config: {
                                label: 'Spawn Requests',
                                headers,
                            },
                        })),
                    }),
                },
            ],
        })
    }
}
