/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {

    // If there is no spawn que, make one

    if (!global[room.name].spawnQueue) global[room.name].spawnQueue = {}

    // Construct a record of spawnRequests

    const spawnRequests: {[key: string]: SpawnRequest} = {}

    // Record how many creeps should be spawned for each role

    const minCreeps: Partial<Record<CreepRoles, number>> = {}

    // Get the room's extensions and spawns

    const spawnStructures: (StructureSpawn | StructureExtension)[] = room.get('structuresForSpawning')

    // Structure info about the room's spawn energy

    const spawnEnergyAvailable = room.energyAvailable
    const spawnEnergyCapacity = room.energyCapacityAvailable

    //

    class SpawnRequest {
        constructor(body, tier, cost) {


        }
    }

    function constructSpawnRequests(opts: SpawnRequestOpts): void {

        // If there are no sourceHarvesters or haulers, set the maxCostPerCreep to the spawnEnergyAvailable, otherwise set it to the lowest allowed cost

        const maxCostPerCreep = (room.creepCount.sourceHarvester == 0 || room.creepCount.hauler == 0) ? spawnEnergyAvailable : opts.minCost

        // If the maxCostPerCreep is less than the minCost, stop

        if (maxCostPerCreep < opts.minCost) return

        // if minCreeps is a number

        if (opts.minCreeps > 0) {

            // So long as minCreeps is more than 0

            while (opts.minCreeps > 0) {



                opts.minCreeps--
            }

            // If minCreeps is equal to 0, stop

            return
        }

        // Otherwise if minCreeps is undefined

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = opts.extraParts.length * opts.partsMultiplier

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

                    if (cost + partCost >= maxCostPerCreep) break

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

                let part = opts.extraParts[partIndex]

                // Get the cost of the part

                let partCost = BODYPART_COST[part]

                // If the cost of the creep plus the part is more than or equal to the maxCostPerCreep, stop the loop

                if (cost + partCost >= maxCostPerCreep) {

                    // So long as the partIndex is more than 0

                    while (partIndex > 0) {

                        // Get the part using the partIndex

                        part = opts.extraParts[partIndex]

                        // Get the cost of the part

                        partCost = BODYPART_COST[part]

                        // If the cost of the creep minus the part is less than or equal to the minCost, stop the loop

                        if (cost - partCost <= opts.minCost) break

                        // Otherwise remove the last part in the body

                        body.pop()

                        // Remove the partCost from the cost

                        cost -= partCost

                        // Reduce totalExtraParts

                        totalExtraParts--

                        // Reduce partIndex

                        partIndex--
                    }

                    // Otherwise stop the loop

                    break
                }

                // Otherwise add the part the the body

                body.push(part)

                // And add the partCost to the cost

                cost += partCost

                // Increase totalExtraParts

                totalExtraParts++

                // Increase partIndex

                partIndex++

                // If the partIndex is equal to the length of extraParts

                if (partIndex == opts.extraParts.length) {

                    // Set partIndex to 0 and increase tier

                    partIndex = 0
                    tier++
                }
            }

            // Create a spawnRequest using previously constructed information

            new SpawnRequest(body, tier, cost)
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
                priority: room.creepsFromRoom.sourceHarvester,
                memoryAdditions: {
                    role: 'sourceHarvester',
                    getPulled: true,
                }
            }
        }
        if (spawnEnergyCapacity >= 650) {

            return {
                defaultParts: [CARRY],
                extraParts: [WORK],
                partsMultiplier: 12,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 250,
                priority: room.creepsFromRoom.sourceHarvester,
                memoryAdditions: {
                    role: 'sourceHarvester',
                    getPulled: true,
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [WORK],
            partsMultiplier: 12,
            minCreeps: undefined,
            maxCreeps: Math.max(2, room.get('source1HarvestPositions').length) + Math.max(2, room.get('source2HarvestPositions')),
            minCost: 200,
            priority: room.creepsFromRoom.sourceHarvester,
            memoryAdditions: {
                role: 'sourceHarvester',
                getPulled: true,
            }
        }

    })())

    return spawnRequests
}
