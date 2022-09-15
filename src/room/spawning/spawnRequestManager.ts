import {
    AllyCreepRequestNeeds,
    allyList,
    ClaimRequestNeeds,
    containerUpkeepCost,
    controllerDowngradeUpgraderNeed,
    minHarvestWorkRatio,
    myColors,
    rampartUpkeepCost,
    remoteHarvesterRoles,
    RemoteHarvesterRolesBySourceIndex,
    remoteHaulerRoles,
    RemoteNeeds,
    roadUpkeepCost,
} from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findRemoteSourcesByEfficacy,
    getRange,
} from 'international/generalFunctions'
import { unpackPosList } from 'other/packrat'
import { RemoteHarvester } from 'room/creeps/roleManagers/remote/remoteHarvesterFunctions'

Room.prototype.spawnRequester = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Structure info about the this's spawn energy

    const spawnEnergyCapacity = this.energyCapacityAvailable
    const mostOptimalSource = this.sourcesByEfficacy[0]
    const { storage } = this
    const { terminal } = this

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

    // Construct requests for sourceHarvesters
    if (this.sources.length > 1)
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
            const priority = 0.5 + this.creepsFromRoom.hauler.length

            // Construct the required carry parts

            let requiredCarryParts = 10

            //If the FF isn't setup, add more carrying.
            requiredCarryParts += 10

            // If there is no sourceLink 0, increase requiredCarryParts using the source's path length

            if (this.sourcePaths[0] && !this.sourceLinks[0])
                requiredCarryParts += findCarryPartsRequired(this.sourcePaths[0].length, 10)

            // If there is no sourceLink 1, increase requiredCarryParts using the source's path length

            if (this.sourcePaths[1] && !this.sourceLinks[1])
                requiredCarryParts += findCarryPartsRequired(this.sourcePaths[1].length, 10)

            // If there is a controllerContainer, increase requiredCarryParts using the hub-structure path length

            if (this.controllerContainer) {
                let income

                if (storage && this.controller.level >= 4) {
                    income = this.getPartsOfRoleAmount('controllerUpgrader', WORK)
                } else
                    income = Math.min(
                        this.getPartsOfRoleAmount('controllerUpgrader', WORK) * 0.75,
                        this.sources.length * 0.75,
                    )

                requiredCarryParts += findCarryPartsRequired(this.upgradePathLength, income)
            }

            if (this.controller.level >= 4 && storage && storage.store.energy >= 1000) {
            } else if (this.controller.level >= 6 && terminal && terminal.store.energy >= 1000) {
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
                partsMultiplier: requiredCarryParts,
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

            if (storage.store.energy < 40000) return false

            // If there is no terminal, inform false

            if (!terminal) return false

            if (terminal.store.getFreeCapacity() <= 10000) return false

            // Get the mineral. If it's out of resources, inform false

            if (this.mineral.mineralAmount === 0) return false

            let minCost = 900

            if (spawnEnergyCapacity < minCost) return false

            const role = 'mineralHarvester'

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

            if (spawnEnergyCapacity >= 650) defaultParts = [CARRY, CARRY, MOVE, CARRY]
            else if (this.controller.level >= 7) defaultParts = [CARRY, CARRY, CARRY, MOVE, CARRY]

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

            let requiredStrength = (healStrength + (this.structures.tower.length ? 0 : attackStrength)) * 1.5

            const role = 'meleeDefender'

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
                    priority: 6 + this.creepsFromRoom.meleeDefender.length,
                    memoryAdditions: {
                        R: true,
                    },
                    threshold: 0,
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
                priority: 6 + this.creepsFromRoom.meleeDefender.length,
                memoryAdditions: {},
                threshold: 0,
            }
        })(),
    )

    // Get the estimates income

    const estimatedIncome = this.estimateIncome()

    // Construct requests for builders

    this.constructSpawnRequests(
        ((): SpawnRequestOpts | false => {
            // If there are enemy attackers in the room

            if (attackStrength > 0) return false

            // Stop if there are no construction sites

            if (this.find(FIND_MY_CONSTRUCTION_SITES).length === 0) return false

            let priority = 9
            let partsMultiplier = 0

            // If there is a storage

            if (storage && this.controller.level < 4) {
                // If the storage is sufficiently full, provide x amount per y enemy in storage

                if (storage.store.getUsedCapacity(RESOURCE_ENERGY) >= this.communeManager.storedEnergyBuildThreshold)
                    partsMultiplier += storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000
            }

            // Otherwise if there is no storage
            else {
                partsMultiplier += estimatedIncome / 5

                // Spawn some extra builders to handle the primarily road building RCL 3 and needy storage building

                if (spawnEnergyCapacity >= 800) partsMultiplier *= 1.2
            }

            const role = 'builder'

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

            partsMultiplier += attackStrength / (REPAIR_POWER / 3)

            // For every x energy in storage, add 1 multiplier

            if (storage && this.controller.level >= 4)
                partsMultiplier += storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000

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

            if (storage && this.controller.level >= 4) {
                // If the storage is sufficiently full, provide x amount per y enemy in storage

                if (storage.store.getUsedCapacity(RESOURCE_ENERGY) >= this.communeManager.storedEnergyUpgradeThreshold)
                    partsMultiplier = Math.pow(storage.store.getUsedCapacity(RESOURCE_ENERGY) / 10000, 2)
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
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE, WORK, WORK, WORK],
                        partsMultiplier,
                        threshold,
                        minCreeps: undefined,
                        maxCreeps,
                        minCost: 750,
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

    const minRemotePriority = 10

    for (const remoteInfo of this.remoteSourceIndexesByEfficacy) {
        const splitRemoteInfo = remoteInfo.split(' ')
        const remoteName = splitRemoteInfo[0]
        const sourceIndex = parseInt(splitRemoteInfo[1]) as 0 | 1

        const remoteMemory = Memory.rooms[remoteName]
        const remoteNeeds = Memory.rooms[remoteName].needs
        const remote = Game.rooms[remoteName]
        const priority = minRemotePriority + 1 + remoteMemory.SE[sourceIndex] / 100

        const role = RemoteHarvesterRolesBySourceIndex[sourceIndex] as
            | 'source1RemoteHarvester'
            | 'source2RemoteHarvester'

        // If there are no needs for this this, inform false

        if (remoteNeeds[RemoteNeeds[role]] <= 0) continue

        const sourcePositionsAmount = remote
            ? remote.sourcePositions.length
            : unpackPosList(remoteMemory.SP[sourceIndex]).length

        // Construct requests for source1RemoteHarvesters

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                if (spawnEnergyCapacity >= 950) {
                    return {
                        role,
                        defaultParts: [CARRY],
                        extraParts: [WORK, MOVE],
                        partsMultiplier: remoteNeeds[RemoteNeeds[role]],
                        spawningGroup: this.creepsFromRoomWithRemote[remoteName][role],
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
                    partsMultiplier: remoteNeeds[RemoteNeeds[role]],
                    spawningGroup: this.creepsFromRoomWithRemote[remoteName][role],
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
        const remoteName = remoteNamesByEfficacy[index]
        const remoteNeeds = Memory.rooms[remoteName].needs

        // Add up econ needs for this this

        const totalRemoteNeed =
            Math.max(remoteNeeds[RemoteNeeds.remoteHauler0], 0) +
            Math.max(remoteNeeds[RemoteNeeds.remoteHauler1], 0) +
            Math.max(remoteNeeds[RemoteNeeds.remoteReserver], 0) +
            Math.max(remoteNeeds[RemoteNeeds.remoteCoreAttacker], 0) +
            Math.max(remoteNeeds[RemoteNeeds.remoteDismantler], 0) +
            Math.max(remoteNeeds[RemoteNeeds.minDamage], 0) +
            Math.max(remoteNeeds[RemoteNeeds.minHeal], 0)

        const remoteMemory = Memory.rooms[remoteName]

        if (!remoteMemory.needs[RemoteNeeds.enemyReserved] && !remoteMemory.abandoned) {
            const remote = Game.rooms[remoteName]
            const isReserved =
                remote && remote.controller.reservation && remote.controller.reservation.username === Memory.me

            // Loop through each index of sourceEfficacies

            for (let index = 0; index < remoteMemory.SE.length; index += 1) {
                // Get the income based on the reservation of the this and remoteHarvester need
                // Multiply remote harvester need by 1.6~ to get 3 to 5 and 6 to 10, converting work part need to income expectation

                const income =
                    Math.max((isReserved ? 10 : 5) -
                    Math.floor(Math.max(remoteMemory.needs[RemoteNeeds[remoteHarvesterRoles[index]]], 0) * minHarvestWorkRatio), 0)

                // Find the number of carry parts required for the source, and add it to the remoteHauler need

                remoteHaulerNeed += findCarryPartsRequired(remoteMemory.SE[index], income)
            }
        }

        // If there is a need for any econ creep, inform the index

        if (totalRemoteNeed <= 0) continue

        // Construct requests for remoteReservers

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there are insufficient harvesters for the remote's sources

                if (
                    Math.max(remoteNeeds[RemoteNeeds.source1RemoteHarvester], 0) +
                        Math.max(remoteNeeds[RemoteNeeds.source2RemoteHarvester], 0) >
                    0
                )
                    return false

                let cost = 650

                // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

                if (spawnEnergyCapacity < cost) return false

                // If there are no needs for this this, inform false

                if (remoteNeeds[RemoteNeeds.remoteReserver] <= 0) return false

                const role = 'remoteReserver'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [MOVE, CLAIM],
                    partsMultiplier: 6,
                    spawningGroup: this.creepsFromRoomWithRemote[remoteName].remoteReserver,
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
                // If there are no related needs

                if (remoteNeeds[RemoteNeeds.minDamage] + remoteNeeds[RemoteNeeds.minHeal] <= 0) return false

                const minCost = 400
                const cost = 900
                const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE]
                const rangedAttackStrength = RANGED_ATTACK_POWER * 2
                const healStrength = HEAL_POWER

                // If there isn't enough spawnEnergyCapacity to spawn a remoteDefender, inform false

                if (spawnEnergyCapacity < minCost) return false

                // If max spawnable strength is less that needed

                if (
                    rangedAttackStrength * (spawnEnergyCapacity / cost) < remoteNeeds[RemoteNeeds.minDamage] ||
                    healStrength * (spawnEnergyCapacity / cost) < remoteNeeds[RemoteNeeds.minHeal]
                ) {
                    // Abandon the this for some time

                    Memory.rooms[remoteName].abandoned = 1500
                    return false
                }

                const partsMultiplier = Math.max(
                    remoteNeeds[RemoteNeeds.minDamage] / rangedAttackStrength +
                        remoteNeeds[RemoteNeeds.minHeal] / healStrength,
                    1,
                )

                const role = 'remoteDefender'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier,
                    spawningGroup: this.creepsFromRoomWithRemote[remoteName].remoteDefender,
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

                if (remoteNeeds[RemoteNeeds.remoteCoreAttacker] <= 0) return false

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
                    spawningGroup: this.creepsFromRoomWithRemote[remoteName].remoteCoreAttacker,
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
                // If there are no related needs

                if (remoteNeeds[RemoteNeeds.remoteDismantler] <= 0) return false

                // Define the minCost and strength

                const cost = 150
                const extraParts = [WORK, MOVE]

                const role = 'remoteDismantler'

                return {
                    role,
                    defaultParts: [],
                    extraParts,
                    partsMultiplier: 50 / extraParts.length,
                    spawningGroup: this.creepsFromRoomWithRemote[remoteName].remoteDismantler,
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
                maxCostPerCreep: this.memory.MHC,
                priority: minRemotePriority,
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
                minCreeps: this.controller.level === 8 ? 1 : 2,
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

                if (claimRequestNeeds[ClaimRequestNeeds.claimer] <= 0) return false

                const role = 'claimer'

                return {
                    role,
                    defaultParts: [CLAIM, MOVE],
                    extraParts: [MOVE, MOVE, MOVE, MOVE],
                    partsMultiplier: 1,
                    minCreeps: 1,
                    minCost: 650,
                    priority: 8.1,
                    memoryAdditions: {},
                }
            })(),
        )

        // Requests for vanguard

        this.constructSpawnRequests(
            ((): SpawnRequestOpts | false => {
                // If there is no vanguard need

                if (claimRequestNeeds[ClaimRequestNeeds.vanguard] <= 0) return false

                const role = 'vanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: claimRequestNeeds[ClaimRequestNeeds.vanguard],
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

                if (claimRequestNeeds[ClaimRequestNeeds.vanguardDefender] <= 0) return false

                // If max spawnable strength is less that needed

                if (
                    strengthOfParts * (spawnEnergyCapacity / cost) <
                    claimRequestNeeds[ClaimRequestNeeds.vanguardDefender]
                ) {
                    // Abandon the this for some time

                    Memory.claimRequests[this.memory.claimRequest].abandon = 20000
                    delete Memory.claimRequests[this.memory.claimRequest].responder
                    delete this.memory.claimRequest
                    return false
                }

                const partsMultiplier = Math.max(
                    Math.floor(claimRequestNeeds[ClaimRequestNeeds.vanguardDefender] / strengthOfParts) * 1.2,
                    1,
                )

                // If there is no vanguardDefender need

                if (claimRequestNeeds[ClaimRequestNeeds.vanguardDefender] <= 0) return false

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

                if (allyCreepRequestNeeds[AllyCreepRequestNeeds.allyVanguard] <= 0) return false

                const role = 'allyVanguard'

                return {
                    role,
                    defaultParts: [],
                    extraParts: [CARRY, MOVE, WORK, MOVE, CARRY, MOVE],
                    partsMultiplier: allyCreepRequestNeeds[AllyCreepRequestNeeds.allyVanguard],
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
