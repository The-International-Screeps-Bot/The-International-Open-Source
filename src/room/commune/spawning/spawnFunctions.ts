import { creepRoles, customColors, partsByPriority } from 'international/constants'
import { internationalManager } from 'international/international'
import { customLog, newID } from 'international/utils'

StructureSpawn.prototype.testSpawn = function (spawnRequest, ID) {
    return this.spawnCreep(spawnRequest.body, ID.toString(), { dryRun: true })
}

StructureSpawn.prototype.advancedSpawn = function (spawnRequest, ID) {

    spawnRequest.extraOpts.energyStructures = this.room.spawningStructuresByPriority

    return this.spawnCreep(
        spawnRequest.body,
        `${creepRoles.indexOf(spawnRequest.role)}_${spawnRequest.cost}_${this.room.name}_${
            spawnRequest.defaultParts
        }_${ID}`,
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

Room.prototype.findMaxCostPerCreep = function (maxCostPerCreep) {
    if (!maxCostPerCreep) maxCostPerCreep = this.energyCapacityAvailable

    // If there are no sourceHarvesters or haulers

    if (
        this.myCreeps.sourceHarvester.length === 0 ||
        this.myCreeps.hauler.length === 0
    )
        // Inform the smaller of the following

        return Math.min(maxCostPerCreep, this.energyAvailable)

    // Otherwise the smaller of the following

    return Math.min(maxCostPerCreep, this.energyCapacityAvailable)
}

Room.prototype.createSpawnRequest = function (priority, role, defaultParts, bodyPartCounts, tier, cost, memory) {
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

Room.prototype.spawnRequestIndividually = function (opts) {
    // Get the maxCostPerCreep

    const maxCostPerCreep = Math.max(this.findMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

    // So long as minCreeps is more than the current number of creeps

    while (opts.minCreeps > (opts.spawnGroup ? opts.spawnGroup.length : this.creepsFromRoom[opts.role].length)) {
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

        if (opts.defaultParts.length) {

            tier += 1

            // Loop through defaultParts

            for (const part of opts.defaultParts) {

                partCost = BODYPART_COST[part]
                if (cost + partCost > maxCostPerCreep) break

                cost += partCost
                bodyPartCounts[part] += 1
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
                const addedParts: BodyPartConstant[] = []

                // Loop through each part in extraParts

                for (const part of opts.extraParts) {
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

                    let partIndex = opts.extraParts.length - 1

                    while (partIndex >= 0) {

                        const part = opts.extraParts[partIndex]

                        // Get the cost of the part

                        partCost = BODYPART_COST[part]

                        // If the cost minus partCost is below minCost, stop the loop

                        if (cost - partCost < opts.minCost) break

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

                    tier += Math.floor((addedParts.length / opts.extraParts.length) * 100) / 100
                    for (const part of addedParts) bodyPartCounts[part] += 1
                    break
                }

                tier += 1
                for (const part of addedParts) bodyPartCounts[part] += 1
            }
        }

        // Create a spawnRequest using previously constructed information

        this.createSpawnRequest(
            opts.priority,
            opts.role,
            opts.defaultParts.length,
            bodyPartCounts,
            tier,
            cost,
            opts.memoryAdditions,
        )

        // Reduce the number of minCreeps

        opts.minCreeps -= 1
    }
}

Room.prototype.spawnRequestByGroup = function (opts) {
    // Get the maxCostPerCreep

    const maxCostPerCreep = Math.max(this.findMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

    // Find the totalExtraParts using the partsMultiplier

    let totalExtraParts = Math.floor(opts.extraParts.length * opts.partsMultiplier)

    // Construct from totalExtraParts at a max of 50 - number of defaultParts

    const maxPartsPerCreep = Math.min(50 - opts.defaultParts.length, totalExtraParts)

    // Loop through creep names of the requested role

    for (const creepName of opts.spawnGroup || this.creepsFromRoom[opts.role]) {
        const creep = Game.creeps[creepName]

        // Take away the amount of parts the creep with the name has from totalExtraParts

        totalExtraParts -= creep.body.length - creep.defaultParts
    }

    // If there aren't enough requested parts to justify spawning a creep, stop

    if (totalExtraParts < maxPartsPerCreep * (opts.threshold || 0.25)) return

    if (!opts.maxCreeps) {
        opts.maxCreeps = Number.MAX_SAFE_INTEGER
    }

    // Subtract maxCreeps by the existing number of creeps of this role
    else {
        opts.maxCreeps -= opts.spawnGroup ? opts.spawnGroup.length : this.creepsFromRoom[opts.role].length
    }

    // So long as there are totalExtraParts left to assign

    //Guard against bad arguments, otherwise it can cause the block below to get into an infinate loop and crash.
    if (opts.extraParts.length == 0) {
        customLog('spawnRequestByGroup error', '0 length extraParts?' + JSON.stringify(opts), {
            textColor: customColors.white,
            bgColor: customColors.red,
        })
        return
    }

    while (totalExtraParts >= opts.extraParts.length && opts.maxCreeps > 0) {
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

        if (opts.defaultParts.length) {
            // Increment tier

            tier += 1

            // Loop through defaultParts

            for (const part of opts.defaultParts) {

                partCost = BODYPART_COST[part]
                if (cost + partCost > maxCostPerCreep) break

                cost += partCost
                bodyPartCounts[part] += 1
            }
        }

        // So long as the cost is less than the maxCostPerCreep and there are remainingAllowedParts

        while (cost < maxCostPerCreep && remainingAllowedParts > 0) {
            const addedParts: BodyPartConstant[] = []

            for (const part of opts.extraParts) {

                cost += BODYPART_COST[part]
                addedParts.push(part)

                remainingAllowedParts -= 1
                totalExtraParts -= 1
            }

            // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

            if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                // Assign partIndex as the length of extraParts

                let partIndex = opts.extraParts.length - 1

                // So long as partIndex is greater or equal to 0

                while (partIndex >= 0) {

                    const part = opts.extraParts[partIndex]

                    partCost = BODYPART_COST[part]
                    if (cost - partCost < opts.minCost) break

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

                tier += Math.floor((addedParts.length / opts.extraParts.length) * 100) / 100
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
            opts.priority,
            opts.role,
            opts.defaultParts.length,
            bodyPartCounts,
            tier,
            cost,
            opts.memoryAdditions,
        )

        // Decrease maxCreeps counter

        opts.maxCreeps -= 1
    }
}
