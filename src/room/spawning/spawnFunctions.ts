import { customLog, newID } from 'international/generalFunctions'

StructureSpawn.prototype.advancedSpawn = function (spawnRequest) {
    // Attempt to spawn using the values in the spawnRequest

    return this.spawnCreep(
        spawnRequest.body,
        `${spawnRequest.role} ${spawnRequest.cost} ${this.room.name} T${spawnRequest.tier} ${newID()}`,
        spawnRequest.extraOpts,
    )
}

Room.prototype.constructSpawnRequests = function (opts) {
    // If the opts aren't defined, stop

    if (!opts) return

    // If minCreeps is defined

    if (opts.minCreeps) {
        // Construct spawn requests individually, and stop

        this.spawnRequestIndividually(opts)
        return
    }

    // Construct spawn requests by group

    this.spawnRequestByGroup(opts)
}

Room.prototype.decideMaxCostPerCreep = function (maxCostPerCreep) {
    if (!maxCostPerCreep) maxCostPerCreep = this.energyCapacityAvailable

    // If there are no sourceHarvesters or haulers

    if (
        this.myCreeps.source1Harvester.length + (this.myCreeps.source2Harvester?.length || 0) === 0 ||
        this.myCreeps.hauler.length === 0
    )
        // Inform the smaller of the following

        return Math.min(maxCostPerCreep, this.energyAvailable)

    // Otherwise the smaller of the following

    return Math.min(maxCostPerCreep, this.energyCapacityAvailable)
}

Room.prototype.createSpawnRequest = function (priority, role, body, tier, cost, memory) {
    // Add the components to spawnRequests

    this.spawnRequests[priority] = {
        role,
        body,
        tier,
        cost,
        extraOpts: {
            memory,
            energyStructures: this.spawningStructuresByPriority,
            dryRun: true,
        },
    }
}

Room.prototype.spawnRequestIndividually = function (opts) {
    // Get the maxCostPerCreep

    const maxCostPerCreep = Math.max(this.decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

    // So long as minCreeps is more than the current number of creeps

    while (opts.minCreeps > (opts.spawningGroup ? opts.spawningGroup.length : this.creepsFromRoom[opts.role].length)) {
        // Construct important imformation for the spawnRequest

        const body: BodyPartConstant[] = []
        let tier = 0
        let cost = 0

        let partCost

        // If there are defaultParts

        if (opts.defaultParts.length) {
            // Increment tier

            tier += 1

            // Loop through defaultParts

            for (const part of opts.defaultParts) {
                // Get the cost of the part

                partCost = BODYPART_COST[part]

                // And add the partCost to the cost

                cost += partCost

                // Add the part the the body

                body.push(part)
            }
        }

        // If there are extraParts

        if (opts.extraParts.length) {
            // Use the partsMultiplier to decide how many extraParts are needed on top of the defaultParts, at a max of 50

            let remainingAllowedParts = Math.min(
                50 - opts.defaultParts.length,
                opts.extraParts.length * opts.partsMultiplier,
            )

            // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

            while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
                // Loop through each part in extraParts

                for (const part of opts.extraParts) {
                    // And add the part's cost to the cost

                    cost += BODYPART_COST[part]

                    // Otherwise add the part the the body

                    body.push(part)

                    // Reduce remainingAllowedParts

                    remainingAllowedParts -= 1
                }

                // Increase tier

                tier += 1
            }

            // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts

            if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                // So long as partIndex is above 0

                let part

                // Assign partIndex as the length of extraParts

                let partIndex = opts.extraParts.length - 1

                while (partIndex >= 0) {
                    // Get the part using the partIndex

                    part = opts.extraParts[partIndex]

                    // Get the cost of the part

                    partCost = BODYPART_COST[part]

                    // If the cost minus partCost is below minCost, stop the loop

                    if (cost - partCost < opts.minCost) break

                    // And remove the part's cost to the cost

                    cost -= partCost

                    // Remove the last part in the body

                    body.pop()

                    // Increase remainingAllowedParts

                    remainingAllowedParts += 1

                    // Decrease the partIndex

                    partIndex -= 1
                }

                // Decrease tier

                tier -= 1
            }
        }

        // Create a spawnRequest using previously constructed information

        this.createSpawnRequest(opts.priority, opts.role, body, tier, cost, opts.memoryAdditions)

        // Reduce the number of minCreeps

        opts.minCreeps -= 1
    }

    // If minCreeps is equal to 0, stop
}

Room.prototype.spawnRequestByGroup = function (opts) {
    // Get the maxCostPerCreep

    const maxCostPerCreep = Math.max(this.decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

    // Find the totalExtraParts using the partsMultiplier

    let totalExtraParts = Math.floor(opts.extraParts.length * opts.partsMultiplier)

    // Construct from totalExtraParts at a max of 50 - number of defaultParts

    const maxPartsPerCreep = Math.min(50 - opts.defaultParts.length, totalExtraParts)

    // Loop through creep names of the requested role

    for (const creepName of opts.spawningGroup || this.creepsFromRoom[opts.role]) {
        // Take away the amount of parts the creep with the name has from totalExtraParts

        totalExtraParts -= Game.creeps[creepName].body.length - opts.defaultParts.length
    }

    // If there aren't enough requested parts to justify spawning a creep, stop

    if (totalExtraParts < maxPartsPerCreep * (opts.threshold || 0.25)) return

    // Subtract maxCreeps by the existing number of creeps of this role

    if (!opts.maxCreeps) opts.maxCreeps = Infinity
    opts.maxCreeps -= opts.spawningGroup ? opts.spawningGroup.length : this.creepsFromRoom[opts.role].length

    // So long as there are totalExtraParts left to assign

    while (totalExtraParts >= opts.extraParts.length && opts.maxCreeps > 0) {
        // Construct important imformation for the spawnRequest

        const body: BodyPartConstant[] = []
        let tier = 0
        let cost = 0

        let partCost

        // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

        let remainingAllowedParts = maxPartsPerCreep

        // If there are defaultParts

        if (opts.defaultParts.length) {
            // Increment tier

            tier += 1

            // Loop through defaultParts

            for (const part of opts.defaultParts) {
                // Get the cost of the part

                partCost = BODYPART_COST[part]

                // And add the partCost to the cost

                cost += partCost

                // Add the part the the body

                body.push(part)
            }
        }

        // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

        while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
            // Loop through each part in extraParts

            for (const part of opts.extraParts) {
                // And add the part's cost to the cost

                cost += BODYPART_COST[part]

                // Add the part the the body

                body.push(part)

                // Reduce remainingAllowedParts and totalExtraParts

                remainingAllowedParts -= 1
                totalExtraParts -= 1
            }

            // Increase tier

            tier += 1
        }

        // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

        if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
            let part

            // Assign partIndex as the length of extraParts

            let partIndex = opts.extraParts.length - 1

            // So long as partIndex is greater or equal to 0

            while (partIndex >= 0) {
                // Get the part using the partIndex

                part = opts.extraParts[partIndex]

                // Get the cost of the part

                partCost = BODYPART_COST[part]

                // If the cost minus partCost is below minCost, stop the loop

                if (cost - partCost < opts.minCost) break

                // And remove the part's cost to the cost

                cost -= partCost

                // Remove the last part in the body

                body.pop()

                // Increase remainingAllowedParts and totalExtraParts

                remainingAllowedParts += 1
                totalExtraParts += 1

                // Decrease the partIndex

                partIndex -= 1
            }

            // Decrease tier

            tier -= 1
        }

        // Create a spawnRequest using previously constructed information

        this.createSpawnRequest(opts.priority, opts.role, body, tier, cost, opts.memoryAdditions)

        // Decrease maxCreeps counter

        opts.maxCreeps -= 1
    }
}
