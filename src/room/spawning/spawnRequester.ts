import { generalFuncs } from "international/generalFunctions"

/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {

    // If there is no spawn que, make one

    if (!global[room.name].spawnQueue) global[room.name].spawnQueue = {}

    // Construct a record of spawnRequests

    const spawnRequests: {[key: string]: SpawnRequest} = {}

    // Structure info about the room's spawn energy

    const spawnEnergyAvailable = room.energyAvailable,
    spawnEnergyCapacity = room.energyCapacityAvailable

    //

    function createSpawnRequest(priority: number, body: BodyPartConstant[], tier: number, cost: number, memoryAdditions: any) {

        // Construct memory based on memoryAdditions

        const memory = memoryAdditions

        // Set the communeName to this room's name

        memory.communeName = room.name

        // Construct extraOpts

        const extraOpts = {
            memory,
            energyStructures: room.get('structuresForSpawning'),
            dryRun: true,
        }

        // Add the components to spawnRequests

        spawnRequests[priority] = {
            body,
            tier,
            cost,
            extraOpts
        }
    }

    function constructSpawnRequests(opts: SpawnRequestOpts | false): void {

        // If the opts aren't defined, stop

        if (!opts) return

        // If there are no sourceHarvesters or haulers, set the maxCostPerCreep to the spawnEnergyAvailable, otherwise set it to the lowest allowed cost

        const maxCostPerCreep = (room.creepsFromRoom.sourceHarvester.length == 0 || room.creepsFromRoom.hauler.length == 0) ? spawnEnergyAvailable : spawnEnergyCapacity

        // If the maxCostPerCreep is less than the minCost, stop

        if (maxCostPerCreep < opts.minCost) return

        // if minCreeps is defined

        if (opts.minCreeps) {

            // So long as minCreeps is more than the current number of creeps

            while (opts.minCreeps > room.creepsFromRoom[opts.memoryAdditions.role].length) {

                // Construct important imformation for the spawnRequest

                let body: BodyPartConstant[] = [],
                tier = 0,
                cost = 0

                // If there are defaultParts

                if (opts.defaultParts.length > 0) {

                    // Increment tier

                    tier++

                    // Loop through defaultParts

                    for (const part of opts.defaultParts) {

                        // Get the cost of the part

                        const partCost = BODYPART_COST[part]

                        // If the cost of the creep plus the part is more than or equal to the maxCostPerCreep, stop the loop

                        if (cost + partCost > maxCostPerCreep) break

                        // Otherwise add the part the the body

                        body.push(part)

                        // And add the partCost to the cost

                        cost += partCost
                    }
                }

                // If there are extraParts

                if (opts.extraParts.length) {

                    // Use the partsMultiplier to decide how many extraParts are needed on top of the defaultParts, at a max of 50

                    let remainingAllowedParts = Math.min(50 - opts.defaultParts.length, opts.extraParts.length * opts.partsMultiplier - opts.defaultParts.length),

                    // Record the partIndex

                    partIndex = 0

                    // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

                    while (cost < maxCostPerCreep && remainingAllowedParts > 0) {

                        // Get the part using the partIndex

                        const part = opts.extraParts[partIndex],

                        // Get the cost of the part

                        partCost = BODYPART_COST[part]

                        // Otherwise add the part the the body

                        body.push(part)

                        // And add the partCost to the cost

                        cost += partCost

                        // Reduce remainingAllowedParts

                        remainingAllowedParts--

                        // Increase partIndex

                        partIndex++

                        // If the partIndex is equal to the length of extraParts

                        if (partIndex == opts.extraParts.length) {

                            // Set partIndex to 0 and increase tier

                            partIndex = 0
                            tier++
                        }
                    }

                    // So long as the creep's cost is larger than the maxCost or there are more than the remainingAllowedParts

                    if (cost > maxCostPerCreep && remainingAllowedParts < 0) {

                        // So long as the partIndex is more than 0

                        while (partIndex > 0) {

                            // Get the part using the partIndex

                            const part = opts.extraParts[partIndex],

                            // Get the cost of the part

                            partCost = BODYPART_COST[part]

                            // If the cost of the creep minus the part is less than or equal to the minCost, stop the loop

                            if (cost - partCost <= opts.minCost) break

                            // Otherwise remove the last part in the body

                            body.pop()

                            // Remove the partCost from the cost

                            cost -= partCost

                            // Increase remainingAllowedParts

                            remainingAllowedParts++

                            // Reduce partIndex

                            partIndex--
                        }
                    }
                }

                // Create a spawnRequest using previously constructed information

                createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

                // Reduce the number of minCreeps

                opts.minCreeps--
            }

            // If minCreeps is equal to 0, stop

            return
        }

        // Otherwise if minCreeps is undefined

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = opts.extraParts.length * opts.partsMultiplier

        // Loop through creep names of the requested role

        for (const creepName of room.creepsFromRoom[opts.memoryAdditions.role]) {

            // Take away the amount of parts the creep with the name has from totalExtraParts

            totalExtraParts -= (Game.creeps[creepName].body.length - opts.defaultParts.length)
        }

        // So long as there are totalExtraParts left to assign

        while (totalExtraParts > 0) {

            // Construct important imformation for the spawnRequest

            let body: BodyPartConstant[] = [],
            tier = 0,
            cost = 0

            // If there are defaultParts

            if (opts.defaultParts.length > 0) {

                // Increment tier

                tier++

                // Loop through defaultParts

                for (const part of opts.defaultParts) {

                    // Get the cost of the part

                    const partCost = BODYPART_COST[part]

                    // If the cost of the creep plus the part is more than or equal to the maxCostPerCreep, stop the loop

                    if (cost + partCost > maxCostPerCreep) break

                    // Otherwise add the part the the body

                    body.push(part)

                    // And add the partCost to the cost

                    cost += partCost
                }
            }

            // Record the partIndex

            let partIndex = 0

            // So long as the cost is less than the maxCostPerCreep

            while (cost < maxCostPerCreep) {

                // Get the part using the partIndex

                const part = opts.extraParts[partIndex],

                // Get the cost of the part

                partCost = BODYPART_COST[part]

                // Otherwise add the part the the body

                body.push(part)

                // And add the partCost to the cost

                cost += partCost

                // Reduce totalExtraParts

                totalExtraParts--

                // Increase partIndex

                partIndex++

                // If the partIndex is equal to the length of extraParts

                if (partIndex == opts.extraParts.length) {

                    // Set partIndex to 0 and increase tier

                    partIndex = 0
                    tier++
                }
            }

            // So long as the creep's cost is larger than the maxCost or there are more than the totalExtraParts

            if (cost > maxCostPerCreep && totalExtraParts < 0) {

                // So long as the partIndex is more than 0

                while (partIndex > 0) {

                    // Get the part using the partIndex

                    const part = opts.extraParts[partIndex],

                    // Get the cost of the part

                    partCost = BODYPART_COST[part]

                    // If the cost of the creep minus the part is less than or equal to the minCost, stop the loop

                    if (cost - partCost <= opts.minCost) break

                    // Otherwise remove the last part in the body

                    body.pop()

                    // Remove the partCost from the cost

                    cost -= partCost

                    // Increase totalExtraParts

                    totalExtraParts++

                    // Reduce partIndex

                    partIndex--
                }
            }

            // Create a spawnRequest using previously constructed information

            createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)
        }
    }

    // Construct requests for sourceHarvesters

    constructSpawnRequests((function(): SpawnRequestOpts {

        if (spawnEnergyCapacity >= 800) {
            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK, WORK],
                partsMultiplier: 2,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 200,
                priority: room.creepsFromRoom.sourceHarvester.length,
                memoryAdditions: {
                    role: 'sourceHarvester',
                }
            }
        }
        if (spawnEnergyCapacity >= 650) {
            return {
                defaultParts: [MOVE],
                extraParts: [WORK],
                partsMultiplier: 12,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 250,
                priority: room.creepsFromRoom.sourceHarvester.length,
                memoryAdditions: {
                    role: 'sourceHarvester',
                }
            }
        }

        return {
            defaultParts: [MOVE],
            extraParts: [WORK],
            partsMultiplier: 12,
            minCreeps: undefined,
            maxCreeps: Math.max(3, room.get('source1HarvestPositions').length) + Math.max(3, room.get('source2HarvestPositions')),
            minCost: 250,
            priority: room.creepsFromRoom.sourceHarvester.length,
            memoryAdditions: {
                role: 'sourceHarvester',
            }
        }
    })())

    // Construct requests for haulers

    constructSpawnRequests((function(): SpawnRequestOpts {

        return {
            defaultParts: [],
            extraParts: [CARRY, MOVE],
            partsMultiplier: 10,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 100,
            priority: 0.5 + room.creepsFromRoom.hauler.length,
            memoryAdditions: {
                role: 'hauler',
            }
        }
    })())

    // Construct requests for upgraders

    constructSpawnRequests((function(): SpawnRequestOpts {

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier: 4,
            minCreeps: undefined,
            maxCreeps: 2,
            minCost: 250,
            priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
            memoryAdditions: {
                role: 'controllerUpgrader',
            }
        }
    })())

    // Construct requests for builders

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Stop if there are no construction sites

        if (room.find(FIND_MY_CONSTRUCTION_SITES).length == 0) return false

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier: 4,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 250,
            priority: 3.5 + room.creepsFromRoom.builder.length,
            memoryAdditions: {
                role: 'builder',
            }
        }
    })())

    // Construct requests for mainainers

    constructSpawnRequests((function(): SpawnRequestOpts {

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier: 4,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 250,
            priority: 3.5 + room.creepsFromRoom.maintainer.length,
            memoryAdditions: {
                role: 'maintainer',
            }
        }
    })())

    // Construct requests for scouts

    constructSpawnRequests((function(): SpawnRequestOpts {

        return {
            defaultParts: [MOVE],
            extraParts: [],
            partsMultiplier: 2,
            minCreeps: 0,
            maxCreeps: Infinity,
            minCost: 50,
            priority: 2,
            memoryAdditions: {
                role: 'scout',
            }
        }
    })())

    // Inform spawnRequests

    return spawnRequests
}
