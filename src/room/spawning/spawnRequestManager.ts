import { allyList, builderSpawningWhenStorageThreshold, claimRequestNeedsIndex, remoteNeedsIndex, upgraderSpawningWhenStorageThreshold } from "international/constants"
import { findCarryPartsRequired, findRemoteSourcesByEfficacy, getRange } from "international/generalFunctions"

/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {

    // If there is no spawn queue, make one

    if (!global[room.name].spawnQueue) global[room.name].spawnQueue = {}

    // Construct a record of spawnRequests

    const spawnRequests: {[key: string]: SpawnRequest} = {},

    // Structure info about the room's spawn energy

    spawnEnergyAvailable = room.energyAvailable,
    spawnEnergyCapacity = room.energyCapacityAvailable,

    // Get the energyStructures

    energyStructures = room.get('structuresForSpawning'),
    dryRun = true

    // Create a spawn request given some values

    function createSpawnRequest(priority: number, body: BodyPartConstant[], tier: number, cost: number, memory: any) {

        // Set the memory's communeName to this room's name

        memory.communeName = room.name

        // Assign the cost to the creep's memory

        memory.cost = cost

        // Add the components to spawnRequests

        spawnRequests[priority] = {
            body,
            tier,
            cost,
            extraOpts: {
                memory,
                energyStructures,
                dryRun
            },
        }
    }

    // Create spawn requests using opts

    function constructSpawnRequests(opts: SpawnRequestOpts | false) {

        // If the opts aren't defined, stop

        if (!opts) return

        // If minCreeps is defined

        if (opts.minCreeps) {

            // Construct spawn requests individually, and stop

            constructSpawnRequestsIndividually(opts)
            return
        }

        // Construct spawn requests by group

        constructSpawnRequestsByGroup(opts)
    }

    function decideMaxCostPerCreep(maxCostPerCreep: number = spawnEnergyCapacity) {

        // If there are no sourceHarvesters or haulers

        if (room.creepsFromRoom.sourceHarvester.length == 0 || room.creepsFromRoom.hauler.length == 0) {

            // Inform the smaller of the following

            return Math.min(maxCostPerCreep, spawnEnergyAvailable)
        }

        // Otherwise the smaller of the following

        return Math.min(maxCostPerCreep, spawnEnergyCapacity)
    }

    // Use preset creep amounts to construct spawn requests

    function constructSpawnRequestsIndividually(opts: SpawnRequestOpts) {

        // Get the maxCostPerCreep

        const maxCostPerCreep = Math.max(decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

        // So long as minCreeps is more than the current number of creeps

        while (opts.minCreeps > (opts.groupComparator ? opts.groupComparator.length : room.creepsFromRoom[opts.memoryAdditions.role].length)) {

            // Construct important imformation for the spawnRequest

            let body: BodyPartConstant[] = [],
            tier = 0,
            cost = 0

            // If there are defaultParts

            if (opts.defaultParts.length) {

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

                        const part = opts.extraParts[partIndex],

                        // Get the cost of the part

                        partCost = BODYPART_COST[part]

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

                    // Decrease tier

                    tier--
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

    // Construct spawn requests while deciding on creep amounts

    function constructSpawnRequestsByGroup(opts: SpawnRequestOpts) {

        // Get the maxCostPerCreep

        const maxCostPerCreep = Math.max(decideMaxCostPerCreep(opts.maxCostPerCreep), opts.minCost)

        // Find the totalExtraParts using the partsMultiplier

        let totalExtraParts = Math.floor(opts.extraParts.length * opts.partsMultiplier)

        // Construct from totalExtraParts at a max of 50 - number of defaultParts

        const maxPartsPerCreep = Math.min(50 - opts.defaultParts.length, totalExtraParts)

        // Loop through creep names of the requested role

        for (const creepName of opts.groupComparator || room.creepsFromRoom[opts.memoryAdditions.role]) {

            // Take away the amount of parts the creep with the name has from totalExtraParts

            totalExtraParts -= (Game.creeps[creepName].body.length - opts.defaultParts.length)
        }

        // If there aren't enough requested parts to justify spawning a creep, stop

        if (totalExtraParts < maxPartsPerCreep * (opts.threshold || 0.25)) return

        // Subtract maxCreeps by the existing number of creeps of this role

        opts.maxCreeps -= opts.groupComparator ? opts.groupComparator.length : room.creepsFromRoom[opts.memoryAdditions.role].length

        // So long as there are totalExtraParts left to assign

        while (totalExtraParts >= opts.extraParts.length && opts.maxCreeps > 0) {

            // Construct important imformation for the spawnRequest

            let body: BodyPartConstant[] = [],
            tier = 0,
            cost = 0,

            // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

            remainingAllowedParts = maxPartsPerCreep

            // If there are defaultParts

            if (opts.defaultParts.length) {

                // Increment tier

                tier++

                // Loop through defaultParts

                for (const part of opts.defaultParts) {

                    // Get the cost of the part

                    const partCost = BODYPART_COST[part]

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

                    remainingAllowedParts--
                    totalExtraParts--
                }

                // Increase tier

                tier++
            }

            // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

            if (cost > maxCostPerCreep || remainingAllowedParts < 0) {

                // Assign partIndex as the length of extraParts

                let partIndex = opts.extraParts.length - 1

                // So long as partIndex is greater or equal to 0

                while (partIndex >= 0) {

                    // Get the part using the partIndex

                    const part = opts.extraParts[partIndex],

                    // Get the cost of the part

                    partCost = BODYPART_COST[part]

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

                // Decrease tier

                tier--
            }

            // Create a spawnRequest using previously constructed information

            createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

            // Decrease maxCreeps counter

            opts.maxCreeps--
        }
    }

    // Construct requests for sourceHarvesters

    constructSpawnRequests((function(): SpawnRequestOpts | false {

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

        if (spawnEnergyCapacity >= 600) {

            return {
                defaultParts: [MOVE, CARRY],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 300,
                priority: room.creepsFromRoom.sourceHarvester.length,
                memoryAdditions: {
                    role: 'sourceHarvester',
                }
            }
        }

        return {
            defaultParts: [MOVE, CARRY],
            extraParts: [WORK],
            partsMultiplier: 12,
            minCreeps: undefined,
            maxCreeps: Math.min(3, room.get('source1HarvestPositions')?.length) + Math.min(3, room.get('source2HarvestPositions')?.length),
            minCost: 200,
            priority: room.creepsFromRoom.sourceHarvester.length,
            memoryAdditions: {
                role: 'sourceHarvester',
            }
        }
    })())

    // Construct requests for haulers

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Construct the required carry parts

        let requiredCarryParts = 10

        // If there is no source1Link, increase requiredCarryParts using the source's path length

        if (!room.get('source1Link')) requiredCarryParts += findCarryPartsRequired(room.get('source1PathLength') * 2, 10)

        // If there is no source2Link, increase requiredCarryParts using the source's path length

        if (!room.get('source2Link')) requiredCarryParts += findCarryPartsRequired(room.get('source2PathLength') * 2, 10)

        // If there is a controllerContainer, increase requiredCarryParts using the hub-structure path length

        if (room.get('controllerContainer')) requiredCarryParts += findCarryPartsRequired(room.get('upgradePathLength') * 2, room.getPartsOfRoleAmount('controllerUpgrader', WORK))

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

    // Construct requests for mineralHarvesters

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // If there is no extractor, inform false

        if (!room.get('extractor').length) return false

        if (!room.storage || room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 40000) return false

        // If there is no terminal, inform false

        if (!room.terminal) return false

        // Get the mineral. If it's out of resources, inform false

        const mineral: Mineral = room.get('mineral')
        if (mineral.mineralAmount == 0) return false

        return {
            defaultParts: [],
            extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
            partsMultiplier: room.get('mineralHarvestPositions')?.length * 4,
            minCreeps: undefined,
            maxCreeps: room.get('mineralHarvestPositions')?.length,
            minCost: 900,
            priority: 6 + (room.creepsFromRoom.mineralHarvester.length * 3),
            memoryAdditions: {
                role: 'mineralHarvester',
            }
        }
    })())

    // Construct requests for hubHaulers

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // If there is no storage, inform false

        if (!room.storage) return false

        // Otherwise if there is no hubLink or terminal, inform false

        if (!room.get('hubLink') &&
            !room.terminal) return false

        return {
            defaultParts: [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, CARRY],
            extraParts: [],
            partsMultiplier: 1,
            minCreeps: 1,
            minCost: 800,
            priority: 3,
            memoryAdditions: {
                role: 'hubHauler',
            }
        }
    })())

    // Construct requests for fastFillers

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Get the fastFiller positions, if there are none, inform false

        const fastFillerPositions: Pos[] = room.get('fastFillerPositions')
        if (!fastFillerPositions.length) return false

        let defaultParts = [CARRY, MOVE, CARRY]

        // If the controller level is more or equal to 7, increase the defaultParts

        if (room.controller.level >= 7) defaultParts = [CARRY, CARRY, CARRY, MOVE, CARRY]

        return {
            defaultParts,
            extraParts: [],
            partsMultiplier: 1,
            minCreeps: fastFillerPositions.length,
            minCost: 250,
            priority: 0.75 + (room.myCreeps.fastFiller.length * 0.15),
            memoryAdditions: {
                role: 'fastFiller',
            }
        }
    })())

    // Get enemyAttackers in the room

    let enemyAttackers: Creep[]

    // If there are no towers

    if (!room.get('tower').length) {

        // Consider invaders as significant attackers

        enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !allyList.has(creep.owner.username) && !creep.isOnExit() && creep.hasPartsOfTypes([WORK, ATTACK, RANGED_ATTACK])
        })
    }

    // Otherwise

    else {

        // Don't consider invaders

        enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => creep.owner.username != 'Invader' && !allyList.has(creep.owner.username) && !creep.isOnExit() && creep.hasPartsOfTypes([WORK, ATTACK, RANGED_ATTACK])
        })
    }

    // Get the attackValue of the attackers

    let attackValue = 0

    // Loop through each enemyAttacker

    for (const enemyAttacker of enemyAttackers) {

        // Increase attackValue by the creep's heal power

        attackValue += enemyAttacker.findHealPower() / HEAL_POWER + enemyAttacker.partsOfType(WORK) + enemyAttacker.partsOfType(ATTACK) + enemyAttacker.partsOfType(RANGED_ATTACK)
    }

    // Construct requests for meleeDefenders

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Inform false if there are no enemyAttackers

        if(!enemyAttackers.length) return false

        return {
            defaultParts: [],
            extraParts: [ATTACK, ATTACK, MOVE],
            partsMultiplier: attackValue,
            minCreeps: undefined,
            maxCreeps: Math.max(enemyAttackers.length, 5),
            minCost: 210,
            priority: 2 + room.creepsFromRoom.meleeDefender.length,
            memoryAdditions: {
                role: 'meleeDefender',
            }
        }
    })())

    // Get the estimates income

    let estimatedIncome = room.estimateIncome()

    // Construct requests for builders

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Stop if there are no construction sites

        if (room.find(FIND_MY_CONSTRUCTION_SITES).length == 0) return false

        let partsMultiplier = 0

        // If there is a storage

        if (room.storage) {

            // If the storage is sufficiently full, provide x amount per y enemy in storage

            if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= builderSpawningWhenStorageThreshold) partsMultiplier += room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000

            // Otherwise, set partsMultiplier to 0

            else partsMultiplier = 0
        }

        // Otherwise if there is no storage

        else {

            // Construct an income share

            const incomeShare = estimatedIncome * 0.5

            // Use the incomeShare to adjust estimatedIncome and partsMultiplier

            estimatedIncome -= incomeShare
            partsMultiplier += incomeShare
        }

        // If all RCL 3 extensions are build

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [WORK, WORK, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, MOVE, WORK],
                partsMultiplier: partsMultiplier / 3,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 750,
                priority: 3.5 + room.creepsFromRoom.builder.length,
                memoryAdditions: {
                    role: 'builder',
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [WORK, MOVE, CARRY, MOVE],
            partsMultiplier,
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

        // Get roads

        const roads: (StructureRoad | StructureContainer)[] = room.get('road'),

        // Get containers

        containers: StructureContainer[] = room.get('container'),

        // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

        repairTargets = roads.concat(containers).filter(structure => structure.hitsMax * 0.2 >= structure.hits),

        // Get ramparts below their max hits

        ramparts = (room.get('rampart') as StructureRampart[]).filter(rampart => rampart.hits < rampart.hitsMax)

        // If there are no ramparts or repair targets

        if (!ramparts.length && !repairTargets.length) return false

        // Construct the partsMultiplier

        let partsMultiplier = 1

        // For each road, add a multiplier

        partsMultiplier += roads.length * 0.015

        // For each container, add a multiplier

        partsMultiplier += containers.length * 0.3

        // For each rampart, add a multiplier

        partsMultiplier += ramparts.length * 0.06

        // For every attackValue, add a multiplier

        partsMultiplier += attackValue * 0.5

        // For every x energy in storage, add 1 multiplier

        if (room.storage) partsMultiplier += room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000

        // If all RCL 3 extensions are build

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [WORK, CARRY, MOVE],
                partsMultiplier,
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
            partsMultiplier,
            minCreeps: undefined,
            maxCreeps: Infinity,
            minCost: 250,
            priority: 3.5 + room.creepsFromRoom.maintainer.length,
            memoryAdditions: {
                role: 'maintainer',
            }
        }
    })())

    // Construct requests for upgraders

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        // Construct the partsMultiplier

        let partsMultiplier = 1

        // If there is a storage

        if (room.storage) {

            // If the storage is sufficiently full, provide x amount per y enemy in storage

            if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= upgraderSpawningWhenStorageThreshold) partsMultiplier += Math.pow(room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 10000, 2)

            // Otherwise, set partsMultiplier to 0

            else partsMultiplier = 0
        }

        // Otherwise if there is no storage

        else {

            // Construct an income share

            const incomeShare = estimatedIncome * 0.5

            // Use the incomeShare to adjust estimatedIncome and partsMultiplier

            estimatedIncome -= incomeShare
            partsMultiplier += incomeShare
        }

        // Get the controllerLink and baseLink

        const controllerLink: StructureLink | undefined = room.get('controllerLink'),
        hubLink: StructureLink | undefined = room.get('hubLink')

        // If the controllerLink is defined

        if (controllerLink && hubLink) {

            // Get the range between the controllerLink and hubLink

            const range = getRange(controllerLink.pos.x - hubLink.pos.x, controllerLink.pos.y - hubLink.pos.y)

            // Limit partsMultiplier at the range divided by the controllerLink's capacity

            partsMultiplier = Math.min(partsMultiplier, (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.7) / range)
        }

        // If there are construction sites of my ownership in the room, set multiplier to 1

        if (room.find(FIND_MY_CONSTRUCTION_SITES).length) partsMultiplier = 0

        // Intitialize the threshold

        const threshold = 0.15

        // If the controllerContainer or controllerLink exists

        if (room.get('controllerContainer') || controllerLink) {

            // If the controller is level 8, max out partsMultiplier at 4

            if (room.controller.level == 8) {

                // If the controller is near to downgrading, set partsMultiplier to x

                if (room.controller.ticksToDowngrade < 10000) partsMultiplier = 5

                partsMultiplier = Math.min(Math.round(partsMultiplier / 5), 3)
                if (partsMultiplier == 0) return false

                return {
                    defaultParts: [MOVE],
                    extraParts: [WORK, WORK, WORK, WORK, MOVE, CARRY, WORK],
                    partsMultiplier,
                    threshold,
                    minCreeps: 1,
                    minCost: 650,
                    priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
                    memoryAdditions: {
                        role: 'controllerUpgrader',
                    }
                }
            }

            // Otherwise if the spawnEnergyCapacity is more than 800

            if (spawnEnergyCapacity >= 800) {

            // If the controller is near to downgrading, set partsMultiplier to x

            if (room.controller.ticksToDowngrade < 10000) partsMultiplier = 6

                partsMultiplier = Math.round(partsMultiplier / 6)
                if (partsMultiplier == 0) return false

                return {
                    defaultParts: [CARRY],
                    extraParts: [WORK, WORK, WORK, MOVE, WORK, WORK, WORK],
                    partsMultiplier,
                    threshold,
                    minCreeps: undefined,
                    maxCreeps: 8,
                    minCost: 700,
                    priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
                    memoryAdditions: {
                        role: 'controllerUpgrader',
                    }
                }
            }

            // If the controller is near to downgrading, set partsMultiplier to x

            if (room.controller.ticksToDowngrade < 10000) partsMultiplier = 4

            partsMultiplier = Math.round(partsMultiplier / 4)
            if (partsMultiplier == 0) return false

            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK, WORK, WORK],
                partsMultiplier,
                threshold,
                minCreeps: undefined,
                maxCreeps: 8,
                minCost: 200,
                priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
                memoryAdditions: {
                    role: 'controllerUpgrader',
                }
            }
        }

        // If the controller is near to downgrading, set partsMultiplier to x

        if (room.controller.ticksToDowngrade < 10000) partsMultiplier = 1

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [],
                extraParts: [WORK, CARRY, MOVE],
                partsMultiplier,
                threshold,
                minCreeps: undefined,
                maxCreeps: 8,
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
            partsMultiplier,
            threshold,
            minCreeps: undefined,
            maxCreeps: 8,
            minCost: 250,
            priority: 2.5 + room.creepsFromRoom.controllerUpgrader.length,
            memoryAdditions: {
                role: 'controllerUpgrader',
            }
        }
    })())

    // Get remotes by order of efficacy

    const remoteNamesByEfficacy: string[] = room.get('remoteNamesByEfficacy')

    for (let index = 0; index < remoteNamesByEfficacy.length; index++) {

        const remoteName = remoteNamesByEfficacy[index],

        remoteNeeds = Memory.rooms[remoteName].needs,

        // Add up econ needs for this room

        remoteEconNeed = Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source1RemoteHarvester], 0) +
        Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source2RemoteHarvester], 0) +
        Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteHauler], 0) +
        Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteReserver], 0)

        // If there is a need for any econ creep, inform the index

        if (remoteEconNeed <= 0) continue

        // Get the sources in order of efficacy

        const sourcesByEfficacy = findRemoteSourcesByEfficacy(remoteName)

        // Construct requests for source1RemoteHarvesters

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // If there are no needs for this room, inform false

            if (Memory.rooms[remoteName].needs[remoteNeedsIndex.source1RemoteHarvester] <= 0) return false

            if (spawnEnergyCapacity >= 950) {

                return {
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE],
                    partsMultiplier: Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source1RemoteHarvester], 0),
                    groupComparator: room.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    maxCostPerCreep: 50 + 150 * 6,
                    minCost: 200,
                    priority: 4 + index - (sourcesByEfficacy[0] == 'source1' ? .1 : 0),
                    memoryAdditions: {
                        role: 'source1RemoteHarvester',
                    }
                }
            }

            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE],
                partsMultiplier: Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source1RemoteHarvester], 0),
                groupComparator: room.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                threshold: 0.1,
                minCreeps: undefined,
                maxCreeps: global[remoteName]?.source1HarvestPositions?.length || Infinity,
                maxCostPerCreep: 50 + 150 * 6,
                minCost: 200,
                priority: 4 + index - (sourcesByEfficacy[0] == 'source1' ? .1 : 0),
                memoryAdditions: {
                    role: 'source1RemoteHarvester',
                }
            }
        })())

        // Construct requests for source2RemoteHarvesters

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // If there are no needs for this room, inform false

            if (Memory.rooms[remoteName].needs[remoteNeedsIndex.source2RemoteHarvester] <= 0) return false

            if (spawnEnergyCapacity >= 950) {

                return {
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE],
                    partsMultiplier: Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source2RemoteHarvester], 0),
                    groupComparator: room.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority: 4 + index - (sourcesByEfficacy[0] == 'source2' ? .1 : 0),
                    memoryAdditions: {
                        role: 'source2RemoteHarvester',
                    }
                }
            }

            return {
                defaultParts: [],
                extraParts: [WORK, MOVE],
                partsMultiplier: Math.max(Memory.rooms[remoteName].needs[remoteNeedsIndex.source2RemoteHarvester], 0),
                groupComparator: room.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                threshold: 0.1,
                minCreeps: undefined,
                maxCreeps: global[remoteName]?.source2HarvestPositions?.length || Infinity,
                maxCostPerCreep: 150 * 6,
                minCost: 200,
                priority: 4 + index - (sourcesByEfficacy[0] == 'source2' ? .1 : 0),
                memoryAdditions: {
                    role: 'source2RemoteHarvester',
                }
            }
        })())

        // Construct requests for remoteHaulers

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            let partsMultiplier = 0

            for (const roomName of remoteNamesByEfficacy) {

                partsMultiplier += Math.max(Memory.rooms[roomName].needs[remoteNeedsIndex.remoteHauler], 0)
            }

            // If there are no needs for this room, inform false

            if (Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteHauler] <= 0) return false

            return {
                defaultParts: [],
                extraParts: [CARRY, MOVE],
                threshold: 0.1,
                partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 200,
                priority: 4.2 + index,
                memoryAdditions: {
                    role: 'remoteHauler',
                }
            }
        })())

        // Construct requests for remoteReservers

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

            if (spawnEnergyCapacity < 750) return false

            // If there are no needs for this room, inform false

            if (Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteReserver] <= 0) return false

            return {
                defaultParts: [],
                extraParts: [MOVE, CLAIM],
                partsMultiplier: 3,
                groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteReserver,
                minCreeps: 1,
                maxCreeps: Infinity,
                minCost: 750,
                priority: 4.3 + index,
                memoryAdditions: {
                    role: 'remoteReserver',
                }
            }
        })())

        // Construct requests for remoteDefenders

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // Define the minCost and strength

            const minCost = 900

            // If there isn't enough spawnEnergyCapacity to spawn a remoteDefender, inform false

            if (spawnEnergyCapacity < minCost) return false

            // If there are no needs for this room, inform false

            if (Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteDefender] <= 0) return false

            const strengthByMargin = Memory.rooms[remoteName].needs[remoteNeedsIndex.remoteDefender],

            requiredStrength = Math.floor(remoteNeeds[remoteNeedsIndex.remoteDefender] / strengthByMargin)

            return {
                defaultParts: [],
                extraParts: [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE],
                partsMultiplier: Math.max(requiredStrength, 1),
                groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteDefender,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: minCost,
                priority: 4,
                memoryAdditions: {
                    role: 'remoteDefender',
                }
            }
        })())
    }

    // Construct requests for scouts

    constructSpawnRequests((function(): SpawnRequestOpts | false {

        return {
            defaultParts: [MOVE],
            extraParts: [],
            partsMultiplier: 1,
            minCreeps: 2,
            maxCreeps: Infinity,
            minCost: 100,
            priority: 2,
            memoryAdditions: {
                role: 'scout',
            }
        }
    })())

    if (room.memory.claimRequest) {

        const claimRequestNeeds = Memory.claimRequests[room.memory.claimRequest].needs

        // Construct requests for claimers

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // If there is no claimer need

            if (claimRequestNeeds[claimRequestNeedsIndex.claimer] <= 0) return false

            return {
                defaultParts: [MOVE, MOVE, CLAIM, MOVE],
                extraParts: [],
                partsMultiplier: 1,
                minCreeps: 1,
                minCost: 650,
                priority: 3,
                memoryAdditions: {
                    role: 'claimer'
                }
            }
        })())

        // Requests for vanguard

        constructSpawnRequests((function(): SpawnRequestOpts | false {

            // If there is no vanguard need

            if (claimRequestNeeds[claimRequestNeedsIndex.vanguard] <= 0) return false

            return {
                defaultParts: [],
                extraParts: [WORK, MOVE, CARRY, MOVE],
                partsMultiplier: claimRequestNeeds[claimRequestNeedsIndex.vanguard],
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 250,
                priority: 3.1 + room.creepsFromRoom.vanguard.length,
                memoryAdditions: {
                    role: 'vanguard',
                }
            }
        })())
    }

    // Inform spawnRequests

    return spawnRequests
}
