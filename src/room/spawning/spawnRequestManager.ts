import {
    allyCreepRequestNeedsIndex,
    allyList,
    builderSpawningWhenStorageThreshold,
    claimRequestNeedsIndex,
    containerUpkeepCost,
    controllerDowngradeUpgraderNeed,
    minHarvestWorkRatio,
    myColors,
    rampartUpkeepCost,
    remoteHarvesterRoles,
    remoteNeedsIndex,
    roadUpkeepCost,
    upgraderSpawningWhenStorageThreshold,
} from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findRemoteSourcesByEfficacy,
    getRange,
} from 'international/generalFunctions'

Room.prototype.spawnRequester = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Structure info about the this's spawn energy

    const spawnEnergyCapacity = this.energyCapacityAvailable

    const mostOptimalSource = this.sourcesByEfficacy[0]

    let partsMultiplier: number

    // Construct requests for sourceHarvesters

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const sourceIndex = 0
            const role = 'source1Harvester'

            const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom[role].length

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE, WORK],
                    partsMultiplier: 3,
                    minCreeps: 1,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (spawnEnergyCapacity >= 750) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [WORK, MOVE, WORK],
                    partsMultiplier: 3,
                    minCreeps: 1,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (spawnEnergyCapacity >= 600) {
                return {
                    role,
                    defaultParts: [MOVE, CARRY],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: 1,
                    minCost: 300,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (this.sourceContainers[sourceIndex]) {
                return {
                    role,
                    defaultParts: [MOVE],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: 1,
                    minCost: 150,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [MOVE, CARRY],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: undefined,
                maxCreeps: Math.min(3, this.sourcePositions[sourceIndex].length),
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            }
        })(),
    )

    // Construct requests for sourceHarvesters

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const sourceIndex = 1
            const role = 'source2Harvester'

            const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom[role].length

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE, WORK],
                    partsMultiplier: 3,
                    minCreeps: 1,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (spawnEnergyCapacity >= 750) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [WORK, MOVE, WORK],
                    partsMultiplier: 3,
                    minCreeps: 1,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (spawnEnergyCapacity >= 600) {
                return {
                    role,
                    defaultParts: [MOVE, CARRY],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: 1,
                    minCost: 300,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            if (this.sourceContainers[sourceIndex]) {
                return {
                    role,
                    defaultParts: [MOVE],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: 1,
                    minCost: 150,
                    priority,
                    memoryAdditions: {
                        SI: sourceIndex,
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [MOVE, CARRY],
                extraParts: [WORK],
                partsMultiplier: 6,
                minCreeps: undefined,
                maxCreeps: Math.min(3, this.sourcePositions[sourceIndex].length),
                minCost: 200,
                priority,
                memoryAdditions: {
                    SI: sourceIndex,
                    roads: true,
                },
            }
        })(),
    )

    // Construct requests for haulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const priority = 0.5 + this.creepsFromRoom.hauler.length

            // Construct the required carry parts

            let requiredCarryParts = 10

            // If there is no sourceLink 0, increase requiredCarryParts using the source's path length

            if (!this.sourceLinks[0]) requiredCarryParts += findCarryPartsRequired(this.sourcePaths[0].length * 2, 10)

            // If there is no sourceLink 1, increase requiredCarryParts using the source's path length

            if (!this.sourceLinks[1]) requiredCarryParts += findCarryPartsRequired(this.sourcePaths[1].length * 2, 10)

            // If there is a controllerContainer, increase requiredCarryParts using the hub-structure path length

            if (this.controllerContainer) {
                let income

                if (this.storage) {
                    income = this.getPartsOfRoleAmount('controllerUpgrader', WORK)
                } else
                    income = Math.min(
                        this.getPartsOfRoleAmount('controllerUpgrader', WORK) * 0.75,
                        this.sources.length * 0.75,
                    )

                requiredCarryParts += findCarryPartsRequired(this.upgradePathLength * 2, income)
            }

            const role = 'hauler'

            // If all RCL 3 extensions are built

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, CARRY, MOVE],
                    partsMultiplier: requiredCarryParts / 2,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 150,
                    maxCostPerCreep: this.memory.HS,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE],
                partsMultiplier: requiredCarryParts,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 100,
                maxCostPerCreep: this.memory.HS,
                priority,
                memoryAdditions: {},
            }
        })(),
    )

    // Construct requests for mineralHarvesters

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // If there is no extractor, inform false

            if (!this.structures.extractor.length) return false

            if (!this.storage) return false

            if (this.storage.store.energy < 40000) return false

            // If there is no terminal, inform false

            if (!this.terminal) return false

            if (this.terminal.store.getFreeCapacity() <= 10000) return false

            // Get the mineral. If it's out of resources, inform false

            if (this.mineral.mineralAmount === 0) return false

            let minCost = 900

            if (spawnEnergyCapacity < minCost) return false

            const role = 'mineralHarvester'

            return {
                role,
                defaultParts: [],
                extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
                partsMultiplier: this.get('mineralHarvestPositions')?.length * 4,
                minCreeps: 1,
                minCost,
                priority: 10 + this.creepsFromRoom.mineralHarvester.length * 3,
                memoryAdditions: {
                    roads: true,
                },
            }
        })(),
    )

    // Construct requests for hubHaulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // If there is no storage, inform false

            if (!this.storage) return false

            // Otherwise if there is no hubLink or terminal, inform false

            if (!this.hubLink && !this.terminal) return false

            const role = 'hubHauler'

            return {
                role,
                defaultParts: [MOVE],
                extraParts: [CARRY],
                partsMultiplier: 8,
                minCreeps: 1,
                minCost: 300,
                priority: 7,
                memoryAdditions: {},
            }
        })(),
    )

    // Construct requests for fastFillers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // Get the fastFiller positions, if there are none, inform false

            const fastFillerPositions: Coord[] = this.get('fastFillerPositions')
            if (!fastFillerPositions.length) return false

            let defaultParts = [CARRY, MOVE, CARRY]

            // If the controller level is more or equal to 7, increase the defaultParts

            if (this.controller.level >= 7) defaultParts = [CARRY, CARRY, CARRY, MOVE, CARRY]

            const role = 'fastFiller'

            return {
                role,
                defaultParts,
                extraParts: [],
                partsMultiplier: 1,
                minCreeps: fastFillerPositions.length,
                minCost: 250,
                priority: 0.75,
                memoryAdditions: {},
            }
        })(),
    )

    // Get enemyAttackers in the this

    const { enemyAttackers } = this

    // Get the attackValue of the attackers

    let attackStrength = 0
    let healStrength = 0

    // Loop through each enemyAttacker

    // Increase attackValue by the creep's heal power

    for (const enemyCreep of this.enemyCreeps) {
        attackStrength += enemyCreep.attackStrength
        healStrength += enemyCreep.healStrength
    }

    // Construct requests for meleeDefenders

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // Inform false if there are no enemyAttackers

            if (!enemyAttackers.length) return false

            /* if (this.controller.safeMode) return false */

            if (this.towerSuperiority) return false

            // If towers, spawn based on healStrength. If no towers, use attackStrength and healStrength

            let requiredStrength = (healStrength + (this.structures.tower.length ? 0 : attackStrength)) * 1.2

            const role = 'meleeDefender'

            // If all RCL 3 extensions are build

            if (spawnEnergyCapacity >= 800) {
                const extraParts = [ATTACK, ATTACK, MOVE]
                const strength = 2 * ATTACK_POWER + 1

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: Math.max(requiredStrength / strength / 2, 1),
                    minCost: 210,
                    priority: 6 + this.creepsFromRoom.meleeDefender.length,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            const extraParts = [ATTACK, MOVE]
            const strength = ATTACK_POWER + 1

            return {
                role,
                defaultParts: [],
                extraParts,
                partsMultiplier: Math.max(requiredStrength / strength, 1),
                minCost: 260,
                priority: 6 + this.creepsFromRoom.meleeDefender.length,
                memoryAdditions: {},
            }
        })(),
    )

    // Get the estimates income

    const estimatedIncome = this.estimateIncome()

    // Construct requests for builders

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // Stop if there are no construction sites

            if (this.find(FIND_MY_CONSTRUCTION_SITES).length === 0) return false

            let priority = 10 + this.creepsFromRoom.builder.length
            let partsMultiplier = 0

            // If there is a storage

            if (this.storage) {
                // If the storage is sufficiently full, provide x amount per y enemy in storage

                if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= builderSpawningWhenStorageThreshold)
                    partsMultiplier += this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000
            }

            // Otherwise if there is no storage
            else partsMultiplier += estimatedIncome / 2.5

            const role = 'builder'
            /*
            // If there is a storage or terminal

            if (this.storage || this.terminal) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, WORK, MOVE],
                    partsMultiplier: partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }
            */

            // If all RCL 3 extensions are build

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, WORK, MOVE],
                    partsMultiplier: partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            // There are no fastFiller containers

            if (!this.fastFillerContainerLeft && !this.fastFillerContainerRight) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [WORK, CARRY, CARRY, MOVE],
                    partsMultiplier: partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE, WORK, CARRY, MOVE],
                partsMultiplier: partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 300,
                priority,
                memoryAdditions: {
                    roads: true,
                },
            }
        })(),
    )

    // Construct requests for mainainers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const priority = 8 + this.creepsFromRoom.maintainer.length

            // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

            const repairTargets = [...this.structures.road, ...this.structures.container].filter(
                structure => structure.hitsMax * 0.2 >= structure.hits,
            )
            // Get ramparts below their max hits

            const ramparts = this.structures.rampart.filter(rampart => rampart.hits < rampart.hitsMax)

            // If there are no ramparts or repair targets

            if (!ramparts.length && !repairTargets.length) return false

            // Construct the partsMultiplier

            let partsMultiplier = 1

            // For each road, add a multiplier

            partsMultiplier += this.structures.road.length * roadUpkeepCost * 1.2

            // For each container, add a multiplier

            partsMultiplier += this.structures.container.length * containerUpkeepCost * 1.2

            // For each rampart, add a multiplier

            partsMultiplier += ramparts.length * rampartUpkeepCost * 1.2

            // For every attackValue, add a multiplier

            partsMultiplier += attackStrength / (REPAIR_POWER / 2)

            // For every x energy in storage, add 1 multiplier

            if (this.storage) partsMultiplier += this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000

            const role = 'maintainer'

            // If all RCL 3 extensions are build

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK],
                    partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [MOVE, CARRY, MOVE, WORK],
                partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 250,
                priority,
                memoryAdditions: {},
            }
        })(),
    )

    // Construct requests for upgraders

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            let partsMultiplier = 1
            let maxCreeps = this.get('upgradePositions').length - 1
            const priority = 9

            // If there are enemyAttackers and the controller isn't soon to downgrade

            if (
                enemyAttackers.length &&
                this.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed &&
                !this.towerSuperiority
            )
                return false

            // If there is a storage

            if (this.storage) {
                // If the storage is sufficiently full, provide x amount per y enemy in storage

                if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= upgraderSpawningWhenStorageThreshold)
                    partsMultiplier = Math.pow(this.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 10000, 2)
                // Otherwise, set partsMultiplier to 0
                else partsMultiplier = 0
            }

            // Otherwise if there is no storage
            else {
                partsMultiplier += estimatedIncome * 0.75
            }

            // Get the controllerLink and baseLink

            const controllerLink = this.controllerLink

            // If the controllerLink is defined

            if (controllerLink) {
                const hubLink = this.hubLink
                const sourceLinks = this.sourceLinks

                // If there are transfer links, max out partMultiplier to their ability

                if (hubLink || sourceLinks.length) {
                    let maxPartsMultiplier = 0

                    if (hubLink) {
                        // Get the range between the controllerLink and hubLink

                        const range = getRange(controllerLink.pos.x, hubLink.pos.x, controllerLink.pos.y, hubLink.pos.y)

                        // Limit partsMultiplier at the range with a multiplier

                        maxPartsMultiplier += (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.7) / range
                    } else maxCreeps -= 1

                    for (const sourceLink of sourceLinks) {
                        if (!sourceLink) continue

                        // Get the range between the controllerLink and hubLink

                        const range = getRange(
                            controllerLink.pos.x,
                            sourceLink.pos.x,
                            controllerLink.pos.y,
                            sourceLink.pos.y,
                        )

                        // Limit partsMultiplier at the range with a multiplier

                        maxPartsMultiplier += (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) / range
                    }

                    partsMultiplier = Math.min(partsMultiplier, maxPartsMultiplier)
                }
            }

            // If there are construction sites of my ownership in the this, set multiplier to 1

            if (this.find(FIND_MY_CONSTRUCTION_SITES).length) partsMultiplier = 0

            const threshold = 0.15
            const role = 'controllerUpgrader'

            // If the controllerContainer or controllerLink exists

            if (this.controllerContainer || controllerLink) {
                // If the controller is level 8

                if (this.controller.level === 8) {
                    // If the controller is near to downgrading

                    if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                        partsMultiplier = Math.max(partsMultiplier, 3)

                    partsMultiplier = Math.min(Math.round(partsMultiplier / 3), 5)
                    if (partsMultiplier === 0) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts: [
                            WORK,
                            WORK,
                            MOVE,
                            CARRY,
                            WORK,
                            WORK,
                            MOVE,
                            WORK,
                            WORK,
                            WORK,
                            MOVE,
                            WORK,
                            WORK,
                            MOVE,
                            CARRY,
                            WORK,
                            MOVE,
                            WORK,
                            WORK,
                            MOVE,
                            WORK,
                            WORK,
                            MOVE,
                            CARRY,
                            WORK,
                            MOVE,
                        ],
                        partsMultiplier,
                        threshold,
                        minCreeps: 1,
                        minCost: 300,
                        priority,
                        memoryAdditions: {
                            roads: true,
                        },
                    }
                }

                // Otherwise if the spawnEnergyCapacity is more than 800

                if (spawnEnergyCapacity >= 800) {
                    // If the controller is near to downgrading, set partsMultiplier to x

                    if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                        partsMultiplier = Math.max(partsMultiplier, 6)

                    partsMultiplier = Math.round(partsMultiplier / 6)
                    if (partsMultiplier === 0) return false

                    return {
                        role,
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE, WORK, WORK, WORK],
                        partsMultiplier,
                        threshold,
                        minCreeps: undefined,
                        maxCreeps,
                        minCost: 750,
                        priority,
                        memoryAdditions: {
                            roads: true,
                        },
                    }
                }

                // If the controller is near to downgrading, set partsMultiplier to x

                if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                    partsMultiplier = Math.max(partsMultiplier, 4)

                partsMultiplier = Math.round(partsMultiplier / 4)
                if (partsMultiplier === 0) return false

                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, MOVE, WORK, WORK, WORK],
                    partsMultiplier,
                    threshold,
                    minCreeps: undefined,
                    maxCreeps,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            // If the controller is near to downgrading, set partsMultiplier to x

            if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                partsMultiplier = Math.max(partsMultiplier, 1)
            if (this.controller.level < 2) partsMultiplier = Math.max(partsMultiplier, 1)

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK],
                    partsMultiplier,
                    threshold,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        roads: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [MOVE, CARRY, MOVE, WORK],
                partsMultiplier,
                threshold,
                maxCreeps: Infinity,
                minCost: 250,
                priority,
                memoryAdditions: {},
            }
        })(),
    )

    let remoteHaulerNeed = 0

    const minRemotePriority = 10

    const remoteNamesByEfficacy: string[] = this.get('remoteNamesByEfficacy')

    for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
        const remoteName = remoteNamesByEfficacy[index]
        const remoteNeeds = Memory.rooms[remoteName].needs

        // Add up econ needs for this this

        const totalRemoteNeed =
            Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteHauler], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteReserver], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteCoreAttacker], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.remoteDismantler], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.minDamage], 0) +
            Math.max(remoteNeeds[remoteNeedsIndex.minHeal], 0)

        // If there is a need for any econ creep, inform the index

        if (totalRemoteNeed <= 0) continue

        const remoteMemory = Memory.rooms[remoteName]

        // Get the sources in order of efficacy

        const sourcesByEfficacy = findRemoteSourcesByEfficacy(remoteName)

        const possibleReservation = spawnEnergyCapacity >= 650

        // Loop through each index of sourceEfficacies

        for (let index = 0; index < remoteMemory.sourceEfficacies.length; index += 1) {
            // Get the income based on the reservation of the this and remoteHarvester need
            // Multiply remote harvester need by 1.6~ to get 3 to 5 and 6 to 10, converting work part need to income expectation

            const income =
                (possibleReservation ? 10 : 5) -
                Math.floor(remoteMemory.needs[remoteNeedsIndex[remoteHarvesterRoles[index]]] * minHarvestWorkRatio)

            // Find the number of carry parts required for the source, and add it to the remoteHauler need

            remoteHaulerNeed += findCarryPartsRequired(remoteMemory.sourceEfficacies[index], income)
        }

        const remotePriority = minRemotePriority + index

        // Construct requests for source1RemoteHarvesters

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no needs for this this, inform false

                if (remoteNeeds[remoteNeedsIndex.source1RemoteHarvester] <= 0) return false

                const sourceIndex = 0
                const sourcePositionsAmount = remoteMemory.SP[sourceIndex].length

                const role = 'source1RemoteHarvester'

                if (spawnEnergyCapacity >= 950) {
                    return {
                        role,
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE],
                        partsMultiplier: remoteNeeds[remoteNeedsIndex.source1RemoteHarvester],
                        groupComparator: this.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                        threshold: 0.1,
                        minCreeps: 1,
                        maxCreeps: sourcePositionsAmount,
                        maxCostPerCreep: 50 + 150 * 6,
                        minCost: 200,
                        priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                        memoryAdditions: {
                            roads: true,
                            SI: sourceIndex,
                        },
                    }
                }

                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, WORK, MOVE],
                    partsMultiplier: remoteNeeds[remoteNeedsIndex.source1RemoteHarvester],
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: undefined,
                    maxCreeps: sourcePositionsAmount,
                    maxCostPerCreep: 50 + 250 * 3,
                    minCost: 300,
                    priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                    memoryAdditions: {
                        roads: true,
                        SI: sourceIndex,
                    },
                }
            })(),
        )

        // Construct requests for source2RemoteHarvesters

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no needs for this this, inform false

                if (remoteNeeds[remoteNeedsIndex.source2RemoteHarvester] <= 0) return false

                const sourceIndex = 1
                const sourcePositionsAmount = remoteMemory.SP[sourceIndex].length

                const role = 'source2RemoteHarvester'

                if (spawnEnergyCapacity >= 950) {
                    return {
                        role,
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE],
                        partsMultiplier: remoteNeeds[remoteNeedsIndex.source2RemoteHarvester],
                        groupComparator: this.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                        threshold: 0.1,
                        minCreeps: 1,
                        maxCreeps: sourcePositionsAmount,
                        maxCostPerCreep: 50 + 150 * 6,
                        minCost: 200,
                        priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                        memoryAdditions: {
                            roads: true,
                            SI: sourceIndex,
                        },
                    }
                }

                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, WORK, MOVE],
                    partsMultiplier: remoteNeeds[remoteNeedsIndex.source2RemoteHarvester],
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                    threshold: 0.1,
                    minCreeps: undefined,
                    maxCreeps: sourcePositionsAmount,
                    maxCostPerCreep: 50 + 250 * 3,
                    minCost: 300,
                    priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                    memoryAdditions: {
                        roads: true,
                        SI: sourceIndex,
                    },
                }
            })(),
        )

        // Construct requests for remoteReservers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                let cost = 650

                // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

                if (spawnEnergyCapacity < cost) return false

                // If there are no needs for this this, inform false

                if (remoteNeeds[remoteNeedsIndex.remoteReserver] <= 0) return false

                const role = 'remoteReserver'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [MOVE, CLAIM],
                    partsMultiplier: 6,
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteReserver,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    minCost: cost,
                    priority: remotePriority + 0.3,
                    memoryAdditions: {},
                }
            })(),
        )

        // Construct requests for remoteDefenders

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no related needs

                if (remoteNeeds[remoteNeedsIndex.minDamage] + remoteNeeds[remoteNeedsIndex.minHeal] <= 0) return false

                const minCost = 400
                const cost = 900
                const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE]
                const rangedAttackStrength = RANGED_ATTACK_POWER * 2
                const healStrength = HEAL_POWER

                // If there isn't enough spawnEnergyCapacity to spawn a remoteDefender, inform false

                if (spawnEnergyCapacity < minCost) return false

                // If max spawnable strength is less that needed

                if (
                    rangedAttackStrength * (spawnEnergyCapacity / cost) < remoteNeeds[remoteNeedsIndex.minDamage] ||
                    healStrength * (spawnEnergyCapacity / cost) < remoteNeeds[remoteNeedsIndex.minHeal]
                ) {
                    // Abandon the this for some time

                    Memory.rooms[remoteName].abandoned = 1500
                    return false
                }

                const partsMultiplier = Math.max(
                    remoteNeeds[remoteNeedsIndex.minDamage] / rangedAttackStrength +
                        remoteNeeds[remoteNeedsIndex.minHeal] / healStrength,
                    1,
                )

                const role = 'remoteDefender'

                customLog(
                    'REMOTE DEFENDER FUNCTIONS',
                    partsMultiplier +
                        ', ' +
                        remoteNeeds[remoteNeedsIndex.minDamage] +
                        ', ' +
                        remoteNeeds[remoteNeedsIndex.minHeal] +
                        ', ' +
                        remoteName +
                        ', ' +
                        rangedAttackStrength * (spawnEnergyCapacity / cost) +
                        ', ' +
                        healStrength * (spawnEnergyCapacity / cost) +
                        ', ' +
                        cost *
                            (remoteNeeds[remoteNeedsIndex.minDamage] / rangedAttackStrength +
                                remoteNeeds[remoteNeedsIndex.minHeal] / healStrength) +
                        ', ' +
                        this.creepsFromRoomWithRemote[remoteName].remoteDefender,
                )

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier,
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteDefender,
                    minCreeps: 1,
                    minCost,
                    priority: minRemotePriority - 3,
                    memoryAdditions: {},
                }
            })(),
        )

        // Construct requests for remoteCoreAttackers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no related needs

                if (remoteNeeds[remoteNeedsIndex.remoteCoreAttacker] <= 0) return false

                // Define the minCost and strength

                const cost = 130
                const extraParts = [ATTACK, MOVE]
                const minCost = cost * extraParts.length

                const role = 'remoteCoreAttacker'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 50 / extraParts.length,
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteCoreAttacker,
                    minCreeps: 1,
                    minCost,
                    priority: minRemotePriority - 2,
                    memoryAdditions: {},
                }
            })(),
        )

        // Construct requests for remoteDismantler

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no related needs

                if (remoteNeeds[remoteNeedsIndex.remoteDismantler] <= 0) return false

                // Define the minCost and strength

                const cost = 150
                const extraParts = [WORK, MOVE]

                const role = 'remoteDismantler'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 50 / extraParts.length,
                    groupComparator: this.creepsFromRoomWithRemote[remoteName].remoteDismantler,
                    minCreeps: 1,
                    minCost: cost * 2,
                    priority: minRemotePriority - 1,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    // Construct requests for remoteHaulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            if (remoteHaulerNeed === 0) return false

            /*
               // If all RCL 3 extensions are built

               if (spawnEnergyCapacity >= 800) {

                    partsMultiplier = remoteHaulerNeed / 2

                    return {
                         defaultParts: [],
                         extraParts: [CARRY, CARRY, MOVE],
                         threshold: 0.1,
                         partsMultiplier,
                         maxCreeps: Infinity,
                         minCost: 150,
                         maxCostPerCreep: this.memory.HS,
                         priority: minRemotePriority - 0.2,
                         memoryAdditions: {
                              role: 'remoteHauler',
                              roads: true,
                         },
                    }
               }
 */
            partsMultiplier = remoteHaulerNeed

            const role = 'remoteHauler'

            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE],
                threshold: 0.1,
                partsMultiplier,
                maxCreeps: Infinity,
                minCost: 100,
                maxCostPerCreep: this.memory.HS,
                priority: minRemotePriority - 0.2,
                memoryAdditions: {},
            }
        })(),
    )

    // Construct requests for scouts

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const role = 'scout'

            return {
                role,
                defaultParts: [MOVE],
                extraParts: [],
                partsMultiplier: 1,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 100,
                priority: 6,
                memoryAdditions: {},
            }
        })(),
    )

    if (this.memory.claimRequest) {
        const claimRequestNeeds = Memory.claimRequests[this.memory.claimRequest].needs

        // Construct requests for claimers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there is no claimer need

                if (claimRequestNeeds[claimRequestNeedsIndex.claimer] <= 0) return false

                const role = 'claimer'

                return {
                    role,
                    defaultParts: [MOVE, MOVE, CLAIM, MOVE],
                    extraParts: [],
                    partsMultiplier: 1,
                    minCreeps: 1,
                    minCost: 750,
                    priority: 8.1,
                    memoryAdditions: {},
                }
            })(),
        )

        // Requests for vanguard

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there is no vanguard need

                if (claimRequestNeeds[claimRequestNeedsIndex.vanguard] <= 0) return false

                const role = 'vanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: claimRequestNeeds[claimRequestNeedsIndex.vanguard],
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority: 8.2 + this.creepsFromRoom.vanguard.length,
                    memoryAdditions: {},
                }
            })(),
        )

        // Requests for vanguardDefender

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                const minCost = 400
                const cost = 900
                const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE]
                const strengthOfParts = RANGED_ATTACK_POWER * 3 + HEAL_POWER * 1

                // If there isn't enough spawnEnergyCapacity to spawn a vanguardDefender, inform false

                if (spawnEnergyCapacity < minCost) return false

                // If there are no related needs

                if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0) return false

                // If max spawnable strength is less that needed

                if (
                    strengthOfParts * (spawnEnergyCapacity / cost) <
                    claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender]
                ) {
                    // Abandon the this for some time

                    Memory.claimRequests[this.memory.claimRequest].abandon = 20000
                    /* Memory.thiss[remoteName].abandoned = 1000 */
                    return false
                }

                const partsMultiplier = Math.max(
                    Math.floor(claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] / strengthOfParts) * 1.2,
                    1,
                )

                // If there is no vanguardDefender need

                if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0) return false

                const role = 'vanguardDefender'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier,
                    minCreeps: 1,
                    minCost,
                    priority: 8 + this.creepsFromRoom.vanguardDefender.length,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    if (this.memory.allyCreepRequest) {
        const allyCreepRequestNeeds = Memory.allyCreepRequests[this.memory.allyCreepRequest].needs

        // Requests for vanguard

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there is no vanguard need

                if (allyCreepRequestNeeds[allyCreepRequestNeedsIndex.allyVanguard] <= 0) return false

                const role = 'allyVanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: allyCreepRequestNeeds[allyCreepRequestNeedsIndex.allyVanguard],
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority: 10 + this.creepsFromRoom.allyVanguard.length,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    for (const roomName of this.memory.attackRequests) {
        const request = Memory.attackRequests[roomName]

        const minCost = 300

        const role = 'antifaAssaulter'

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [],
                    partsMultiplier,
                    minCreeps: 1,
                    minCost,
                    priority: 8 + this.creepsFromRoom.antifaAssaulter.length,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging) customLog('Spawn Request Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2))
}
