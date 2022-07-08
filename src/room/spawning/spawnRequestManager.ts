import {
     allyList,
     builderSpawningWhenStorageThreshold,
     claimRequestNeedsIndex,
     constants,
     controllerDowngradeUpgraderNeed,
     remoteNeedsIndex,
     upgraderSpawningWhenStorageThreshold,
} from 'international/constants'
import {
     customLog,
     findCarryPartsRequired,
     findRemoteSourcesByEfficacy,
     findStrengthOfParts,
     getRange,
} from 'international/generalFunctions'

/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {
     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

     // Structure info about the room's spawn energy

     const spawnEnergyCapacity = room.energyCapacityAvailable

     const mostOptimalSource = room.findSourcesByEfficacy()[0]

     let partsMultiplier: number
     let extraParts: BodyPartConstant[]
     let cost: number
     let minCost: number

     // Construct requests for sourceHarvesters

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const sourceName = 'source1'
               const priority = (mostOptimalSource === sourceName ? 0 : 1) + room.creepsFromRoom.source1Harvester.length
               const role = 'source1Harvester'

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [CARRY],
                         extraParts: [WORK, MOVE, WORK],
                         partsMultiplier: 3,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (spawnEnergyCapacity >= 750) {
                    return {
                         defaultParts: [],
                         extraParts: [WORK, MOVE, WORK],
                         partsMultiplier: 3,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (spawnEnergyCapacity >= 600) {
                    return {
                         defaultParts: [MOVE, CARRY],
                         extraParts: [WORK],
                         partsMultiplier: 6,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 300,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (room[`${sourceName}Container`]) {
                    return {
                         defaultParts: [MOVE],
                         extraParts: [WORK],
                         partsMultiplier: 6,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 150,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               return {
                    defaultParts: [MOVE, CARRY],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: undefined,
                    maxCreeps: Math.min(3, room.get(`${sourceName}HarvestPositions`).length),
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                         role,
                         sourceName,
                    },
               }
          })(),
     )

     // Construct requests for sourceHarvesters

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const sourceName = 'source2'
               const priority = (mostOptimalSource === sourceName ? 0 : 1) + room.creepsFromRoom.source1Harvester.length
               const role = 'source2Harvester'

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [CARRY],
                         extraParts: [WORK, MOVE, WORK],
                         partsMultiplier: 3,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (spawnEnergyCapacity >= 750) {
                    return {
                         defaultParts: [],
                         extraParts: [WORK, MOVE, WORK],
                         partsMultiplier: 3,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (spawnEnergyCapacity >= 600) {
                    return {
                         defaultParts: [MOVE, CARRY],
                         extraParts: [WORK],
                         partsMultiplier: 6,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 300,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               if (room[`${sourceName}Container`]) {
                    return {
                         defaultParts: [MOVE],
                         extraParts: [WORK],
                         partsMultiplier: 6,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 150,
                         priority,
                         memoryAdditions: {
                              role,
                              sourceName,
                         },
                    }
               }

               return {
                    defaultParts: [MOVE, CARRY],
                    extraParts: [WORK],
                    partsMultiplier: 6,
                    minCreeps: undefined,
                    maxCreeps: Math.min(3, room.get(`${sourceName}HarvestPositions`).length),
                    minCost: 200,
                    priority,
                    memoryAdditions: {
                         role,
                         sourceName,
                    },
               }
          })(),
     )

     // Construct requests for haulers

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const priority = 0.5 + room.creepsFromRoom.hauler.length * 1.5

               // Construct the required carry parts

               let requiredCarryParts = 10

               // If there is no source1Link, increase requiredCarryParts using the source's path length

               if (!room.source1Link)
                    requiredCarryParts += findCarryPartsRequired(
                         room.source1PathLength * 2,
                         Math.min(room.getPartsOfRoleAmount('source1Harvester', WORK), 10),
                    )

               // If there is no source2Link, increase requiredCarryParts using the source's path length

               if (!room.source2Link)
                    requiredCarryParts += findCarryPartsRequired(
                         room.source2PathLength * 2,
                         Math.min(room.getPartsOfRoleAmount('source1Harvester', WORK), 10),
                    )

               // If there is a controllerContainer, increase requiredCarryParts using the hub-structure path length

               if (room.controllerContainer) {
                    let income

                    if (room.storage) {
                         income = room.getPartsOfRoleAmount('controllerUpgrader', WORK)
                    } else
                         Math.min(
                              room.getPartsOfRoleAmount('controllerUpgrader', WORK) * 0.75,
                              room.sources.length * 0.75,
                         )

                    requiredCarryParts += findCarryPartsRequired(room.upgradePathLength * 2, income)
               }

               // If all RCL 3 extensions are built

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [],
                         extraParts: [CARRY, CARRY, MOVE],
                         partsMultiplier: requiredCarryParts / 2,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost: 150,
                         priority,
                         memoryAdditions: {
                              role: 'hauler',
                         },
                    }
               }

               return {
                    defaultParts: [],
                    extraParts: [CARRY, MOVE],
                    partsMultiplier: requiredCarryParts,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 100,
                    priority,
                    memoryAdditions: {
                         role: 'hauler',
                    },
               }
          })(),
     )

     // Construct requests for mineralHarvesters

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // If there is no extractor, inform false

               if (!room.structures.extractor.length) return false

               if (!room.storage) return false

               if (room.storage.store.energy < 40000) return false

               // If there is no terminal, inform false

               if (!room.terminal) return false

               if (room.terminal.store.getFreeCapacity() <= 10000) return false

               // Get the mineral. If it's out of resources, inform false

               if (room.mineral.mineralAmount === 0) return false

               let minCost = 900

               if (spawnEnergyCapacity < minCost) return false

               return {
                    defaultParts: [],
                    extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
                    partsMultiplier: room.get('mineralHarvestPositions')?.length * 4,
                    minCreeps: 1,
                    minCost,
                    priority: 10 + room.creepsFromRoom.mineralHarvester.length * 3,
                    memoryAdditions: {
                         role: 'mineralHarvester',
                    },
               }
          })(),
     )

     // Construct requests for hubHaulers

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // If there is no storage, inform false

               if (!room.storage) return false

               // Otherwise if there is no hubLink or terminal, inform false

               if (!room.get('hubLink') && !room.terminal) return false

               return {
                    defaultParts: [MOVE],
                    extraParts: [CARRY],
                    partsMultiplier: 8,
                    minCreeps: 1,
                    minCost: 300,
                    priority: 7,
                    memoryAdditions: {
                         role: 'hubHauler',
                    },
               }
          })(),
     )

     // Construct requests for fastFillers

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
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
                    priority: 0.75,
                    memoryAdditions: {
                         role: 'fastFiller',
                    },
               }
          })(),
     )

     // Get enemyAttackers in the room

     let enemyAttackers: Creep[]

     // If there are no towers

     if (!room.structures.tower.length) {
          // Consider invaders as significant attackers

          enemyAttackers = room.enemyAttackers.filter(function (creep) {
               return !creep.isOnExit()
          })
     }

     // Otherwise
     else {
          // Don't consider invaders

          enemyAttackers = room.enemyAttackers.filter(function (creep) {
               return creep.owner.username !== 'Invader' && !creep.isOnExit()
          })
     }

     // Get the attackValue of the attackers

     let attackStrength = 0

     // Loop through each enemyAttacker

     for (const enemyAttacker of enemyAttackers) {
          // Increase attackValue by the creep's heal power

          attackStrength += enemyAttacker.strength
     }

     // Construct requests for meleeDefenders

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // Inform false if there are no enemyAttackers

               if (!enemyAttackers.length) return false

               if (room.controller.safeMode) return false

               return {
                    defaultParts: [],
                    extraParts: [ATTACK, ATTACK, MOVE],
                    partsMultiplier: attackStrength,
                    minCreeps: undefined,
                    maxCreeps: Math.max(enemyAttackers.length, 5),
                    minCost: 210,
                    priority: 6 + room.creepsFromRoom.meleeDefender.length,
                    memoryAdditions: {
                         role: 'meleeDefender',
                    },
               }
          })(),
     )

     // Get the estimates income

     const estimatedIncome = room.estimateIncome()

     // Construct requests for builders

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // Stop if there are no construction sites

               if (room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) return false

               // If there is a storage

               if (room.storage) {
                    // If the storage is sufficiently full, provide x amount per y enemy in storage

                    if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= builderSpawningWhenStorageThreshold)
                         partsMultiplier += room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000
               }

               // Otherwise if there is no storage
               else partsMultiplier += Math.floor(estimatedIncome / 2)

               // If all RCL 3 extensions are build

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [],
                         extraParts: [WORK, WORK, MOVE, CARRY, CARRY, MOVE, CARRY, CARRY, MOVE, CARRY, MOVE, WORK],
                         partsMultiplier: partsMultiplier / 3,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost: 750,
                         priority: 9 + room.creepsFromRoom.builder.length,
                         memoryAdditions: {
                              role: 'builder',
                         },
                    }
               }

               return {
                    defaultParts: [],
                    extraParts: [MOVE, CARRY, MOVE, WORK],
                    partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority: 9 + room.creepsFromRoom.builder.length,
                    memoryAdditions: {
                         role: 'builder',
                    },
               }
          })(),
     )

     // Construct requests for mainainers

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const priority = 7 + room.creepsFromRoom.maintainer.length

               // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

               const repairTargets = [...room.structures.road, ...room.structures.container].filter(
                    structure => structure.hitsMax * 0.2 >= structure.hits,
               )
               // Get ramparts below their max hits

               const ramparts = room.structures.rampart.filter(rampart => rampart.hits < rampart.hitsMax)

               // If there are no ramparts or repair targets

               if (!ramparts.length && !repairTargets.length) return false

               // Construct the partsMultiplier

               let partsMultiplier = 1

               // For each road, add a multiplier

               partsMultiplier += room.structures.road.length * 0.015

               // For each container, add a multiplier

               partsMultiplier += room.structures.container.length * 0.3

               // For each rampart, add a multiplier

               partsMultiplier += ramparts.length * 0.06

               // For every attackValue, add a multiplier

               partsMultiplier += attackStrength * 0.5

               // For every x energy in storage, add 1 multiplier

               if (room.storage) partsMultiplier += room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 20000

               // If all RCL 3 extensions are build

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [],
                         extraParts: [CARRY, MOVE, WORK],
                         partsMultiplier,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role: 'maintainer',
                         },
                    }
               }

               return {
                    defaultParts: [],
                    extraParts: [MOVE, CARRY, MOVE, WORK],
                    partsMultiplier,
                    minCreeps: undefined,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority,
                    memoryAdditions: {
                         role: 'maintainer',
                    },
               }
          })(),
     )

     // Construct requests for upgraders

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               let partsMultiplier = 1
               let maxCreeps = room.get('upgradePositions').length
               const priority = 8 + room.creepsFromRoom.controllerUpgrader.length

               // If there are enemyAttackers and the controller isn't soon to downgrade

               if (enemyAttackers.length && room.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed)
                    return false

               // Get the controllerLink and baseLink

               const controllerLink = room.controllerLink

               // If the controllerLink is defined

               if (controllerLink) {
                    maxCreeps -= 1

                    const hubLink = room.hubLink
                    const sourceLinks = [room.source1Link, room.source2Link]

                    partsMultiplier = 0

                    if (hubLink) {
                         // Get the range between the controllerLink and hubLink

                         const range = getRange(
                              controllerLink.pos.x - hubLink.pos.x,
                              controllerLink.pos.y - hubLink.pos.y,
                         )

                         // Limit partsMultiplier at the range with a multiplier

                         partsMultiplier += Math.max(
                              partsMultiplier,
                              (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.7) / range,
                         )
                    }

                    for (const sourceLink of sourceLinks) {
                         if (!sourceLink) continue

                         // Get the range between the controllerLink and hubLink

                         const range = getRange(
                              controllerLink.pos.x - sourceLink.pos.x,
                              controllerLink.pos.y - sourceLink.pos.y,
                         )

                         // Limit partsMultiplier at the range with a multiplier

                         partsMultiplier += Math.max(
                              partsMultiplier,
                              (controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) / range,
                         )
                    }
               }

               // If there is a storage

               if (room.storage) {
                    // If the storage is sufficiently full, provide x amount per y enemy in storage

                    if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= upgraderSpawningWhenStorageThreshold)
                         partsMultiplier = Math.pow(room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 10000, 2)
                    // Otherwise, set partsMultiplier to 0
                    else partsMultiplier = 0
               }

               // Otherwise if there is no storage
               else {
                    partsMultiplier += estimatedIncome * 2
               }

               // If there are construction sites of my ownership in the room, set multiplier to 1

               if (room.find(FIND_MY_CONSTRUCTION_SITES).length) partsMultiplier = 0

               // Intitialize the threshold

               const threshold = 0.15

               // If the controllerContainer or controllerLink exists

               if (room.get('controllerContainer') || controllerLink) {
                    // If the controller is level 8

                    if (room.controller.level === 8) {
                         // If the controller is near to downgrading

                         if (room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                              partsMultiplier = Math.max(partsMultiplier, 3)

                         partsMultiplier = Math.min(Math.round(partsMultiplier / 3), 5)
                         if (partsMultiplier === 0) return false

                         return {
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
                                   role: 'controllerUpgrader',
                              },
                         }
                    }

                    // Otherwise if the spawnEnergyCapacity is more than 800

                    if (spawnEnergyCapacity >= 800) {
                         // If the controller is near to downgrading, set partsMultiplier to x

                         if (room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                              partsMultiplier = Math.max(partsMultiplier, 6)

                         partsMultiplier = Math.round(partsMultiplier / 6)
                         if (partsMultiplier === 0) return false

                         return {
                              defaultParts: [CARRY],
                              extraParts: [WORK, WORK, WORK, MOVE, WORK, WORK, WORK],
                              partsMultiplier,
                              threshold,
                              minCreeps: undefined,
                              maxCreeps,
                              minCost: 700,
                              priority,
                              memoryAdditions: {
                                   role: 'controllerUpgrader',
                              },
                         }
                    }

                    // If the controller is near to downgrading, set partsMultiplier to x

                    if (room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                         partsMultiplier = Math.max(partsMultiplier, 4)

                    partsMultiplier = Math.round(partsMultiplier / 4)
                    if (partsMultiplier === 0) return false

                    return {
                         defaultParts: [CARRY],
                         extraParts: [WORK, MOVE, WORK, WORK, WORK],
                         partsMultiplier,
                         threshold,
                         minCreeps: undefined,
                         maxCreeps,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role: 'controllerUpgrader',
                         },
                    }
               }

               // If the controller is near to downgrading, set partsMultiplier to x

               if (room.controller.ticksToDowngrade < controllerDowngradeUpgraderNeed)
                    partsMultiplier = Math.max(partsMultiplier, 1)
               if (room.controller.level < 2) partsMultiplier = Math.max(partsMultiplier, 1)

               if (spawnEnergyCapacity >= 800) {
                    return {
                         defaultParts: [],
                         extraParts: [CARRY, MOVE, WORK],
                         partsMultiplier,
                         threshold,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority,
                         memoryAdditions: {
                              role: 'controllerUpgrader',
                         },
                    }
               }

               return {
                    defaultParts: [],
                    extraParts: [MOVE, CARRY, MOVE, WORK],
                    partsMultiplier,
                    threshold,
                    maxCreeps: Infinity,
                    minCost: 250,
                    priority,
                    memoryAdditions: {
                         role: 'controllerUpgrader',
                    },
               }
          })(),
     )

     let remoteHaulerNeed = 0

     const minRemotePriority = 10
     let remotePriority

     let remoteName
     let remoteNeeds
     let totalRemoteNeed
     let sourcesByEfficacy

     const remoteNamesByEfficacy: string[] = room.get('remoteNamesByEfficacy')

     for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
          remoteName = remoteNamesByEfficacy[index]
          remoteNeeds = Memory.rooms[remoteName].needs

          // Add up econ needs for this room

          totalRemoteNeed =
               Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteHauler], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteReserver], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteDefender], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteCoreAttacker], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteDismantler], 0)

          // If there is a need for any econ creep, inform the index

          if (totalRemoteNeed <= 0) continue

          remotePriority = minRemotePriority + index

          // Get the sources in order of efficacy

          sourcesByEfficacy = findRemoteSourcesByEfficacy(remoteName)

          remoteHaulerNeed += Math.max(remoteNeeds[remoteNeedsIndex.remoteHauler], 0)

          // Construct requests for source1RemoteHarvesters

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.source1RemoteHarvester] <= 0) return false

                    if (spawnEnergyCapacity >= 950) {
                         return {
                              defaultParts: [CARRY],
                              extraParts: [WORK, MOVE],
                              partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0),
                              groupComparator: room.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                              threshold: 0.1,
                              minCreeps: 1,
                              maxCreeps: Infinity,
                              maxCostPerCreep: 50 + 150 * 6,
                              minCost: 200,
                              priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                              memoryAdditions: {
                                   role: 'source1RemoteHarvester',
                              },
                         }
                    }

                    return {
                         defaultParts: [CARRY],
                         extraParts: [WORK, WORK, MOVE],
                         partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0),
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].source1RemoteHarvester,
                         threshold: 0.1,
                         minCreeps: undefined,
                         maxCreeps: global[remoteName]?.source1HarvestPositions?.length || Infinity,
                         maxCostPerCreep: 50 + 150 * 6,
                         minCost: 200,
                         priority: remotePriority - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                         memoryAdditions: {
                              role: 'source1RemoteHarvester',
                         },
                    }
               })(),
          )

          // Construct requests for source2RemoteHarvesters

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.source2RemoteHarvester] <= 0) return false

                    if (spawnEnergyCapacity >= 950) {
                         return {
                              defaultParts: [CARRY],
                              extraParts: [WORK, MOVE],
                              partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0),
                              groupComparator: room.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                              threshold: 0.1,
                              minCreeps: 1,
                              maxCreeps: Infinity,
                              minCost: 200,
                              priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                              memoryAdditions: {
                                   role: 'source2RemoteHarvester',
                              },
                         }
                    }

                    return {
                         defaultParts: [],
                         extraParts: [WORK, MOVE],
                         partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0),
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].source2RemoteHarvester,
                         threshold: 0.1,
                         minCreeps: undefined,
                         maxCreeps: global[remoteName]?.source2HarvestPositions?.length || Infinity,
                         maxCostPerCreep: 150 * 6,
                         minCost: 200,
                         priority: remotePriority - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                         memoryAdditions: {
                              role: 'source2RemoteHarvester',
                         },
                    }
               })(),
          )

          // Construct requests for remoteReservers

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

                    if (spawnEnergyCapacity < 750) return false

                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.remoteReserver] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts: [MOVE, CLAIM],
                         partsMultiplier: 4,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteReserver,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 750,
                         priority: remotePriority + 0.3,
                         memoryAdditions: {
                              role: 'remoteReserver',
                         },
                    }
               })(),
          )

          // Construct requests for remoteDefenders

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    const minCost = 400
                    const cost = 900
                    const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE]
                    const strengthOfParts = findStrengthOfParts(extraParts)

                    // If there isn't enough spawnEnergyCapacity to spawn a remoteDefender, inform false

                    if (spawnEnergyCapacity < minCost) return false

                    // If there are no related needs

                    if (remoteNeeds[remoteNeedsIndex.remoteDefender] <= 0) return false

                    // If max spawnable strength is less that needed

                    if (strengthOfParts * (spawnEnergyCapacity / cost) < remoteNeeds[remoteNeedsIndex.remoteDefender]) {
                         // Abandon the room for some time

                         Memory.rooms[remoteName].abandoned = 1000
                         return false
                    }

                    const partsMultiplier = Math.max(
                         Math.floor(remoteNeeds[remoteNeedsIndex.remoteDefender] / strengthOfParts) * 1.2,
                         1,
                    )

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteDefender,
                         minCreeps: 1,
                         minCost,
                         priority: minRemotePriority - 3,
                         memoryAdditions: {
                              role: 'remoteDefender',
                         },
                    }
               })(),
          )

          // Construct requests for remoteCoreAttackers

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no related needs

                    if (remoteNeeds[remoteNeedsIndex.remoteCoreAttacker] <= 0) return false

                    // Define the minCost and strength

                    const cost = 130
                    const extraParts = [ATTACK, MOVE]
                    const minCost = cost * extraParts.length

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier: 50 / extraParts.length,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteCoreAttacker,
                         minCreeps: 1,
                         minCost,
                         priority: minRemotePriority - 2,
                         memoryAdditions: {
                              role: 'remoteCoreAttacker',
                         },
                    }
               })(),
          )

          // Construct requests for remoteDismantler

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no related needs

                    if (remoteNeeds[remoteNeedsIndex.remoteDismantler] <= 0) return false

                    // Define the minCost and strength

                    const cost = 150
                    const extraParts = [WORK, MOVE]

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier: 50 / extraParts.length,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName].remoteDismantler,
                         minCreeps: 1,
                         minCost: cost * 2,
                         priority: minRemotePriority - 1,
                         memoryAdditions: {
                              role: 'remoteDismantler',
                         },
                    }
               })(),
          )
     }

     // Construct requests for remoteHaulers

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {


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
                         minCost: 300,
                         priority: minRemotePriority - 0.2,
                         memoryAdditions: {
                              role: 'remoteHauler',
                         },
                    }
               }
 */
               partsMultiplier = remoteHaulerNeed

               return {
                    defaultParts: [],
                    extraParts: [CARRY, MOVE],
                    threshold: 0.1,
                    partsMultiplier,
                    maxCreeps: Infinity,
                    minCost: 200,
                    priority: minRemotePriority - 0.2,
                    memoryAdditions: {
                         role: 'remoteHauler',
                    },
               }
          })(),
     )

     // Construct requests for scouts

     room.constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               return {
                    defaultParts: [MOVE],
                    extraParts: [],
                    partsMultiplier: 1,
                    minCreeps: 2,
                    maxCreeps: Infinity,
                    minCost: 100,
                    priority: 6,
                    memoryAdditions: {
                         role: 'scout',
                    },
               }
          })(),
     )

     if (room.memory.claimRequest) {
          const claimRequestNeeds = Memory.claimRequests[room.memory.claimRequest].needs

          // Construct requests for claimers

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there is no claimer need

                    if (claimRequestNeeds[claimRequestNeedsIndex.claimer] <= 0) return false

                    return {
                         defaultParts: [MOVE, MOVE, CLAIM, MOVE],
                         extraParts: [],
                         partsMultiplier: 1,
                         minCreeps: 1,
                         minCost: 750,
                         priority: 8.1,
                         memoryAdditions: {
                              role: 'claimer',
                         },
                    }
               })(),
          )

          // Requests for vanguard

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there is no vanguard need

                    if (claimRequestNeeds[claimRequestNeedsIndex.vanguard] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts: [WORK, MOVE, CARRY, MOVE],
                         partsMultiplier: claimRequestNeeds[claimRequestNeedsIndex.vanguard],
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost: 250,
                         priority: 8.2 + room.creepsFromRoom.vanguard.length,
                         memoryAdditions: {
                              role: 'vanguard',
                         },
                    }
               })(),
          )

          // Requests for vanguardDefender

          room.constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    const minCost = 400
                    const cost = 900
                    const extraParts = [RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, HEAL, MOVE]
                    const strengthOfParts = findStrengthOfParts(extraParts)

                    // If there isn't enough spawnEnergyCapacity to spawn a vanguardDefender, inform false

                    if (spawnEnergyCapacity < minCost) return false

                    // If there are no related needs

                    if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0) return false

                    // If max spawnable strength is less that needed

                    if (
                         strengthOfParts * (spawnEnergyCapacity / cost) <
                         claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender]
                    ) {
                         // Abandon the room for some time

                         Memory.claimRequests[room.memory.claimRequest].abadon = 20000
                         /* Memory.rooms[remoteName].abandoned = 1000 */
                         return false
                    }

                    const partsMultiplier = Math.max(
                         Math.floor(claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] / strengthOfParts) * 1.2,
                         1,
                    )

                    // If there is no vanguardDefender need

                    if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier,
                         minCreeps: 1,
                         minCost,
                         priority: 8 + room.creepsFromRoom.vanguardDefender.length,
                         memoryAdditions: {
                              role: 'vanguardDefender',
                         },
                    }
               })(),
          )
     }

     // If CPU logging is enabled, log the CPU used by this manager

     if (Memory.cpuLogging)
          customLog(
               'Spawn Request Manager',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               constants.colors.lightGrey,
          )
}
