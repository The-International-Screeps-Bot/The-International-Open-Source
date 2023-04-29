import {
    CreepMemoryKeys,
    customColors,
    offsetsByDirection,
    partsByPriority,
    partsByPriorityPartType,
} from 'international/constants'
import { internationalManager } from 'international/international'
import { updateStat } from 'international/statsManager'
import { customLog, getRange, newID } from 'international/utils'
import { unpackPosAt } from 'other/codec'
import { CommuneManager } from '../commune'
import './spawn'
import './spawnRequests'

export class SpawningStructuresManager {
    communeManager: CommuneManager
    inactiveSpawns: StructureSpawn[]
    activeSpawns: StructureSpawn[]

    spawnRequests: SpawnRequest[]
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
            if (!spawn.RCLActionable) continue

            if (spawn.spawning) {
                const creep = Game.creeps[spawn.spawning.name]
                creep.manageSpawning(spawn)
                creep.spawnID = spawn.id

                if (
                    spawn.spawning.remainingTime <= 2 &&
                    creep.memory[CreepMemoryKeys.path] &&
                    creep.memory[CreepMemoryKeys.path].length
                ) {
                    creep.assignMoveRequest(unpackPosAt(creep.memory[CreepMemoryKeys.path]))
                }

                this.activeSpawns.push(spawn)
                continue
            }

            this.inactiveSpawns.push(spawn)
        }
    }

    public run() {
        const { room } = this.communeManager
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        if (!this.communeManager.room.roomManager.structures.spawn.length) return

        this.runSpawning()
        this.test()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Spawn Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'smcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    private runSpawning() {
        if (!this.inactiveSpawns.length) return

        this.communeManager.spawnRequestsManager.run()

        this.spawnIndex = this.inactiveSpawns.length - 1
        this.spawnRequests = []

        for (const spawnRequestArgs of this.communeManager.room.spawnRequestsArgs) {
            this.constructSpawnRequests(spawnRequestArgs)

            // Loop through priorities inside requestsByPriority

            for (let i = 0; i < this.spawnRequests.length; i++) {
                if (!this.runSpawnRequest(i)) return
            }
        }
    }

    private runSpawnRequest(index: number): false | void {
        const request = this.spawnRequests[index]

        if (request.cost > this.communeManager.nextSpawnEnergyAvailable) {
            customLog(
                'Failed to spawn',
                `cost greater then nextSpawnEnergyAvailable, role: ${request.role}, cost: ${request.cost} / ${
                    this.communeManager.nextSpawnEnergyAvailable
                }, body: ${JSON.stringify(request.bodyPartCounts)}`,
                {
                    textColor: customColors.white,
                    bgColor: customColors.red,
                },
            )
            return false
        }

        // We're trying to build a creep larger than this room can spawn
        // If this is ran then there is a bug in spawnRequest creation

        if (request.cost > this.communeManager.room.energyCapacityAvailable) {
            customLog(
                'Failed to spawn',
                `cost greater then energyCapacityAvailable, role: ${request.role}, cost: ${
                    this.communeManager.room.energyCapacityAvailable
                } / ${request.cost}, body: ${JSON.stringify(request.bodyPartCounts)}`,
                {
                    textColor: customColors.white,
                    bgColor: customColors.red,
                },
            )

            return false
        }

        this.configSpawnRequest(index)

        // Try to find inactive spawn, if can't, stop the loop

        const spawn = this.inactiveSpawns[this.spawnIndex]
        const ID = internationalManager.newCustomCreepID()

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

            return false
        }

        // Spawn the creep for real

        request.extraOpts.directions = this.findDirections(spawn.pos)
        spawn.advancedSpawn(request, ID)

        // Record in stats the costs

        this.communeManager.nextSpawnEnergyAvailable -= request.cost
        updateStat(this.communeManager.room.name, 'eosp', request.cost)

        // Decrease the spawnIndex

        this.spawnIndex -= 1
        if (this.spawnIndex < 0) return false
    }

    private configSpawnRequest(index: number) {
        const request = this.spawnRequests[index]

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

        const anchor = this.communeManager.room.roomManager.anchor
        if (!anchor) throw Error('No anchor for spawning structures ' + this.communeManager.room.name)

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

    private constructSpawnRequests(args: SpawnRequestArgs) {
        // If the args aren't defined, stop

        if (!args) return

        // If minCreeps is defined

        if (args.minCreeps) {
            // Construct spawn requests individually, and stop

            this.spawnRequestIndividually(args)
            return
        }

        // Construct spawn requests by group

        this.spawnRequestByGroup(args)
    }

    private findMaxCostPerCreep(maxCostPerCreep: number) {
        if (!maxCostPerCreep) maxCostPerCreep = this.communeManager.room.energyCapacityAvailable

        // If there are no sourceHarvesters or haulers

        if (
            this.communeManager.room.myCreeps.sourceHarvester.length === 0 ||
            this.communeManager.room.myCreeps.hauler.length === 0
        )
            // Inform the smaller of the following

            return Math.min(maxCostPerCreep, this.communeManager.room.energyAvailable)

        // Otherwise the smaller of the following

        return Math.min(maxCostPerCreep, this.communeManager.room.energyCapacityAvailable)
    }

    private createSpawnRequest(
        priority: number,
        role: CreepRoles,
        defaultParts: number,
        bodyPartCounts: { [key in PartsByPriority]: number },
        tier: number,
        cost: number,
        memory: any,
    ) {
        this.spawnRequests.push({
            role,
            priority,
            defaultParts,
            bodyPartCounts,
            tier,
            cost,
            extraOpts: {
                memory,
            },
        })
    }

    private spawnRequestIndividually(args: SpawnRequestArgs) {
        // Get the maxCostPerCreep

        const maxCostPerCreep = Math.max(this.findMaxCostPerCreep(args.maxCostPerCreep), args.minCost)

        // So long as minCreeps is more than the current number of creeps

        while (
            args.minCreeps >
            (args.spawnGroup ? args.spawnGroup.length : this.communeManager.room.creepsFromRoom[args.role].length)
        ) {
            // Construct important imformation for the spawnRequest

            let bodyPartCounts: { [key in PartsByPriority]: number } = {
                tough: 0,
                claim: 0,
                attack: 0,
                ranged_attack: 0,
                secondaryTough: 0,
                work: 0,
                carry: 0,
                move: 0,
                secondaryAttack: 0,
                heal: 0,
            }

            let tier = 0
            let cost = 0

            let partCost

            // If there are defaultParts

            if (args.defaultParts.length) {
                tier += 1

                // Loop through defaultParts

                for (const part of args.defaultParts) {
                    partCost = BODYPART_COST[part]
                    if (cost + partCost > maxCostPerCreep) break

                    cost += partCost
                    bodyPartCounts[part] += 1
                }
            }

            // If there are extraParts

            if (args.extraParts.length) {
                // Use the partsMultiplier to decide how many extraParts are needed on top of the defaultParts, at a max of 50

                let remainingAllowedParts = Math.min(
                    50 - args.defaultParts.length,
                    args.extraParts.length * args.partsMultiplier,
                )

                // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

                while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
                    const addedParts: BodyPartConstant[] = []

                    // Loop through each part in extraParts

                    for (const part of args.extraParts) {
                        // And add the part's cost to the cost

                        cost += BODYPART_COST[part]

                        // Otherwise add the part the the body

                        addedParts.push(part)

                        // Reduce remainingAllowedParts

                        remainingAllowedParts -= 1
                    }

                    // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts

                    if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                        // Assign partIndex as the length of extraParts

                        let partIndex = args.extraParts.length - 1

                        while (partIndex >= 0) {
                            const part = args.extraParts[partIndex]

                            // Get the cost of the part

                            partCost = BODYPART_COST[part]

                            // If the cost minus partCost is below minCost, stop the loop

                            if (cost - partCost < args.minCost) break

                            // And remove the part's cost to the cost

                            cost -= partCost

                            // Remove the last part in the body

                            addedParts.pop()

                            // Increase remainingAllowedParts

                            remainingAllowedParts += 1

                            // Decrease the partIndex

                            partIndex -= 1
                        }

                        // Increase tier by a percentage (2 decimals) of the extraParts it added

                        tier += Math.floor((addedParts.length / args.extraParts.length) * 100) / 100
                        for (const part of addedParts) bodyPartCounts[part] += 1
                        break
                    }

                    tier += 1
                    for (const part of addedParts) bodyPartCounts[part] += 1
                }
            }

            // Create a spawnRequest using previously constructed information

            this.createSpawnRequest(
                args.priority,
                args.role,
                args.defaultParts.length,
                bodyPartCounts,
                tier,
                cost,
                args.memoryAdditions,
            )

            // Reduce the number of minCreeps

            args.minCreeps -= 1
        }
    }

    private spawnRequestByGroup(args: SpawnRequestArgs) {
        // Get the maxCostPerCreep

        const maxCostPerCreep = Math.max(this.findMaxCostPerCreep(args.maxCostPerCreep), args.minCost)

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = Math.floor(args.extraParts.length * args.partsMultiplier)

        // Construct from totalExtraParts at a max of 50 - number of defaultParts

        const maxPartsPerCreep = Math.min(50 - args.defaultParts.length, totalExtraParts)

        // Loop through creep names of the requested role

        for (const creepName of args.spawnGroup || this.communeManager.room.creepsFromRoom[args.role]) {
            const creep = Game.creeps[creepName]

            // Take away the amount of parts the creep with the name has from totalExtraParts

            totalExtraParts -= creep.body.length - creep.defaultParts
        }

        // If there aren't enough requested parts to justify spawning a creep, stop

        if (totalExtraParts < maxPartsPerCreep * (args.threshold || 0.25)) return

        if (!args.maxCreeps) {
            args.maxCreeps = Number.MAX_SAFE_INTEGER
        }

        // Subtract maxCreeps by the existing number of creeps of this role
        else {
            args.maxCreeps -= args.spawnGroup
                ? args.spawnGroup.length
                : this.communeManager.room.creepsFromRoom[args.role].length
        }

        // So long as there are totalExtraParts left to assign

        //Guard against bad arguments, otherwise it can cause the block below to get into an infinate loop and crash.
        if (args.extraParts.length == 0) {
            customLog('spawnRequestByGroup error', '0 length extraParts?' + JSON.stringify(args), {
                textColor: customColors.white,
                bgColor: customColors.red,
            })
            return
        }

        while (totalExtraParts >= args.extraParts.length && args.maxCreeps > 0) {
            // Construct important imformation for the spawnRequest

            let bodyPartCounts: { [key in PartsByPriority]: number } = {
                tough: 0,
                claim: 0,
                attack: 0,
                ranged_attack: 0,
                secondaryTough: 0,
                work: 0,
                carry: 0,
                move: 0,
                secondaryAttack: 0,
                heal: 0,
            }
            let tier = 0
            let cost = 0

            let partCost

            // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

            let remainingAllowedParts = maxPartsPerCreep

            // If there are defaultParts

            if (args.defaultParts.length) {
                // Increment tier

                tier += 1

                // Loop through defaultParts

                for (const part of args.defaultParts) {
                    partCost = BODYPART_COST[part]
                    if (cost + partCost > maxCostPerCreep) break

                    cost += partCost
                    bodyPartCounts[part] += 1
                }
            }

            // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

            while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
                const addedParts: BodyPartConstant[] = []

                for (const part of args.extraParts) {
                    cost += BODYPART_COST[part]
                    addedParts.push(part)

                    remainingAllowedParts -= 1
                    totalExtraParts -= 1
                }

                // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

                if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                    // Assign partIndex as the length of extraParts

                    let partIndex = args.extraParts.length - 1

                    // So long as partIndex is greater or equal to 0

                    while (partIndex >= 0) {
                        const part = args.extraParts[partIndex]

                        partCost = BODYPART_COST[part]
                        if (cost - partCost < args.minCost) break

                        // And remove the part's cost to the cost

                        cost -= partCost

                        // Remove the last part in the body

                        addedParts.pop()

                        // Increase remainingAllowedParts and totalExtraParts

                        remainingAllowedParts += 1
                        totalExtraParts += 1

                        // Decrease the partIndex

                        partIndex -= 1
                    }

                    // Increase tier by a percentage (2 decimals) of the extraParts it added

                    tier += Math.floor((addedParts.length / args.extraParts.length) * 100) / 100
                    for (const part of addedParts) bodyPartCounts[part] += 1
                    break
                }

                tier += 1
                for (const part of addedParts) {
                    bodyPartCounts[part] += 1
                }
            }

            // Create a spawnRequest using previously constructed information

            this.createSpawnRequest(
                args.priority,
                args.role,
                args.defaultParts.length,
                bodyPartCounts,
                tier,
                cost,
                args.memoryAdditions,
            )

            // Decrease maxCreeps counter

            args.maxCreeps -= 1
        }
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

        this.testArgs()
        this.testRequests()
    }

    private testArgs() {
        for (const request of this.communeManager.room.spawnRequestsArgs) {
            customLog('SPAWN REQUEST ARGS', request.role + ', ' + request.priority)
        }
    }

    private testRequests() {}
}
