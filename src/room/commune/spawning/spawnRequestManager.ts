import {
    AllyCreepRequestData,
    ClaimRequestData,
    CombatRequestData,
    containerUpkeepCost,
    controllerDowngradeUpgraderNeed,
    minHarvestWorkRatio,
    myColors,
    numbersByStructureTypes,
    rampartUpkeepCost,
    RemoteData,
    remoteHarvesterRoles,
    RemoteHarvesterRolesBySourceIndex,
    remoteHaulerRoles,
    roadUpkeepCost,
} from 'international/constants'
import { customLog, findCarryPartsRequired, findLinkThroughput, getRange, getRangeOfCoords } from 'international/utils'
import { internationalManager } from 'international/internationalManager'
import { unpackPosList } from 'other/packrat'
import { globalStatsUpdater } from 'international/statsManager'
const minRemotePriority = 10

Room.prototype.spawnRequester = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

    // Structure info about the this's spawn energy

    const spawnEnergyCapacity = this.energyCapacityAvailable
    const mostOptimalSource = this.sourcesByEfficacy[0]
    const { storage } = this
    const { terminal } = this

    let partsMultiplier: number
    let spawnGroup: string[]
    let role: CreepRoles
    let priority: number
    let minPriority: number
    let maxPriority: number

    // Construct requests for sourceHarvesters

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const sourceIndex = 0
            role = 'source1Harvester'

            const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom[role].length

            if (spawnEnergyCapacity >= 800) {
                let defaultParts: BodyPartConstant[] = [CARRY]
                let workAmount = 6

                // Account for power regenerating sources

                const source = this.sources[sourceIndex]
                const effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
                if (effect) {
                    workAmount += Math.round(
                        POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] /
                            POWER_INFO[PWR_REGEN_SOURCE].period /
                            HARVEST_POWER,
                    )
                }

                for (let i = 1; i <= workAmount; i++) {
                    if (i % 2 === 0) defaultParts.push(MOVE)
                    defaultParts.push(WORK)
                    if (i % 6 === 0) defaultParts.push(CARRY)
                }

                return {
                    role,
                    defaultParts,
                    extraParts: [],
                    partsMultiplier: 1,
                    minCreeps: 1,
                    minCost: 300,
                    priority: 1,
                    memoryAdditions: {
                        SI: sourceIndex,
                        R: true,
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
                        R: true,
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
                        R: true,
                    },
                }
            }

            //Only Spawn one larger creep if we have the ability to mine using one large creep
            if (this.sourceContainers[sourceIndex] && spawnEnergyCapacity >= 650) {
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
                        R: true,
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
                    R: true,
                },
            }
        })(),
    )

    // Construct requests for sourceHarvesters
    if (this.sources.length > 1)
        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                const sourceIndex = 1
                role = 'source2Harvester'

                const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + this.creepsFromRoom[role].length

                if (spawnEnergyCapacity >= 800) {
                    let defaultParts: BodyPartConstant[] = [CARRY]
                    let workAmount = 6

                    // Account for power regenerating sources

                    const source = this.sources[sourceIndex]
                    const effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
                    if (effect) {
                        workAmount += Math.round(
                            POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] /
                                POWER_INFO[PWR_REGEN_SOURCE].period /
                                HARVEST_POWER,
                        )
                    }

                    for (let i = 1; i <= workAmount; i++) {
                        if (i % 2 === 0) defaultParts.push(MOVE)
                        defaultParts.push(WORK)
                        if (i % 6 === 0) defaultParts.push(CARRY)
                    }

                    return {
                        role,
                        defaultParts,
                        extraParts: [],
                        partsMultiplier: 1,
                        minCreeps: 1,
                        minCost: 300,
                        priority: 1,
                        memoryAdditions: {
                            SI: sourceIndex,
                            R: true,
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
                            R: true,
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
                            R: true,
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
                            R: true,
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
                        R: true,
                    },
                }
            })(),
        )

    // Construct requests for haulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            const priority = Math.min(0.5 + this.creepsFromRoom.hauler.length / 2, minRemotePriority - 3)

            // Construct the required carry parts

            partsMultiplier = this.haulerNeed

            role = 'hauler'

            // If all RCL 3 extensions are built

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, CARRY, MOVE],
                    partsMultiplier: partsMultiplier / 2,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 150,
                    maxCostPerCreep: this.memory.MHC,
                    priority,
                    memoryAdditions: {
                        R: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE],
                partsMultiplier,
                minCreeps: undefined,
                maxCreeps: Infinity,
                minCost: 100,
                maxCostPerCreep: this.memory.MHC,
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

            if (this.controller.level < 6) return false

            if (!storage) return false

            if (this.resourcesInStoringStructures.energy < 40000) return false

            // If there is no terminal, inform false

            if (!terminal) return false

            if (terminal.store.getFreeCapacity() <= 10000) return false

            // Get the mineral. If it's out of resources, inform false

            if (this.mineral.mineralAmount === 0) return false

            let minCost = 900

            if (spawnEnergyCapacity < minCost) return false

            role = 'mineralHarvester'

            return {
                role,
                defaultParts: [],
                extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
                partsMultiplier: 4 /* this.get('mineralHarvestPositions')?.length * 4 */,
                minCreeps: 1,
                minCost,
                priority: 10 + this.creepsFromRoom.mineralHarvester.length * 3,
                memoryAdditions: {
                    R: true,
                },
            }
        })(),
    )

    // Construct requests for hubHaulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // If there is no storage, inform false

            if (!storage || this.controller.level < 4) return false

            // Otherwise if there is no hubLink or terminal, inform false

            if (!this.hubLink && (!terminal || this.controller.level < 6)) return false

            role = 'hubHauler'

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

            const fastFillerPositionsCount = this.fastFillerPositions.length
            if (!fastFillerPositionsCount) return false

            let priority = 0.75

            let totalFastFillerEnergy = 0
            if (this.fastFillerContainerLeft) totalFastFillerEnergy += this.fastFillerContainerLeft.store.energy
            if (this.fastFillerContainerRight) totalFastFillerEnergy += this.fastFillerContainerRight.store.energy

            if (totalFastFillerEnergy < 300) priority = 1.25

            let defaultParts: BodyPartConstant[]
            if (this.controller.level >= 8) defaultParts = [CARRY, MOVE, CARRY, CARRY, CARRY, CARRY]
            else if (this.controller.level >= 7) defaultParts = [CARRY, MOVE, CARRY, CARRY]
            else defaultParts = [CARRY, MOVE, CARRY]

            role = 'fastFiller'

            return {
                role,
                defaultParts,
                extraParts: [],
                partsMultiplier: 1,
                minCreeps: fastFillerPositionsCount,
                minCost: 150,
                priority,
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

    for (const enemyCreep of this.enemyAttackers) {
        attackStrength += enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged
        healStrength += enemyCreep.combatStrength.heal
    }

    // Construct requests for meleeDefenders

    if (this.towerInferiority) {
        // Defenders

        minPriority = 6
        maxPriority = minRemotePriority - 1

        // Melee defender

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'meleeDefender'

                if (this.myCreeps[role].length * 1.75 > enemyAttackers.length) return false

                // If towers, spawn based on healStrength. If no towers, use attackStrength and healStrength

                let requiredStrength = 1
                if (!this.controller.safeMode) {
                    requiredStrength += healStrength
                    if (!this.structures.tower.length) requiredStrength += attackStrength
                }

                requiredStrength *= 1.5

                const priority = Math.min(minPriority + this.myCreeps[role].length * 0.5, maxPriority)

                // If all RCL 3 extensions are build

                if (spawnEnergyCapacity >= 800) {
                    const extraParts = [ATTACK, ATTACK, MOVE]
                    const strength = ATTACK_POWER * 2

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: Math.max(requiredStrength / strength / 2, 1),
                        minCost: 210,
                        priority,
                        memoryAdditions: {},
                    }
                }

                const extraParts = [ATTACK, MOVE]
                const strength = ATTACK_POWER

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: Math.max(requiredStrength / strength, 1),
                    minCost: 260,
                    priority,
                    memoryAdditions: {},
                }
            })(),
        )

        // Ranged defender

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'rangedDefender'

                if (this.myCreeps[role].length * 1.75 > enemyAttackers.length) return false

                // If towers, spawn based on healStrength. If no towers, use attackStrength and healStrength

                let requiredStrength = 1
                if (!this.controller.safeMode) {
                    requiredStrength += healStrength
                    if (!this.structures.tower.length) requiredStrength += attackStrength
                }

                const priority = Math.min(minPriority + 0.1 + this.myCreeps[role].length * 0.75, maxPriority)

                // If all RCL 3 extensions are build

                if (spawnEnergyCapacity >= 800) {
                    const extraParts = [RANGED_ATTACK, RANGED_ATTACK, MOVE]
                    const strength = RANGED_ATTACK_POWER * 2

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: Math.max(requiredStrength / strength / 2, 1),
                        minCost: 210,
                        priority,
                        memoryAdditions: {},
                    }
                }

                const extraParts = [RANGED_ATTACK, MOVE]
                const strength = RANGED_ATTACK_POWER

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: Math.max(requiredStrength / strength, 1),
                    minCost: 260,
                    priority,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    // Get the estimates income

    const estimatedIncome = this.estimateIncome()

    // Construct requests for builders

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            if (this.towerInferiority) return false

            // Stop if there are no construction sites

            if (!this.find(FIND_MY_CONSTRUCTION_SITES).length) return false

            let priority = 8
            partsMultiplier = 0

            // If there is an active storage

            if (storage && this.controller.level >= 4) {
                // If the storage is sufficiently full, provide x amount per y enemy in storage

                if (this.resourcesInStoringStructures.energy < this.communeManager.storedEnergyBuildThreshold)
                    return false

                partsMultiplier += Math.pow(
                    this.resourcesInStoringStructures.energy / (15000 + this.controller.level * 1000),
                    2,
                )
            }

            // Otherwise if there is no storage
            else {
                partsMultiplier += estimatedIncome / 5

                // Spawn some extra builders to handle the primarily road building RCL 3 and needy storage building

                if (spawnEnergyCapacity >= 800) partsMultiplier *= 1.2
            }

            role = 'builder'

            // If there is a storage or terminal

            if (storage || terminal) {
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
                        R: true,
                    },
                }
            }

            // If all RCL 3 extensions are build

            if (spawnEnergyCapacity >= 800) {
                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, WORK, MOVE],
                    partsMultiplier: partsMultiplier,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        R: true,
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
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority,
                    memoryAdditions: {
                        R: true,
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
                    R: true,
                },
            }
        })(),
    )

    // Construct requests for maintainer

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            minPriority = 6
            maxPriority = minRemotePriority - 0.5

            priority = Math.min(minPriority + this.creepsFromRoom.maintainer.length * 0.5, maxPriority)

            // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

            let repairTargets: Structure<BuildableStructureConstant>[] = this.structures.road
            repairTargets = repairTargets.concat(this.structures.container)

            repairTargets = repairTargets.filter(structure => structure.hitsMax * 0.2 >= structure.hits)
            // Get ramparts below their max hits

            const ramparts = this.structures.rampart.filter(
                rampart => rampart.hits < this.communeManager.minRampartHits,
            )

            // If there are no ramparts or repair targets

            if (!ramparts.length && !repairTargets.length) return false

            // Construct the partsMultiplier

            partsMultiplier = 1

            // For each road, add a multiplier

            partsMultiplier += this.structures.road.length * roadUpkeepCost * 2

            // For each container, add a multiplier

            partsMultiplier += this.structures.container.length * containerUpkeepCost * 2

            // For each rampart, add a multiplier

            partsMultiplier += ramparts.length * rampartUpkeepCost * 1.2

            // For every attackValue, add a multiplier

            partsMultiplier += attackStrength / (REPAIR_POWER / 3)

            // For every x energy in storage, add 1 multiplier

            if (storage && this.controller.level >= 4 && ramparts.length)
                partsMultiplier += Math.pow(
                    this.resourcesInStoringStructures.energy / (16000 + this.controller.level * 1000),
                    2,
                )

            role = 'maintainer'

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
                        R: true,
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
            partsMultiplier = 1
            let maxCreeps = this.upgradePositions.length - 1
            const priority = 8

            // If there are enemyAttackers and the controller isn't soon to downgrade

            if (this.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed && this.towerInferiority)
                return false

            // If the controllerContainer have not enough energy in it, don't spawn a new upgrader

            if (this.controllerContainer) {
                if (
                    this.controllerContainer.store.getUsedCapacity(RESOURCE_ENERGY) < 1000 &&
                    this.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed
                ) {
                    return false
                }

                if (
                    this.controllerContainer.store.getUsedCapacity(RESOURCE_ENERGY) > 1500 &&
                    this.fastFillerContainerLeft &&
                    this.fastFillerContainerLeft.store.getUsedCapacity(RESOURCE_ENERGY) > 1000 &&
                    this.fastFillerContainerRight &&
                    this.fastFillerContainerRight.store.getUsedCapacity(RESOURCE_ENERGY) > 1000
                )
                    partsMultiplier += estimatedIncome * 1.25
                else partsMultiplier += estimatedIncome * 0.75
            }

            // If there is a storage
            if (storage && this.controller.level >= 4) {
                // If the storage is sufficiently full, provide x amount per y energy in storage

                if (this.resourcesInStoringStructures.energy >= this.communeManager.storedEnergyUpgradeThreshold)
                    partsMultiplier = Math.pow(
                        this.resourcesInStoringStructures.energy / (8000 + this.controller.level * 1000),
                        2,
                    )
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

            if (controllerLink && controllerLink.RCLActionable) {
                maxCreeps -= 1

                const hubLink = this.hubLink
                const sourceLinks = this.sourceLinks

                // If there are transfer links, max out partMultiplier to their ability

                if (
                    (storage && hubLink && hubLink.RCLActionable) ||
                    sourceLinks.find(link => link && link.RCLActionable)
                ) {
                    let maxPartsMultiplier = 0

                    if (hubLink && hubLink.RCLActionable) {
                        // Get the range between the controllerLink and hubLink

                        const range = getRangeOfCoords(controllerLink.pos, hubLink.pos)

                        // Limit partsMultiplier at the range with a multiplier

                        maxPartsMultiplier += findLinkThroughput(range) * 0.7
                    }

                    for (let i = 0; i < sourceLinks.length; i++) {
                        const sourceLink = sourceLinks[i]

                        if (!sourceLink.RCLActionable) continue

                        // Get the range between the controllerLink and hubLink

                        const range = getRangeOfCoords(sourceLink.pos, controllerLink.pos)

                        // Limit partsMultiplier at the range with a multiplier

                        maxPartsMultiplier += findLinkThroughput(range, this.estimatedSourceIncome[i]) * 0.7
                    }

                    partsMultiplier = Math.min(partsMultiplier, maxPartsMultiplier)
                }
            }

            // If there are construction sites of my ownership in the this, set multiplier to 1

            if (this.find(FIND_MY_CONSTRUCTION_SITES).length) {
                if (!this.controllerContainer && !this.controllerLink) {
                    partsMultiplier = 0
                } else partsMultiplier = partsMultiplier * 0.25
            }

            const threshold = 0.05
            role = 'controllerUpgrader'

            // If the controllerContainer or controllerLink exists

            if (this.controllerContainer || controllerLink) {
                // If the controller is level 8

                if (this.controller.level === 8) {
                    let extraParts: BodyPartConstant[]

                    // If the controller is near to downgrading

                    if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                        extraParts = [CARRY, WORK, MOVE]
                    else if (partsMultiplier === 0) return false
                    else
                        extraParts = [
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
                        ]

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        threshold,
                        minCreeps: 1,
                        minCost: 300,
                        priority,
                        memoryAdditions: {
                            R: true,
                        },
                    }
                }

                if (spawnEnergyCapacity >= 1000) {
                    // If the controller is near to downgrading, set partsMultiplier to x

                    if (this.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                        partsMultiplier = Math.max(partsMultiplier, 4)

                    partsMultiplier = Math.round(partsMultiplier / 4)
                    if (partsMultiplier === 0) return false

                    return {
                        role,
                        defaultParts: [CARRY, CARRY],
                        extraParts: [WORK, MOVE, WORK, WORK, WORK],
                        partsMultiplier,
                        threshold,
                        minCreeps: undefined,
                        maxCreeps,
                        minCost: 250,
                        priority,
                        memoryAdditions: {
                            R: true,
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
                        defaultParts: [CARRY, CARRY],
                        extraParts: [WORK, MOVE, WORK, WORK, WORK, WORK, MOVE, WORK],
                        partsMultiplier,
                        threshold,
                        minCreeps: undefined,
                        maxCreeps,
                        minCost: 250,
                        priority,
                        memoryAdditions: {
                            R: true,
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
                        R: true,
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
                    maxCreeps,
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                        R: true,
                    },
                }
            }

            return {
                role,
                defaultParts: [],
                extraParts: [MOVE, CARRY, MOVE, WORK],
                partsMultiplier,
                threshold,
                maxCreeps,
                minCost: 250,
                priority,
                memoryAdditions: {},
            }
        })(),
    )

    for (const remoteInfo of this.remoteSourceIndexesByEfficacy) {
        if (Memory.stats.cpu.usage / Game.cpu.limit > 0.95) break
        const splitRemoteInfo = remoteInfo.split(' ')
        const remoteName = splitRemoteInfo[0]
        const sourceIndex = parseInt(splitRemoteInfo[1]) as 0 | 1

        const remoteMemory = Memory.rooms[remoteName]
        const remoteData = Memory.rooms[remoteName].data
        const remote = Game.rooms[remoteName]
        const priority = minRemotePriority + 1 + remoteMemory.SPs[sourceIndex].length / 100

        role = RemoteHarvesterRolesBySourceIndex[sourceIndex] as 'remoteSourceHarvester0' | 'remoteSourceHarvester1'

        // If there are no data for this this, inform false

        if (remoteData[RemoteData[role]] <= 0) continue

        const sourcePositionsAmount = remote
            ? remote.sourcePositions.length
            : unpackPosList(remoteMemory.SP[sourceIndex]).length

        // Construct requests for remoteSourceHarvester0s

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                if (spawnEnergyCapacity >= 950) {
                    return {
                        role,
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE],
                        partsMultiplier: remoteData[RemoteData[role]],
                        spawnGroup: this.creepsOfRemote[remoteName][role],
                        threshold: 0.1,
                        minCreeps: 1,
                        maxCreeps: sourcePositionsAmount,
                        maxCostPerCreep: 50 + 150 * 6,
                        minCost: 200,
                        priority: priority,
                        memoryAdditions: {
                            R: true,
                            SI: sourceIndex,
                            RN: remoteName,
                        },
                    }
                }

                return {
                    role,
                    defaultParts: [CARRY],
                    extraParts: [WORK, WORK, MOVE],
                    partsMultiplier: remoteData[RemoteData[role]],
                    spawnGroup: this.creepsOfRemote[remoteName][role],
                    threshold: 0.1,
                    minCreeps: undefined,
                    maxCreeps: sourcePositionsAmount,
                    maxCostPerCreep: 50 + 250 * 3,
                    minCost: 300,
                    priority: priority,
                    memoryAdditions: {
                        R: true,
                        SI: sourceIndex,
                        RN: remoteName,
                    },
                }
            })(),
        )
    }

    let remoteHaulerNeed = 0

    const remoteNamesByEfficacy = this.remoteNamesBySourceEfficacy

    for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
        if (Memory.stats.cpu.usage / Game.cpu.limit > 0.95) break
        const remoteName = remoteNamesByEfficacy[index]
        const remoteData = Memory.rooms[remoteName].data

        // Add up econ data for this this

        const totalRemoteNeed =
            Math.max(remoteData[RemoteData.remoteHauler0], 0) +
            Math.max(remoteData[RemoteData.remoteHauler1], 0) +
            Math.max(remoteData[RemoteData.remoteReserver], 0) +
            Math.max(remoteData[RemoteData.remoteCoreAttacker], 0) +
            Math.max(remoteData[RemoteData.remoteDismantler], 0) +
            Math.max(remoteData[RemoteData.minDamage], 0) +
            Math.max(remoteData[RemoteData.minHeal], 0)

        const remoteMemory = Memory.rooms[remoteName]

        if (!remoteMemory.data[RemoteData.enemyReserved] && !remoteMemory.data[RemoteData.abandon]) {
            const remote = Game.rooms[remoteName]
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // Loop through each index of sourceEfficacies

            for (let index = 0; index < remoteMemory.SIDs.length; index += 1) {
                // Get the income based on the reservation of the this and remoteHarvester need
                // Multiply remote harvester need by 1.6~ to get 3 to 5 and 6 to 10, converting work part need to income expectation

                const income = Math.max(
                    (isReserved ? 10 : 5) -
                        Math.floor(
                            Math.max(remoteMemory.data[RemoteData[remoteHarvesterRoles[index]]], 0) *
                                minHarvestWorkRatio,
                        ),
                    0,
                )

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteHaulerNeed += findCarryPartsRequired(remoteMemory.SPs[index].length, income)
            }
        }

        // If there is a need for any econ creep, inform the index

        if (totalRemoteNeed <= 0) continue

        // Construct requests for remoteReservers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are insufficient harvesters for the remote's sources

                if (
                    Math.max(remoteData[RemoteData.remoteSourceHarvester0], 0) +
                        Math.max(remoteData[RemoteData.remoteSourceHarvester1], 0) >
                    0
                )
                    return false

                let cost = 650

                // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

                if (spawnEnergyCapacity < cost) return false

                // If there are no data for this this, inform false

                if (remoteData[RemoteData.remoteReserver] <= 0) return false

                role = 'remoteReserver'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [MOVE, CLAIM],
                    partsMultiplier: 6,
                    spawnGroup: this.creepsOfRemote[remoteName].remoteReserver,
                    minCreeps: 1,
                    maxCreeps: Infinity,
                    minCost: cost,
                    priority: minRemotePriority + 1,
                    memoryAdditions: {
                        RN: remoteName,
                    },
                }
            })(),
        )

        // Construct requests for remoteDefenders

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no related data

                if (remoteData[RemoteData.minDamage] + remoteData[RemoteData.minHeal] <= 0) return false

                let minRangedAttackCost = 0

                if (remoteData[RemoteData.minDamage] > 0) {
                    minRangedAttackCost =
                        (remoteData[RemoteData.minDamage] / RANGED_ATTACK_POWER) * BODYPART_COST[RANGED_ATTACK] +
                        (remoteData[RemoteData.minDamage] / RANGED_ATTACK_POWER) * BODYPART_COST[MOVE]
                }

                const rangedAttackAmount = minRangedAttackCost / (BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE])

                let minHealCost = 0

                if (remoteData[RemoteData.minHeal] > 0) {
                    minHealCost =
                        (remoteData[RemoteData.minHeal] / HEAL_POWER) * BODYPART_COST[HEAL] +
                        (remoteData[RemoteData.minHeal] / HEAL_POWER) * BODYPART_COST[MOVE]
                }

                const healAmount = minHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE])

                if ((rangedAttackAmount + healAmount) * 2 > 50) {
                    Memory.rooms[remoteName].data[RemoteData.abandon] = 1500
                    return false
                }

                const minCost = minRangedAttackCost + minHealCost
                if (minCost > spawnEnergyCapacity) {
                    Memory.rooms[remoteName].data[RemoteData.abandon] = 1500
                    return false
                }

                role = 'remoteDefender'
                const extraParts: BodyPartConstant[] = []

                for (let i = 0; i < rangedAttackAmount + healAmount - 1; i++) {
                    extraParts.push(MOVE)
                }

                for (let i = 0; i < rangedAttackAmount; i++) {
                    extraParts.push(RANGED_ATTACK)
                }

                for (let i = 0; i < healAmount; i++) {
                    extraParts.push(HEAL)
                }

                extraParts.push(MOVE)

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 1,
                    spawnGroup: this.creepsOfRemote[remoteName].remoteDefender,
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
                // If there are no related data

                if (remoteData[RemoteData.remoteCoreAttacker] <= 0) return false

                // Define the minCost and strength

                const cost = 130
                const extraParts = [ATTACK, MOVE]
                const minCost = cost * extraParts.length

                role = 'remoteCoreAttacker'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 50 / extraParts.length,
                    spawnGroup: this.creepsOfRemote[remoteName].remoteCoreAttacker,
                    minCreeps: 1,
                    minCost,
                    priority: minRemotePriority - 2,
                    memoryAdditions: {
                        RN: remoteName,
                    },
                }
            })(),
        )

        // Construct requests for remoteDismantler

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are no related data

                if (remoteData[RemoteData.remoteDismantler] <= 0) return false

                // Define the minCost and strength

                const cost = 150
                const extraParts = [WORK, MOVE]

                role = 'remoteDismantler'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 50 / extraParts.length,
                    spawnGroup: this.creepsOfRemote[remoteName].remoteDismantler,
                    minCreeps: 1,
                    minCost: cost * 2,
                    priority: minRemotePriority - 1,
                    memoryAdditions: {
                        RN: remoteName,
                    },
                }
            })(),
        )
    }

    // Construct requests for remoteHaulers

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            if (remoteHaulerNeed === 0) return false

            partsMultiplier = remoteHaulerNeed

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
                         maxCostPerCreep: this.memory.MHC,
                         priority: minRemotePriority - 0.2,
                         memoryAdditions: {
                              role: 'remoteHauler',
                              R: true,
                         },
                    }
               }
 */

            role = 'remoteHauler'

            return {
                role,
                defaultParts: [],
                extraParts: [CARRY, MOVE],
                threshold: 0.1,
                partsMultiplier,
                minCost: 100,
                maxCostPerCreep: this.memory.MHC,
                priority: minRemotePriority,
                memoryAdditions: {},
            }
        })(),
    )

    // Construct requests for scouts

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            role = 'scout'

            let minCreeps: number
            if (this.structures.observer.length) minCreeps = 1
            else minCreeps = 2

            return {
                role,
                defaultParts: [],
                extraParts: [MOVE],
                partsMultiplier: 1,
                minCreeps,
                minCost: 50,
                priority: 5,
                memoryAdditions: {},
            }
        })(),
    )

    if (this.memory.claimRequest) {
        const requestName = this.memory.claimRequest
        const request = Memory.claimRequests[requestName]

        // Construct requests for claimers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                if (!request.data[ClaimRequestData.claimer]) return false
                if (request.data[ClaimRequestData.claimer] <= 0) return false

                role = 'claimer'

                return {
                    role,
                    defaultParts: [CLAIM, MOVE],
                    extraParts: [MOVE, MOVE, MOVE, MOVE],
                    partsMultiplier: 1,
                    minCreeps: 1,
                    minCost: 650,
                    priority: 8.1,
                    memoryAdditions: {
                        TRN: requestName,
                    },
                }
            })(),
        )

        // Requests for vanguard

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                if (!request.data[ClaimRequestData.vanguard]) return false
                if (request.data[ClaimRequestData.vanguard] <= 0) return false

                role = 'vanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: request.data[ClaimRequestData.vanguard],
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority: 8.2 + this.creepsFromRoom.vanguard.length,
                    memoryAdditions: {
                        TRN: requestName,
                    },
                }
            })(),
        )
    }

    if (this.memory.allyCreepRequest) {
        const allyCreepRequestNeeds = Memory.allyCreepRequests[this.memory.allyCreepRequest].data

        // Requests for vanguard

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there is no vanguard need

                if (allyCreepRequestNeeds[AllyCreepRequestData.allyVanguard] <= 0) return false

                role = 'allyVanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: allyCreepRequestNeeds[AllyCreepRequestData.allyVanguard],
                    minCost: 250,
                    priority: 10 + this.creepsFromRoom.allyVanguard.length,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    for (const requestName of this.memory.haulRequests) {
        const request = Memory.haulRequests[requestName]
        if (!request) continue

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                const priority = Math.min(0.5 + this.creepsFromRoom.requestHauler.length / 2, minRemotePriority - 3)

                // Construct the required carry parts

                partsMultiplier = 100

                role = 'requestHauler'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE],
                    partsMultiplier,
                    minCost: 100,
                    maxCostPerCreep: this.memory.MHC,
                    priority,
                    memoryAdditions: {
                        HRN: requestName,
                    },
                }
            })(),
        )
    }

    for (let i = this.memory.combatRequests.length - 1; i >= 0; i -= 1) {
        const requestName = Memory.rooms[this.name].combatRequests[i]
        const request = Memory.combatRequests[requestName]
        if (!request) continue

        if (request.data[CombatRequestData.abandon] > 0) continue

        const minRangedAttackCost = this.communeManager.findMinRangedAttackCost(
            request.data[CombatRequestData.minDamage],
        )
        const rangedAttackAmount = minRangedAttackCost / (BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE])

        const minAttackCost = this.communeManager.findMinMeleeAttackCost(request.data[CombatRequestData.minDamage] + (request.data[CombatRequestData.maxTowerDamage] || 0))
        const attackAmount = minAttackCost / (BODYPART_COST[ATTACK] + BODYPART_COST[MOVE])

        const minMeleeHealCost = this.communeManager.findMinMeleeHealCost(request.data[CombatRequestData.minMeleeHeal] + (request.data[CombatRequestData.maxTowerDamage] || 0))
        const meleeHealAmount = minMeleeHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE])

        const minRangedHealCost = this.communeManager.findMinRangedHealCost(
            request.data[CombatRequestData.minRangedHeal],
        )
        const rangedHealAmount = minRangedHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE])

        const minDismantleCost =
            request.data[CombatRequestData.dismantle] * BODYPART_COST[WORK] +
                request.data[CombatRequestData.dismantle] * BODYPART_COST[MOVE] || 0

        if (request.T === 'attack' || request.T === 'defend') {

            if (
                minRangedAttackCost + minRangedHealCost > this.energyCapacityAvailable ||
                minAttackCost > this.energyCapacityAvailable
            ) {
                this.communeManager.deleteCombatRequest(requestName, i)
                continue
            }

            // Spawn quad

            this.constructSpawnRequests(
                ((): SpawnRequestOpts | false => {
                    role = 'antifaRangedAttacker'
                    spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                    const minCost = minRangedAttackCost + minRangedHealCost
                    const extraParts: BodyPartConstant[] = []

                    for (let i = 0; i < rangedAttackAmount; i++) {
                        extraParts.push(RANGED_ATTACK)
                    }

                    for (let i = 0; i < rangedAttackAmount + rangedHealAmount - 1; i++) {
                        extraParts.push(MOVE)
                    }

                    for (let i = 0; i < rangedHealAmount; i++) {
                        extraParts.push(HEAL)
                    }

                    extraParts.push(MOVE)

                    if (!extraParts.length) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        minCost,
                        priority: 8,
                        spawnGroup,
                        minCreeps: request.data[CombatRequestData.quadCount] * 4,
                        memoryAdditions: {
                            CRN: requestName,
                            SS: 4,
                            ST: 'rangedAttack',
                        },
                    }
                })(),
            )
            continue
        }

        if (
            minRangedAttackCost + minRangedHealCost > this.energyCapacityAvailable ||
            minAttackCost + minMeleeHealCost > this.energyCapacityAvailable ||
            minAttackCost > this.energyCapacityAvailable
        ) {
            this.communeManager.deleteCombatRequest(requestName, i)
            continue
        }

        // If the request isn't an attack
        // Spawn RangedAttack Heal singletons

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'antifaRangedAttacker'
                spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                const minCost = minRangedAttackCost + minRangedHealCost
                const extraParts: BodyPartConstant[] = []

                for (let i = 0; i < rangedAttackAmount; i++) {
                    extraParts.push(RANGED_ATTACK)
                }

                for (let i = 0; i < rangedAttackAmount + rangedHealAmount - 1; i++) {
                    extraParts.push(MOVE)
                }

                for (let i = 0; i < rangedHealAmount; i++) {
                    extraParts.push(HEAL)
                }

                extraParts.push(MOVE)

                if (!extraParts.length) return false

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 1,
                    minCost,
                    priority: 8,
                    spawnGroup,
                    memoryAdditions: {
                        CRN: requestName,
                    },
                }
            })(),
        )

        // Spawn dismantlers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'antifaDismantler'
                spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                const minCost = minDismantleCost
                let extraParts: BodyPartConstant[] = []

                const workAmount = request.data[CombatRequestData.dismantle]

                for (let i = 0; i < workAmount; i++) {
                    extraParts.push(WORK)
                }

                for (let i = 0; i < workAmount; i++) {
                    extraParts.push(MOVE)
                }

                if (!extraParts.length) return false

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 1,
                    minCost,
                    priority: 8,
                    spawnGroup,
                    memoryAdditions: {
                        CRN: requestName,
                    },
                }
            })(),
        )

        // Spawn Attack Heal duo

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'antifaAttacker'
                spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                const minCost = minAttackCost
                let extraParts: BodyPartConstant[] = []

                for (let i = 0; i < Math.ceil(attackAmount / 2); i++) {
                    extraParts.push(ATTACK)
                }

                for (let i = 0; i < attackAmount - 1; i++) {
                    extraParts.push(MOVE)
                }

                for (let i = 0; i < Math.ceil(attackAmount / 2); i++) {
                    extraParts.push(ATTACK)
                }

                extraParts.push(MOVE)

                if (!extraParts.length) return false

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 1,
                    minCost,
                    priority: 8,
                    spawnGroup,
                    memoryAdditions: {
                        SS: 2,
                        ST: 'attack',
                        CRN: requestName,
                    },
                }
            })(),
        )

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                role = 'antifaHealer'
                spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                const minCost = minMeleeHealCost
                let extraParts: BodyPartConstant[] = []

                for (let i = 0; i < meleeHealAmount - 1; i++) {
                    extraParts.push(MOVE)
                }

                for (let i = 0; i < meleeHealAmount; i++) {
                    extraParts.push(HEAL)
                }

                extraParts.push(MOVE)

                if (!extraParts.length) return false

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 1,
                    minCost,
                    priority: 8,
                    spawnGroup,
                    memoryAdditions: {
                        SS: 2,
                        ST: 'attack',
                        CRN: requestName,
                    },
                }
            })(),
        )
    }

    this.spawnRequests.sort((a, b) => {
        return a.priority - b.priority
    })

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging === true) {
        const cpuUsed = Game.cpu.getUsed() - managerCPUStart
        customLog('Spawn Request Manager', cpuUsed.toFixed(2), {
            textColor: myColors.white,
            bgColor: myColors.lightBlue,
        })
        const statName: RoomCommuneStatNames = 'srmcu'
        globalStatsUpdater(this.name, statName, cpuUsed)
    }
}
