import { generalFuncs } from "international/generalFunctions"

/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {

    // If there is no spawn que, make one

    if (!global[room.name].spawnQueue) global[room.name].spawnQueue = {}

    // Construct a record of spawnRequests

    const spawnRequests: {[key: string]: SpawnRequest} = {},

    // Structure info about the room's spawn energy

    spawnEnergyAvailable = room.energyAvailable,
    spawnEnergyCapacity = room.energyCapacityAvailable

    // Create a spawn request given some values

    function createSpawnRequest(priority: number, body: BodyPartConstant[], tier: number, cost: number, memory: any) {

        // Set the memories communeName to this room's name

        memory.communeName = room.name

        // Create extraOpts

        const extraOpts: ExtraOpts = {
            memory,
            energyStructures: room.get('structuresForSpawning'),
            dryRun: true,
        }

        // Add the components to spawnRequests

        spawnRequests[priority] = {
            body,
            tier,
            cost,
            extraOpts,
        }
    }

    // Create spawn requests using opts

    function constructSpawnRequests(opts: SpawnRequestOpts | false) {

        // If the opts aren't defined, stop

        if (!opts) return

        // If there are no sourceHarvesters or haulers, set the maxCostPerCreep to the spawnEnergyAvailable, otherwise set it to the lowest allowed cost

        const maxCostPerCreep = (room.creepsFromRoom.sourceHarvester.length == 0 || room.creepsFromRoom.hauler.length == 0) ? spawnEnergyAvailable : spawnEnergyCapacity

        // If the maxCostPerCreep is less than the minCost, stop

        if (maxCostPerCreep < opts.minCost) return

        // If minCreeps is defined

        if (opts.minCreeps) {

            // Construct spawn requests individually, and stop

            constructSpawnRequestsIndividually(opts, maxCostPerCreep)
            return
        }

        // Construct spawn requests by group, and stop

        constructSpawnRequestsByGroup(opts, maxCostPerCreep)
    }

    // Use preset creep amounts to construct spawn requests

    function constructSpawnRequestsIndividually(opts: SpawnRequestOpts, maxCostPerCreep: number) {

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

                let remainingAllowedParts = Math.min(50 - opts.defaultParts.length, opts.extraParts.length * opts.partsMultiplier)

                // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

                while (cost < maxCostPerCreep && remainingAllowedParts > 0) {

                    // Loop through each part in extraParts

                    for (const part of opts.extraParts) {

                        // And add the part's cost to the cost

                        cost += BODYPART_COST[part]

                        // Otherwise add the part the the body

                        body.push(part)

                        // Reduce remainingAllowedParts

                        remainingAllowedParts--
                    }

                    // Increase tier

                    tier++
                }

                // Assign partIndex as the length of extraParts

                let partIndex = opts.extraParts.length

                // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts

                if (cost > maxCostPerCreep || remainingAllowedParts < 0) {

                    // So long as partIndex is above 0

                    while (partIndex > 0) {

                        // Get the part using the partIndex

                        const part = opts.extraParts[partIndex]

                        // Get the cost of the part

                        const partCost = BODYPART_COST[part]

                        // If the cost minus partCost is below minCost, stop the loop

                        if (cost - partCost < opts.minCost) break

                        // And remove the part's cost to the cost

                        cost -= partCost

                        // Remove the last part in the body

                        body.pop()

                        // Increase remainingAllowedParts

                        remainingAllowedParts++

                        // Decrease the partIndex

                        partIndex--
                    }
                }
            }

            // If the body has fewer parts than defaultParts amount + extraParts amount

            if (body.length < opts.defaultParts.length + opts.extraParts.length) break

            // Create a spawnRequest using previously constructed information

            createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

            // Reduce the number of minCreeps

            opts.minCreeps--
        }

        // If minCreeps is equal to 0, stop

        return
    }

    // Construct spawn requests while deciding on creep amounts

    function constructSpawnRequestsByGroup(opts: SpawnRequestOpts, maxCostPerCreep: number) {

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = opts.extraParts.length * opts.partsMultiplier,
        maxPartsPerCreep = Math.min(50, totalExtraParts)

        // Loop through creep names of the requested role

        for (const creepName of room.creepsFromRoom[opts.memoryAdditions.role]) {

            // Take away the amount of parts the creep with the name has from totalExtraParts

            totalExtraParts -= Game.creeps[creepName].body.length - opts.defaultParts.length
        }

        // If there arn't enough requested parts to justify spawning a creep, stop

        if (totalExtraParts < maxPartsPerCreep / 2) return

        // So long as there are totalExtraParts left to assign

        while (totalExtraParts > 0 && opts.maxCreeps > 0) {

            // Construct important imformation for the spawnRequest

            let body: BodyPartConstant[] = [],
            tier = 0,
            cost = 0,

            // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

            remainingAllowedParts = Math.min(50, maxPartsPerCreep)

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

            // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

            while (cost < maxCostPerCreep && remainingAllowedParts > 0) {

                // Loop through each part in extraParts

                for (const part of opts.extraParts) {

                    // And add the part's cost to the cost

                    cost += BODYPART_COST[part]

                    // Otherwise add the part the the body

                    body.push(part)

                    // Reduce remainingAllowedParts and totalExtraParts

                    remainingAllowedParts--
                    totalExtraParts--
                }

                // Increase tier

                tier++
            }

            // Assign partIndex as the length of extraParts

            let partIndex = opts.extraParts.length

            // So long as the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts and partIndex is above 0

            while ((cost > maxCostPerCreep || remainingAllowedParts < 0) && partIndex > 0) {

                // Get the part using the partIndex

                const part = opts.extraParts[partIndex]

                // Get the cost of the part

                const partCost = BODYPART_COST[part]

                // If the cost minus partCost is below minCost, stop the loop

                if (cost - partCost < opts.minCost) break

                // And remove the part's cost to the cost

                cost -= partCost

                // Remove the last part in the body

                body.pop()

                // Increase remainingAllowedParts and totalExtraParts

                remainingAllowedParts++
                totalExtraParts++

                // Decrease the partIndex

                partIndex--
            }

            // If the body has fewer parts than defaultParts amount + extraParts amount

            if (body.length < opts.defaultParts.length + opts.extraParts.length) break

            // Create a spawnRequest using previously constructed information

            createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

            // Decrease maxCreeps counter

            opts.maxCreeps--
        }
    }

    // Construct requests for sourceHarvesters

    constructSpawnRequests((function(): SpawnRequestOpts {

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 200,
                priority: room.creepsFromRoom.sourceHarvester.length,
                memoryAdditions: {
                    role: 'sourceHarvester',
                }
            }
        }

        if (spawnEnergyCapacity >= 750) {

            return {
                defaultParts: [],
                extraParts: [WORK, MOVE, WORK],
                partsMultiplier: 3,
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
                minCost: 200,
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
            minCost: 200,
            priority: room.creepsFromRoom.sourceHarvester.length,
            memoryAdditions: {
                role: 'sourceHarvester',
            }
        }
    })())

    // Construct requests for haulers

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Get the required carry parts using known path distances

        const requiredCarryParts = generalFuncs.findCarryPartsRequired(room.get('source1PathLength') * 2, 10) +
        generalFuncs.findCarryPartsRequired(room.get('source2PathLength') * 2, 10) +
        generalFuncs.findCarryPartsRequired(room.get('upgradePathLength'), 10)


        // If all RCL 3 extensions are build

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [CARRY, CARRY, MOVE],
                partsMultiplier: requiredCarryParts / 2,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 150,
                priority: 0.5 + room.creepsFromRoom.hauler.length,
                memoryAdditions: {
                    role: 'hauler',
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [CARRY, MOVE],
            partsMultiplier: requiredCarryParts,
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

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // If the controllerContainer or controllerLink exists

        if (room.get('controllerContainer')) {

            if (room.storage) {

                return {
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE, WORK, WORK, WORK],
                    partsMultiplier: room.find(FIND_MY_CONSTRUCTION_SITES).length ? 1 : Math.floor(room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000 / 5) * 5,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
                    memoryAdditions: {
                        role: 'controllerUpgrader',
                    }
                }
            }

            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK, WORK, WORK],
                partsMultiplier: room.find(FIND_MY_CONSTRUCTION_SITES).length ? 1 : 4,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 200,
                priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
                memoryAdditions: {
                    role: 'controllerUpgrader',
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier: room.find(FIND_MY_CONSTRUCTION_SITES).length ? 1 : 3,
            minCreeps: undefined,
            maxCreeps: Infinity,
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

        // If all RCL 3 extensions are build

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [WORK, CARRY, MOVE],
                partsMultiplier: 6,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 200,
                priority: 3.5 + room.creepsFromRoom.builder.length,
                memoryAdditions: {
                    role: 'builder',
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier: 6,
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

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // If there are no roads or containers with below threshold hits

        // Get roads and containers in the room

        const possibleRepairTargets: (StructureRoad | StructureContainer)[] = room.get('road').concat(room.get('container'))

        // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

        const repairTargets = possibleRepairTargets.filter(structure => structure.hitsMax * 0.2 >= structure.hits)
        if (!repairTargets.length) return false

        // If all RCL 3 extensions are build

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [WORK, CARRY, MOVE],
                partsMultiplier: 4,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 200,
                priority: 3.5 + room.creepsFromRoom.maintainer.length,
                memoryAdditions: {
                    role: 'maintainer',
                }
            }
        }

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

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        return {
            defaultParts: [MOVE],
            extraParts: [],
            partsMultiplier: 2,
            minCreeps: 2,
            maxCreeps: Infinity,
            minCost: 100,
            priority: 2,
            memoryAdditions: {
                role: 'scout',
            }
        }
    })())

    // Inform spawnRequests

    return spawnRequests
}
