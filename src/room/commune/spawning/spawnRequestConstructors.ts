import { SpawnRequest } from 'types/spawnRequest'
import { LogTypes, customLog } from 'utils/logging'
import { SpawnRequestArgs } from 'types/spawnRequest'

export type SpawnRequestConstructor = (room: Room, args: SpawnRequestArgs) => SpawnRequest[]

export const spawnRequestConstructors = {
    createSpawnRequest(
        priority: number,
        role: CreepRoles,
        defaultParts: number,
        bodyPartCounts: { [key in PartsByPriority]: number },
        tier: number,
        cost: number,
        memory: any,
    ): SpawnRequest {
        return {
            role,
            priority,
            defaultParts,
            bodyPartCounts,
            tier,
            cost,
            extraOpts: {
                memory,
            },
        }
    },
    /**
     * Generally, all creeps will have the same bodies
     */
    spawnRequestIndividualUniform(room: Room, args: SpawnRequestArgs) {
        const spawnRequests: SpawnRequest[] = []

        const maxCostPerCreep = Math.max(
            args.maxCostPerCreep ?? room.energyCapacityAvailable,
            args.minCostPerCreep,
        )

        // So long as minCreeps is more than the current number of creeps

        while (
            args.creepsQuota >
            (args.spawnGroup ? args.spawnGroup.length : room.creepsFromRoom[args.role].length)
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

                            if (cost - partCost < args.minCostPerCreep) break

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

            const request = spawnRequestConstructors.createSpawnRequest(
                args.priority,
                args.role,
                args.defaultParts.length,
                bodyPartCounts,
                tier,
                cost,
                args.memoryAdditions,
            )
            spawnRequests.push(request)

            args.creepsQuota -= 1
        }

        return spawnRequests
    },
    spawnRequestGroupDiverse(room: Room, args: SpawnRequestArgs) {

        const spawnRequests: SpawnRequest[] = []

        // Guard against bad arguments, otherwise it can cause the block below to get into an infinate loop and crash.
        if (args.extraParts.length == 0) {
            customLog('spawnRequestByGroup', '0 length extraParts?' + JSON.stringify(args), {
                type: LogTypes.error,
            })
            return spawnRequests
        }

        const maxCostPerCreep = Math.max(
            args.maxCostPerCreep ?? room.energyCapacityAvailable,
            args.minCostPerCreep,
        )

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = Math.floor(args.extraParts.length * args.partsMultiplier)

        // Construct from totalExtraParts at a max of 50 - number of defaultParts

        const maxPartsPerCreep = Math.min(50 - args.defaultParts.length, totalExtraParts)

        // Loop through creep names of the requested role

        for (const creepName of args.spawnGroup || room.creepsFromRoom[args.role]) {
            const creep = Game.creeps[creepName]

            // Take away the amount of parts the creep with the name has from totalExtraParts

            totalExtraParts -= creep.body.length - creep.defaultParts
        }

        // If there aren't enough requested parts to justify spawning a creep, stop

        if (totalExtraParts < maxPartsPerCreep * (args.threshold ?? 0.25)) return spawnRequests

        if (args.maxCreeps === undefined) {
            args.maxCreeps = Number.MAX_SAFE_INTEGER
        }
        // Subtract maxCreeps by the existing number of creeps of this role
        else {
            args.maxCreeps -= args.spawnGroup
                ? args.spawnGroup.length
                : room.creepsFromRoom[args.role].length
        }

        // So long as there are totalExtraParts left to assign

        while (totalExtraParts > args.extraParts.length && args.maxCreeps > 0) {
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

            // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

            let remainingAllowedParts = maxPartsPerCreep

            // If there are defaultParts

            if (args.defaultParts.length) {
                // Increment tier

                tier += 1

                // Loop through defaultParts

                for (const part of args.defaultParts) {
                    const partCost = BODYPART_COST[part]
                    if (cost + partCost > maxCostPerCreep) break

                    cost += partCost
                    bodyPartCounts[part] += 1
                }
            }

            // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

            while (cost < maxCostPerCreep && remainingAllowedParts - args.extraParts.length >= 0) {
                const addedParts: BodyPartConstant[] = []

                for (const part of args.extraParts) {
                    cost += BODYPART_COST[part]
                    addedParts.push(part)
                }

                remainingAllowedParts -= args.extraParts.length
                totalExtraParts -= args.extraParts.length

                // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

                if (cost > maxCostPerCreep) {
                    // Assign partIndex as the length of extraParts

                    let partIndex = args.extraParts.length - 1

                    // So long as partIndex is greater or equal to 0

                    while (partIndex >= 0) {
                        const part = args.extraParts[partIndex]

                        const partCost = BODYPART_COST[part]
                        // if it's not expensive enough and we have enough parts
                        if (cost - partCost < args.minCostPerCreep) break

                        // And remove the part's cost to the cost
                        cost -= partCost

                        // Remove the last part in the body
                        addedParts.pop()

                        // Increase remainingAllowedParts and totalExtraParts

                        remainingAllowedParts += 1
                        totalExtraParts += 1

                        // Setup to handle the next part
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

            const request = spawnRequestConstructors.createSpawnRequest(
                args.priority,
                args.role,
                args.defaultParts.length,
                bodyPartCounts,
                tier,
                cost,
                args.memoryAdditions,
            )
            spawnRequests.push(request)

            args.maxCreeps -= 1
        }

        return spawnRequests
    },
    spawnRequestGroupUniform(room: Room, args: SpawnRequestArgs) {
        const spawnRequests: SpawnRequest[] = []

        // Guard against bad arguments, otherwise it can cause the block below to get into an infinate loop and crash.
        if (args.extraParts.length == 0) {
            throw Error('extraParts of length 0 for ' + room.name + ' and role ' + args.role)
        }

        const maxCostPerCreep = Math.max(
            args.maxCostPerCreep ?? room.energyCapacityAvailable,
            args.minCostPerCreep,
        )
        if (maxCostPerCreep < args.minCostPerCreep) {

            customLog('maxCostPerCreep is less than minCostPerCreep, unable to continue spawn request for role: ' + args.role)
            return spawnRequests
        }

        if (args.maxCreeps === undefined) {
            args.maxCreeps = Number.MAX_SAFE_INTEGER
        }

        // Run if we haven't yet fulfilled the parts quota and can still add more creeps
        while (args.partsQuota > 0 && args.maxCreeps > 0) {
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
            let partsCount = 0
            let tier = 0
            let cost = 0

            // Apply default parts if there are any

            if (args.defaultParts.length) {

                tier += 1

                for (const part of args.defaultParts) {
                    const partCost = BODYPART_COST[part]
                    if (cost + partCost > maxCostPerCreep) break

                    cost += partCost
                    bodyPartCounts[part] += 1
                    partsCount += 1
                }
            }

            let stop = false

            // So long as the cost is less than the maxCostPerCreep and the size is below max size

            while (cost < maxCostPerCreep && partsCount + args.extraParts.length <= MAX_CREEP_SIZE) {

                tier += 1

                for (const part of args.extraParts) {

                    const partCost = BODYPART_COST[part]
                    // If the new cost will make us too expensive and we already fulfill the min cost, stop
                    if (cost + partCost > maxCostPerCreep /* && cost >= args.minCostPerCreep */) {
                        stop = true
                        break
                    }

                    cost += BODYPART_COST[part]
                    bodyPartCounts[part] += 1
                    partsCount += 1
                }

                if (stop) break
            }

            // Create a spawnRequest using previously constructed information

            const request = spawnRequestConstructors.createSpawnRequest(
                args.priority,
                args.role,
                args.defaultParts.length,
                bodyPartCounts,
                tier,
                cost,
                args.memoryAdditions,
            )
            spawnRequests.push(request)

            // Prepare values for next iteration check
            args.partsQuota -= partsCount
            args.maxCreeps -= 1
        }

        return spawnRequests
    },
}
