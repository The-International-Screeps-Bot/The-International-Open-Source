import {
    AllyCreepRequestData,
    ClaimRequestData,
    CombatRequestData,
    containerUpkeepCost,
    controllerDowngradeUpgraderNeed,
    minHarvestWorkRatio,
    customColors,
    numbersByStructureTypes,
    rampartUpkeepCost,
    RemoteData,
    remoteHarvesterRoles,
    RemoteHarvesterRolesBySourceIndex,
    remoteHaulerRoles,
    roadUpkeepCost,
    packedPosLength,
} from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findLinkThroughput,
    getRange,
    getRangeOfCoords,
    randomRange,
} from 'international/utils'
import { internationalManager } from 'international/international'
import { unpackPosList } from 'other/codec'
import { globalStatsUpdater } from 'international/statsManager'
import { CommuneManager } from '../commune'

export class SpawnRequestsManager {
    communeManager: CommuneManager

    rawSpawnRequestsArgs: (SpawnRequestArgs | false)[]
    spawnEnergyCapacity: number
    minRemotePriority = 9
    remoteHaulerNeed: number

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        this.rawSpawnRequestsArgs = []
        this.spawnEnergyCapacity = this.communeManager.room.energyCapacityAvailable

        this.sourceHarvester()
        this.hauler()
        this.mineralHarvester()
        this.hubHauler()
        this.fastFiller()
        this.defenders()
        this.maintainers()
        this.builders()
        this.controllerUpgraders()
        this.remoteSourceHarvesters()
        this.generalRemoteRoles()
        this.remoteHaulers()
        this.scout()
        this.claimRequestRoles()
        this.allyVanguard()
        this.requestHauler()
        this.antifa()

        this.communeManager.room.spawnRequestsArgs = this.rawSpawnRequestsArgs.filter(
            args => args,
        ) as SpawnRequestArgs[]

        // Sort in descending priority

        this.communeManager.room.spawnRequestsArgs.sort((a, b) => {
            return a.priority - b.priority
        })
    }

    private sourceHarvester() {
        const mostOptimalSource = this.communeManager.room.sourcesByEfficacy[0]

        for (let sourceIndex = 0; sourceIndex < this.communeManager.room.sources.length; sourceIndex++) {
            // Construct requests for sourceHarvesters

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    const role = 'sourceHarvester'

                    const spawnGroup = this.communeManager.room.creepsOfSource[sourceIndex]

                    const priority = (mostOptimalSource.index === sourceIndex ? 0 : 1) + spawnGroup.length

                    if (this.spawnEnergyCapacity >= 800) {
                        let defaultParts: BodyPartConstant[] = [CARRY]
                        let workAmount = 6

                        // Account for power regenerating sources

                        const source = this.communeManager.room.sources[sourceIndex]
                        const effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
                        if (effect) {
                            workAmount += Math.round(
                                POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] /
                                    POWER_INFO[PWR_REGEN_SOURCE].period /
                                    HARVEST_POWER,
                            )
                        }

                        if (workAmount % 2 !== 0) defaultParts.push(MOVE)

                        for (let i = 1; i <= workAmount; i++) {
                            if (i % 2 === 0) defaultParts.push(MOVE)
                            defaultParts.push(WORK)
                            if (i % 5 === 0) defaultParts.push(CARRY)
                        }

                        return {
                            role,
                            defaultParts,
                            extraParts: [],
                            partsMultiplier: 1,
                            minCreeps: 1,
                            minCost: 300,
                            priority,
                            spawnGroup: spawnGroup,
                            memoryAdditions: {
                                SI: sourceIndex,
                                R: true,
                            },
                        }
                    }

                    if (this.spawnEnergyCapacity >= 750) {
                        return {
                            role,
                            defaultParts: [],
                            extraParts: [WORK, MOVE, WORK],
                            partsMultiplier: 3,
                            minCreeps: 1,
                            minCost: 200,
                            priority,
                            spawnGroup: spawnGroup,
                            memoryAdditions: {
                                SI: sourceIndex,
                                R: true,
                            },
                        }
                    }

                    if (this.spawnEnergyCapacity >= 600) {
                        return {
                            role,
                            defaultParts: [MOVE, CARRY],
                            extraParts: [WORK],
                            partsMultiplier: 6,
                            minCreeps: 1,
                            minCost: 300,
                            priority,
                            spawnGroup: spawnGroup,
                            memoryAdditions: {
                                SI: sourceIndex,
                                R: true,
                            },
                        }
                    }

                    //Only Spawn one larger creep if we have the ability to mine using one large creep
                    if (this.communeManager.room.sourceContainers[sourceIndex] && this.spawnEnergyCapacity >= 650) {
                        return {
                            role,
                            defaultParts: [MOVE],
                            extraParts: [WORK],
                            partsMultiplier: 6,
                            minCreeps: 1,
                            minCost: 150,
                            priority,
                            spawnGroup: spawnGroup,
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
                        maxCreeps: Math.min(3, this.communeManager.room.sourcePositions[sourceIndex].length),
                        minCost: 200,
                        priority,
                        spawnGroup: spawnGroup,
                        memoryAdditions: {
                            SI: sourceIndex,
                            R: true,
                        },
                    }
                })(),
            )
        }
    }

    private hauler() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                const priority = Math.min(
                    0.5 + this.communeManager.room.creepsFromRoom.hauler.length / 2,
                    this.minRemotePriority - 2,
                )

                // Construct the required carry parts

                const partsMultiplier = this.communeManager.room.haulerNeed

                const role = 'hauler'

                // If all RCL 3 extensions are built

                if (this.spawnEnergyCapacity >= 800) {
                    return {
                        role,
                        defaultParts: [],
                        extraParts: [CARRY, CARRY, MOVE],
                        partsMultiplier: partsMultiplier / 2,
                        minCost: 150,
                        maxCostPerCreep: this.communeManager.room.memory.MHC,
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
                    minCost: 100,
                    maxCostPerCreep: this.communeManager.room.memory.MHC,
                    priority,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    private mineralHarvester() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                if (this.communeManager.room.controller.level < 6) return false
                if (!this.communeManager.room.structures.extractor.length) return false
                if (!this.communeManager.room.mineralContainer) return false
                if (!this.communeManager.room.storage) return false
                if (this.communeManager.room.resourcesInStoringStructures.energy < 40000) return false
                if (!this.communeManager.room.terminal) return false
                if (this.communeManager.room.terminal.store.getFreeCapacity() <= 10000) return false
                if (this.communeManager.room.mineral.mineralAmount === 0) return false

                const minCost = 900
                if (this.spawnEnergyCapacity < minCost) return false

                return {
                    role: 'mineralHarvester',
                    defaultParts: [],
                    extraParts: [
                        MOVE,
                        MOVE,
                        WORK,
                        WORK,
                        WORK,
                        WORK,
                        WORK,
                        WORK,
                        WORK,
                        WORK,
                    ] /* [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK] */,
                    partsMultiplier: /* 4 */ 5,
                    minCreeps: 1,
                    minCost,
                    priority: 10 + this.communeManager.room.creepsFromRoom.mineralHarvester.length * 3,
                    memoryAdditions: {
                        R: true,
                    },
                }
            })(),
        )
    }

    private hubHauler() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                if (this.communeManager.room.controller.level < 5) return false
                if (!this.communeManager.room.storage) return false

                // There is no hubLink and another link, or no terminal

                if (
                    (!this.communeManager.room.hubLink || this.communeManager.room.structures.link.length < 2) &&
                    (!this.communeManager.room.terminal || !this.communeManager.room.terminal.RCLActionable)
                )
                    return false

                return {
                    role: 'hubHauler',
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
    }

    private fastFiller() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                // Get the fastFiller positions, if there are none, inform false

                const fastFillerPositionsCount = this.communeManager.room.fastFillerPositions.length
                if (!fastFillerPositionsCount) return false

                let priority = 0.75

                let totalFastFillerEnergy = 0
                if (this.communeManager.room.fastFillerContainerLeft)
                    totalFastFillerEnergy += this.communeManager.room.fastFillerContainerLeft.store.energy
                if (this.communeManager.room.fastFillerContainerRight)
                    totalFastFillerEnergy += this.communeManager.room.fastFillerContainerRight.store.energy

                if (totalFastFillerEnergy < 1000) priority = 1.25

                let defaultParts: BodyPartConstant[]
                if (this.communeManager.room.controller.level >= 8)
                    defaultParts = [CARRY, MOVE, CARRY, CARRY, CARRY, CARRY]
                else if (this.communeManager.room.controller.level >= 7) defaultParts = [CARRY, MOVE, CARRY, CARRY]
                else defaultParts = [CARRY, MOVE, CARRY]

                return {
                    role: 'fastFiller',
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
    }

    private defenders() {
        const { enemyAttackers } = this.communeManager.room

        // Construct requests for meleeDefenders

        if (this.communeManager.room.towerInferiority) {
            // Defenders

            const minPriority = 6
            const maxPriority = this.minRemotePriority - 1

            // Melee defender

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    const role = 'meleeDefender'

                    if (this.communeManager.room.myCreeps[role].length * 1.75 > enemyAttackers.length) return false

                    // If towers, spawn based on healStrength. If no towers, use attackStrength and healStrength

                    let requiredStrength = 1
                    if (!this.communeManager.room.controller.safeMode) {
                        requiredStrength += this.communeManager.room.totalEnemyCombatStrength.heal
                        if (!this.communeManager.room.structures.tower.length)
                            requiredStrength +=
                                this.communeManager.room.totalEnemyCombatStrength.melee +
                                this.communeManager.room.totalEnemyCombatStrength.ranged
                    }

                    requiredStrength *= 1.5

                    const priority = Math.min(
                        minPriority + this.communeManager.room.myCreeps[role].length * 0.5,
                        maxPriority,
                    )

                    // If all RCL 3 extensions are build

                    if (this.spawnEnergyCapacity >= 800) {
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

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    const role = 'rangedDefender'

                    if (this.communeManager.room.myCreeps[role].length * 1.75 > enemyAttackers.length) return false

                    // If towers, spawn based on healStrength. If no towers, use attackStrength and healStrength

                    let requiredStrength = 1
                    if (!this.communeManager.room.controller.safeMode) {
                        requiredStrength += this.communeManager.room.totalEnemyCombatStrength.heal
                        if (!this.communeManager.room.structures.tower.length)
                            requiredStrength +=
                                this.communeManager.room.totalEnemyCombatStrength.melee +
                                this.communeManager.room.totalEnemyCombatStrength.ranged
                    }

                    const priority = Math.min(
                        minPriority - 0.1 + this.communeManager.room.myCreeps[role].length * 0.75,
                        maxPriority,
                    )

                    // If all RCL 3 extensions are build

                    if (this.spawnEnergyCapacity >= 800) {
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
    }

    private maintainers() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

                let repairTargets: Structure<BuildableStructureConstant>[] = this.communeManager.room.structures.road
                repairTargets = repairTargets.concat(this.communeManager.room.structures.container)

                repairTargets = repairTargets.filter(structure => structure.hitsMax * 0.2 >= structure.hits)
                // Get ramparts below their max hits

                const repairRamparts = this.communeManager.room.structures.rampart.filter(
                    rampart => rampart.hits < this.communeManager.room.communeManager.minRampartHits,
                )

                // If there are no ramparts or repair targets

                if (!repairRamparts.length && !repairTargets.length) return false

                let priority: number

                if (repairTargets.length || this.communeManager.room.towerInferiority) {
                    priority = Math.min(
                        6 + this.communeManager.room.creepsFromRoom.maintainer.length * 0.5,
                        this.minRemotePriority - 0.5,
                    )
                } else {
                    priority = this.minRemotePriority + 0.5
                }

                // Construct the partsMultiplier

                let partsMultiplier = 1

                // For each road, add a multiplier

                partsMultiplier += this.communeManager.room.structures.road.length * roadUpkeepCost * 2

                // For each container, add a multiplier

                partsMultiplier += this.communeManager.room.structures.container.length * containerUpkeepCost * 2

                // Extra considerations if a storage is present

                let maxCreeps = Infinity

                if (this.communeManager.room.storage && this.communeManager.room.controller.level >= 4) {
                    if (
                        repairRamparts.length / this.communeManager.room.structures.rampart.length < 0.2 &&
                        this.communeManager.room.totalEnemyCombatStrength.melee +
                            this.communeManager.room.totalEnemyCombatStrength.ranged <=
                            0
                    ) {
                        maxCreeps = 1
                    }

                    // For every x energy in storage, add 1 multiplier

                    partsMultiplier += Math.pow(
                        this.communeManager.room.resourcesInStoringStructures.energy /
                            (16000 + this.communeManager.room.controller.level * 1000),
                        2,
                    )
                }

                // For every attackValue, add a multiplier

                partsMultiplier +=
                    (this.communeManager.room.totalEnemyCombatStrength.melee +
                        this.communeManager.room.totalEnemyCombatStrength.ranged) /
                    (REPAIR_POWER / 3)

                const role = 'maintainer'

                // If all RCL 3 extensions are build

                if (this.spawnEnergyCapacity >= 800) {
                    return {
                        role,
                        defaultParts: [],
                        extraParts: [CARRY, MOVE, WORK],
                        partsMultiplier,
                        minCreeps: undefined,
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
                    minCreeps: undefined,
                    maxCreeps,
                    minCost: 250,
                    priority,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    private builders() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                if (this.communeManager.room.towerInferiority) return false

                // Stop if there are no construction sites

                if (!this.communeManager.room.find(FIND_MY_CONSTRUCTION_SITES).length) return false

                const priority = this.minRemotePriority + 0.5
                let partsMultiplier = 0

                // If there is an active storage

                if (this.communeManager.room.storage && this.communeManager.room.controller.level >= 4) {
                    // If the storage is sufficiently full, provide x amount per y enemy in storage

                    if (
                        this.communeManager.room.resourcesInStoringStructures.energy <
                        this.communeManager.room.communeManager.storedEnergyBuildThreshold
                    )
                        return false

                    partsMultiplier += Math.pow(
                        this.communeManager.room.resourcesInStoringStructures.energy /
                            (15000 + this.communeManager.room.controller.level * 1000),
                        2,
                    )
                }

                // Otherwise if there is no storage
                else {
                    partsMultiplier += this.communeManager.estimatedEnergyIncome / 5

                    // Spawn some extra builders to handle the primarily road building RCL 3 and needy storage building

                    if (this.spawnEnergyCapacity >= 800) partsMultiplier *= 1.2
                }

                const role = 'builder'

                // If there is a storage or terminal

                if (this.communeManager.room.storage || this.communeManager.room.terminal) {
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

                if (this.spawnEnergyCapacity >= 800) {
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

                if (
                    !this.communeManager.room.fastFillerContainerLeft &&
                    !this.communeManager.room.fastFillerContainerRight
                ) {
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
    }

    private controllerUpgraders() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                let partsMultiplier = 1
                let maxCreeps = this.communeManager.room.upgradePositions.length - 1

                // If there is a storage, prefer needed remote creeps over upgraders

                let priority: number
                if (this.communeManager.room.storage && this.communeManager.room.controller.level >= 4) {
                    priority = this.minRemotePriority + 0.5
                } else priority = this.minRemotePriority - 1

                // If there are enemyAttackers and the controller isn't soon to downgrade

                if (
                    this.communeManager.room.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed &&
                    this.communeManager.room.towerInferiority
                )
                    return false

                // If there is a storage

                if (this.communeManager.room.storage && this.communeManager.room.controller.level >= 4) {
                    // If the storage is sufficiently full, provide x amount per y energy in storage

                    if (
                        this.communeManager.room.resourcesInStoringStructures.energy >=
                        this.communeManager.room.communeManager.storedEnergyUpgradeThreshold
                    )
                        partsMultiplier = Math.pow(
                            (this.communeManager.room.resourcesInStoringStructures.energy -
                                this.communeManager.room.communeManager.storedEnergyUpgradeThreshold * 0.5) /
                                (6000 + this.communeManager.room.controller.level * 2000),
                            2,
                        )
                    // Otherwise, set partsMultiplier to 0
                    else partsMultiplier = 0
                }
                // Otherwise if there is no storage
                else {
                    partsMultiplier += this.communeManager.estimatedEnergyIncome * 0.75
                }

                // Get the controllerLink and baseLink

                const controllerLink = this.communeManager.room.controllerLink

                // If the controllerLink is defined

                if (controllerLink && controllerLink.RCLActionable) {
                    maxCreeps -= 1

                    const hubLink = this.communeManager.room.hubLink
                    const sourceLinks = this.communeManager.room.sourceLinks

                    // If there are transfer links, max out partMultiplier to their ability

                    if ((hubLink && hubLink.RCLActionable) || sourceLinks.find(link => link && link.RCLActionable)) {
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

                            maxPartsMultiplier +=
                                findLinkThroughput(range, this.communeManager.room.estimatedSourceIncome[i]) * 0.7
                        }

                        partsMultiplier = Math.min(partsMultiplier, maxPartsMultiplier)
                    }
                }

                // If there are construction sites of my ownership in the this.communeManager.room, set multiplier to 1

                if (this.communeManager.room.find(FIND_MY_CONSTRUCTION_SITES).length) partsMultiplier = 0

                const threshold = 0.05
                const role = 'controllerUpgrader'

                // If the controllerContainer or controllerLink exists

                if (this.communeManager.room.controllerContainer || (controllerLink && controllerLink.RCLActionable)) {
                    // If the controller is level 8

                    if (this.communeManager.room.controller.level === 8) {
                        let extraParts: BodyPartConstant[]

                        // If the controller is near to downgrading

                        if (this.communeManager.room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                            extraParts = [CARRY, WORK, MOVE]
                        else if (partsMultiplier === 0) return false
                        else
                            extraParts = [
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                WORK,
                                CARRY,
                                CARRY,
                                CARRY,
                                MOVE,
                                MOVE,
                                MOVE,
                                MOVE,
                                MOVE,
                                MOVE,
                                MOVE,
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

                    if (this.spawnEnergyCapacity >= 1000) {
                        // If the controller is near to downgrading, set partsMultiplier to x

                        if (this.communeManager.room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
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

                    // Otherwise if the this.spawnEnergyCapacity is more than 800

                    if (this.spawnEnergyCapacity >= 800) {
                        // If the controller is near to downgrading, set partsMultiplier to x

                        if (this.communeManager.room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
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

                    if (this.communeManager.room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
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

                if (this.communeManager.room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                    partsMultiplier = Math.max(partsMultiplier, 1)
                if (this.communeManager.room.controller.level < 2) partsMultiplier = Math.max(partsMultiplier, 1)

                if (this.spawnEnergyCapacity >= 800) {
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
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    private remoteSourceHarvesters() {
        for (const remoteInfo of this.communeManager.room.remoteSourceIndexesByEfficacy) {
            const splitRemoteInfo = remoteInfo.split(' ')
            const remoteName = splitRemoteInfo[0]
            const sourceIndex = parseInt(splitRemoteInfo[1]) as 0 | 1

            const remoteMemory = Memory.rooms[remoteName]
            const remoteData = Memory.rooms[remoteName].data
            const remote = Game.rooms[remoteName]
            const priority =
                Math.round((this.minRemotePriority + 1 + remoteMemory.SPs[sourceIndex].length / 100) * 100) / 100

            const role = RemoteHarvesterRolesBySourceIndex[sourceIndex] as
                | 'remoteSourceHarvester0'
                | 'remoteSourceHarvester1'

            // If there are no data for this.communeManager.room this.communeManager.room, inform false

            if (remoteData[RemoteData[role]] <= 0) continue

            const sourcePositionsAmount = remote
                ? remote.sourcePositions.length
                : unpackPosList(remoteMemory.SP[sourceIndex]).length

            // Construct requests for remoteSourceHarvester0s

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    if (this.spawnEnergyCapacity >= 950) {
                        return {
                            role,
                            defaultParts: [CARRY],
                            extraParts: [WORK, MOVE],
                            partsMultiplier: remoteData[RemoteData[role]],
                            spawnGroup: this.communeManager.room.creepsOfRemote[remoteName][role],
                            threshold: 0.1,
                            minCreeps: 1,
                            maxCreeps: sourcePositionsAmount,
                            maxCostPerCreep: 50 + 150 * 6,
                            minCost: 200,
                            priority,
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
                        spawnGroup: this.communeManager.room.creepsOfRemote[remoteName][role],
                        threshold: 0.1,
                        minCreeps: undefined,
                        maxCreeps: sourcePositionsAmount,
                        maxCostPerCreep: 50 + 250 * 3,
                        minCost: 300,
                        priority,
                        memoryAdditions: {
                            R: true,
                            SI: sourceIndex,
                            RN: remoteName,
                        },
                    }
                })(),
            )
        }
    }

    private generalRemoteRoles() {
        this.remoteHaulerNeed = 0

        const remoteNamesByEfficacy = this.communeManager.room.remoteNamesBySourceEfficacy

        for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
            const remoteName = remoteNamesByEfficacy[index]
            const remoteData = Memory.rooms[remoteName].data

            // Add up econ data for this.communeManager.room this.communeManager.room

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
                    // Get the income based on the reservation of the this.communeManager.room and remoteHarvester need
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

                    this.remoteHaulerNeed += findCarryPartsRequired(
                        remoteMemory.SPs[index].length / packedPosLength,
                        income,
                    )
                }
            }

            // If there is a need for any econ creep, inform the index

            if (totalRemoteNeed <= 0) continue

            // Construct requests for remoteReservers

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    // If there are insufficient harvesters for the remote's sources

                    if (
                        Math.max(remoteData[RemoteData.remoteSourceHarvester0], 0) +
                            Math.max(remoteData[RemoteData.remoteSourceHarvester1], 0) >
                        0
                    )
                        return false

                    let cost = 650

                    // If there isn't enough this.spawnEnergyCapacity to spawn a remoteReserver, inform false

                    if (this.spawnEnergyCapacity < cost) return false

                    // If there are no data for this.communeManager.room this.communeManager.room, inform false

                    if (remoteData[RemoteData.remoteReserver] <= 0) return false

                    return {
                        role: 'remoteReserver',
                        defaultParts: [],
                        extraParts: [MOVE, CLAIM],
                        partsMultiplier: 6,
                        spawnGroup: this.communeManager.room.creepsOfRemote[remoteName].remoteReserver,
                        minCreeps: 1,
                        maxCreeps: Infinity,
                        minCost: cost,
                        priority: this.minRemotePriority + 0.1,
                        memoryAdditions: {
                            RN: remoteName,
                        },
                    }
                })(),
            )

            // Construct requests for remoteDefenders

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    // If there are no related data

                    if (remoteData[RemoteData.minDamage] + remoteData[RemoteData.minHeal] <= 0) return false

                    let minRangedAttackCost = 0

                    if (remoteData[RemoteData.minDamage] > 0) {
                        minRangedAttackCost =
                            (remoteData[RemoteData.minDamage] / RANGED_ATTACK_POWER) * BODYPART_COST[RANGED_ATTACK] +
                            (remoteData[RemoteData.minDamage] / RANGED_ATTACK_POWER) * BODYPART_COST[MOVE]
                    }

                    const rangedAttackAmount =
                        minRangedAttackCost / (BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE])

                    let minHealCost = 0

                    if (remoteData[RemoteData.minHeal] > 0) {
                        minHealCost =
                            (remoteData[RemoteData.minHeal] / HEAL_POWER) * BODYPART_COST[HEAL] +
                            (remoteData[RemoteData.minHeal] / HEAL_POWER) * BODYPART_COST[MOVE]
                    }

                    const healAmount = minHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE])

                    if ((rangedAttackAmount + healAmount) * 2 > 50) {
                        Memory.rooms[remoteName].data[RemoteData.abandon] = randomRange(1000, 1500)
                        return false
                    }

                    const minCost = minRangedAttackCost + minHealCost
                    if (minCost > this.spawnEnergyCapacity) {
                        Memory.rooms[remoteName].data[RemoteData.abandon] = randomRange(1000, 1500)
                        return false
                    }

                    const extraParts: BodyPartConstant[] = []

                    for (let i = 0; i < rangedAttackAmount; i++) {
                        extraParts.push(RANGED_ATTACK, MOVE)
                    }

                    for (let i = 0; i < healAmount; i++) {
                        extraParts.push(HEAL, MOVE)
                    }

                    return {
                        role: 'remoteDefender',
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        spawnGroup: this.communeManager.room.creepsOfRemote[remoteName].remoteDefender,
                        minCreeps: 1,
                        minCost,
                        priority: this.minRemotePriority - 3,
                        memoryAdditions: {},
                    }
                })(),
            )

            // Construct requests for remoteCoreAttackers

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    // If there are no related data

                    if (remoteData[RemoteData.remoteCoreAttacker] <= 0) return false

                    // Define the minCost and strength

                    const cost = 130
                    const extraParts = [ATTACK, MOVE]

                    return {
                        role: 'remoteCoreAttacker',
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 50 / extraParts.length,
                        spawnGroup: this.communeManager.room.creepsOfRemote[remoteName].remoteCoreAttacker,
                        minCreeps: 1,
                        minCost: cost * extraParts.length,
                        priority: this.minRemotePriority - 2,
                        memoryAdditions: {
                            RN: remoteName,
                        },
                    }
                })(),
            )

            // Construct requests for remoteDismantler

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    // If there are no related data

                    if (remoteData[RemoteData.remoteDismantler] <= 0) return false

                    // Define the minCost and strength

                    const cost = 150
                    const extraParts = [WORK, MOVE]

                    return {
                        role: 'remoteDismantler',
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 50 / extraParts.length,
                        spawnGroup: this.communeManager.room.creepsOfRemote[remoteName].remoteDismantler,
                        minCreeps: 1,
                        minCost: cost * 2,
                        priority: this.minRemotePriority - 1,
                        memoryAdditions: {
                            RN: remoteName,
                        },
                    }
                })(),
            )
        }
    }

    private remoteHaulers() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                if (this.remoteHaulerNeed === 0) return false

                const partsMultiplier = this.remoteHaulerNeed
                const role = 'remoteHauler'

                /*
                // If all RCL 3 extensions are built
                if (this.spawnEnergyCapacity >= 800) {
                        partsMultiplier = this.remoteHaulerNeed / 2
                        return {
                            defaultParts: [],
                            extraParts: [CARRY, CARRY, MOVE],
                            threshold: 0.1,
                            partsMultiplier,
                            maxCreeps: Infinity,
                            minCost: 150,
                            maxCostPerCreep: this.communeManager.room.memory.MHC,
                            priority: this.minRemotePriority,
                            memoryAdditions: {
                                role: 'remoteHauler',
                                R: true,
                            },
                        }
                }
                */

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE],
                    threshold: 0.1,
                    partsMultiplier,
                    minCost: 100,
                    maxCostPerCreep: this.communeManager.room.memory.MHC,
                    priority: this.minRemotePriority,
                    memoryAdditions: {},
                }
            })(),
        )
    }

    private scout() {
        this.rawSpawnRequestsArgs.push(
            ((): SpawnRequestArgs | false => {
                let minCreeps: number
                if (this.communeManager.room.structures.observer.length) minCreeps = 1
                else minCreeps = 2

                return {
                    role: 'scout',
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
    }

    private claimRequestRoles() {
        if (this.communeManager.room.memory.claimRequest) {
            const requestName = this.communeManager.room.memory.claimRequest
            const request = Memory.claimRequests[requestName]

            // Construct requests for claimers

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    if (request.data[ClaimRequestData.claimer] <= 0) return false

                    return {
                        role: 'claimer',
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

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    if (request.data[ClaimRequestData.vanguard] <= 0) return false

                    return {
                        role: 'vanguard',
                        defaultParts: [],
                        extraParts: [WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
                        partsMultiplier: request.data[ClaimRequestData.vanguard],
                        minCost: 250,
                        priority: 8.2,
                        memoryAdditions: {
                            TRN: requestName,
                        },
                    }
                })(),
            )
        }
    }

    private allyVanguard() {
        if (this.communeManager.room.memory.allyCreepRequest) {
            const allyCreepRequestNeeds =
                Memory.allyCreepRequests[this.communeManager.room.memory.allyCreepRequest].data

            // Requests for vanguard

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    // If there is no vanguard need

                    if (allyCreepRequestNeeds[AllyCreepRequestData.allyVanguard] <= 0) return false

                    return {
                        role: 'allyVanguard',
                        defaultParts: [],
                        extraParts: [WORK, CARRY, CARRY, MOVE, MOVE, MOVE],
                        partsMultiplier: allyCreepRequestNeeds[AllyCreepRequestData.allyVanguard],
                        minCost: 250,
                        priority: 10 + this.communeManager.room.creepsFromRoom.allyVanguard.length,
                        memoryAdditions: {},
                    }
                })(),
            )
        }
    }

    private requestHauler() {
        for (const requestName of this.communeManager.room.memory.haulRequests) {
            const request = Memory.haulRequests[requestName]
            if (!request) continue

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    const priority = Math.min(
                        0.5 + this.communeManager.room.creepsFromRoom.requestHauler.length / 2,
                        this.minRemotePriority - 1,
                    )

                    return {
                        role: 'requestHauler',
                        defaultParts: [],
                        extraParts: [CARRY, MOVE],
                        partsMultiplier: 100,
                        minCost: 100,
                        maxCostPerCreep: this.communeManager.room.memory.MHC,
                        priority,
                        memoryAdditions: {
                            HRN: requestName,
                        },
                    }
                })(),
            )
        }
    }

    private antifa() {
        let priority = 8

        for (let i = this.communeManager.room.memory.combatRequests.length - 1; i >= 0; i -= 1) {
            const requestName = Memory.rooms[this.communeManager.room.name].combatRequests[i]
            const request = Memory.combatRequests[requestName]

            if (!request) continue

            if (request.data[CombatRequestData.abandon] > 0) continue

            priority += 0.01

            //

            const minRangedAttackCost = this.communeManager.room.communeManager.findMinRangedAttackCost(
                request.data[CombatRequestData.minDamage],
            )
            const rangedAttackAmount = Math.floor(
                minRangedAttackCost / (BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE]),
            )

            const minAttackCost = this.communeManager.room.communeManager.findMinMeleeAttackCost(
                request.data[CombatRequestData.minDamage],
            )
            const attackAmount = Math.floor(minAttackCost / (BODYPART_COST[ATTACK] + BODYPART_COST[MOVE]))

            const minMeleeHealCost = this.communeManager.room.communeManager.findMinHealCost(
                request.data[CombatRequestData.minMeleeHeal] + (request.data[CombatRequestData.maxTowerDamage] || 0),
            )
            const meleeHealAmount = Math.floor(minMeleeHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE]))

            const minRangedHealCost = this.communeManager.room.communeManager.findMinHealCost(
                request.data[CombatRequestData.minRangedHeal] + (request.data[CombatRequestData.maxTowerDamage] || 0),
            )
            const rangedHealAmount = Math.floor(minRangedHealCost / (BODYPART_COST[HEAL] + BODYPART_COST[MOVE]))

            const minDismantleCost =
                request.data[CombatRequestData.dismantle] * BODYPART_COST[WORK] +
                    request.data[CombatRequestData.dismantle] * BODYPART_COST[MOVE] || 0

            if (request.T === 'attack' || request.T === 'defend') {
                if (
                    minRangedAttackCost + minRangedHealCost > this.communeManager.room.energyCapacityAvailable ||
                    minAttackCost > this.communeManager.room.energyCapacityAvailable ||
                    (rangedAttackAmount + rangedHealAmount) * 2 > 50 ||
                    attackAmount * 2 > 50
                ) {
                    this.communeManager.room.communeManager.deleteCombatRequest(requestName, i)
                    continue
                }

                // Spawn quad

                this.rawSpawnRequestsArgs.push(
                    ((): SpawnRequestArgs | false => {
                        // We currently have enough quads

                        if (request.data[CombatRequestData.quads] >= request.data[CombatRequestData.quadQuota])
                            return false

                        const role = 'antifaRangedAttacker'

                        const spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                        const minCost = minRangedAttackCost + minRangedHealCost
                        const extraParts: BodyPartConstant[] = []

                        interface TradeType {
                            amount: number
                            other: BodyPartConstant
                        }

                        const tradeTypes: { [key in BodyPartConstant]?: TradeType } = {
                            [RANGED_ATTACK]: {
                                amount: rangedAttackAmount,
                                other: HEAL,
                            },
                            [HEAL]: {
                                amount: rangedHealAmount,
                                other: RANGED_ATTACK,
                            },
                        }
                        const totalTradeableParts = rangedAttackAmount + rangedHealAmount

                        let tradeAmount = Infinity

                        for (const key in tradeTypes) {
                            const partType = key as BodyPartConstant
                            const tradeType = tradeTypes[partType]
                            const ratio = tradeType.amount / totalTradeableParts

                            let localTradeAmount = Math.ceil(tradeType.amount * ratio * 1.5)
                            if (localTradeAmount >= tradeAmount) continue

                            function findCost() {
                                return (
                                    (tradeType.amount + localTradeAmount) * BODYPART_COST[partType] +
                                    (tradeTypes[tradeType.other].amount - localTradeAmount) *
                                        BODYPART_COST[tradeType.other]
                                )
                            }

                            while (findCost() > this.spawnEnergyCapacity) {
                                localTradeAmount -= 1
                            }

                            tradeAmount = localTradeAmount
                        }

                        // We need attack and tough oriented creeps

                        if (
                            this.communeManager.room.squadRequests.size <
                            (request.data[CombatRequestData.quads] + 1) * 4 - 2
                        ) {
                            for (let i = 0; i < rangedAttackAmount + tradeAmount; i++) {
                                extraParts.push(RANGED_ATTACK, MOVE)
                            }

                            for (let i = 0; i < rangedHealAmount - tradeAmount; i++) {
                                extraParts.push(HEAL, MOVE)
                            }
                        }

                        // We need heal-oriented creeps
                        else {
                            for (let i = 0; i < rangedAttackAmount - tradeAmount; i++) {
                                extraParts.push(RANGED_ATTACK, MOVE)
                            }

                            for (let i = 0; i < rangedHealAmount + tradeAmount; i++) {
                                extraParts.push(HEAL, MOVE)
                            }
                        }

                        if (!extraParts.length) return false

                        return {
                            role,
                            defaultParts: [],
                            extraParts,
                            partsMultiplier: 1,
                            minCost,
                            priority,
                            spawnGroup,
                            minCreeps: request.data[CombatRequestData.quadQuota] * 4,
                            memoryAdditions: {
                                CRN: requestName,
                                SS: 4,
                                ST: 'quad',
                                SCT: 'rangedAttack',
                            },
                        }
                    })(),
                )
                continue
            }

            // Harass

            if (
                minRangedAttackCost + minRangedHealCost > this.communeManager.room.energyCapacityAvailable ||
                minAttackCost + minMeleeHealCost > this.communeManager.room.energyCapacityAvailable ||
                minAttackCost > this.communeManager.room.energyCapacityAvailable
            ) {
                this.communeManager.room.communeManager.deleteCombatRequest(requestName, i)
                continue
            }

            // If the request isn't an attack
            // Spawn RangedAttack Heal singletons
            /*
            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    role = 'antifaRangedAttacker'
                    spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                    const minCost = minRangedAttackCost + minRangedHealCost
                    const extraParts: BodyPartConstant[] = []

                    for (let i = 0; i < rangedAttackAmount; i++) {
                        extraParts.push(RANGED_ATTACK, MOVE)
                    }

                    for (let i = 0; i < rangedHealAmount; i++) {
                        extraParts.push(HEAL, MOVE)
                    }

                    if (!extraParts.length) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        minCost,
                        priority,
                        spawnGroup,
                        memoryAdditions: {
                            ST: 'dynamic',
                            CRN: requestName,
                        },
                    }
                })(),
            )

            // Spawn dismantlers

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    role = 'antifaDismantler'
                    spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                    const minCost = minDismantleCost
                    let extraParts: BodyPartConstant[] = []

                    const workAmount = request.data[CombatRequestData.dismantle]

                    for (let i = 0; i < workAmount; i++) {
                        extraParts.push(WORK, MOVE)
                    }

                    if (!extraParts.length) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        minCost,
                        priority,
                        spawnGroup,
                        memoryAdditions: {
                            ST: 'dynamic',
                            CRN: requestName,
                        },
                    }
                })(),
            )

            // Spawn Attack Heal duo

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    role = 'antifaAttacker'
                    spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                    const minCost = minAttackCost
                    let extraParts: BodyPartConstant[] = []

                    for (let i = 0; i < attackAmount; i++) {
                        extraParts.push(ATTACK, MOVE)
                    }

                    if (!extraParts.length) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        minCost,
                        priority,
                        spawnGroup,
                        memoryAdditions: {
                            SS: 2,
                            ST: 'dynamic',
                            CRN: requestName,
                        },
                    }
                })(),
            )

            this.rawSpawnRequestsArgs.push(
                ((): SpawnRequestArgs | false => {
                    role = 'antifaHealer'
                    spawnGroup = internationalManager.creepsByCombatRequest[requestName][role]
                    const minCost = minMeleeHealCost
                    let extraParts: BodyPartConstant[] = []

                    for (let i = 0; i < meleeHealAmount; i++) {
                        extraParts.push(HEAL, MOVE)
                    }

                    if (!extraParts.length) return false

                    return {
                        role,
                        defaultParts: [],
                        extraParts,
                        partsMultiplier: 1,
                        minCost,
                        priority,
                        spawnGroup,
                        memoryAdditions: {
                            SS: 2,
                            ST: 'dynamic',
                            CRN: requestName,
                        },
                    }
                })(),
            ) */
        }
    }
}
