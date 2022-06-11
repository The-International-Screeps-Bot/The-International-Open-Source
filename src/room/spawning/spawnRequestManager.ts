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

     // Construct a record of spawnRequests

     const spawnRequests: { [key: string]: SpawnRequest } = {}

     // Structure info about the room's spawn energy

     const spawnEnergyAvailable = room.energyAvailable
     const spawnEnergyCapacity = room.energyCapacityAvailable

     // Get the energyStructures

     const energyStructures = room.get('structuresForSpawning')
     const dryRun = true

     // Create a spawn request given some values

     function createSpawnRequest(priority: number, body: BodyPartConstant[], tier: number, cost: number, memory: any) {
          // Set the memory's communeName to this room's name

          memory.communeName = room.name

          // Add the components to spawnRequests

          spawnRequests[priority] = {
               body,
               tier,
               cost,
               extraOpts: {
                    memory,
                    energyStructures,
                    dryRun,
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

          if (
               room.myCreeps.source1Harvester.length + room.myCreeps.source2Harvester.length === 0 ||
               room.myCreeps.hauler.length === 0
          ) {
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

          while (
               opts.minCreeps >
               (opts.groupComparator
                    ? opts.groupComparator.length
                    : room.creepsFromRoom[opts.memoryAdditions.role].length)
          ) {
               // Construct important imformation for the spawnRequest

               const body: BodyPartConstant[] = []
               let tier = 0
               let cost = 0

               // If there are defaultParts

               if (opts.defaultParts.length) {
                    // Increment tier

                    tier += 1

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

                              remainingAllowedParts += 1

                              // Decrease the partIndex

                              partIndex -= 1
                         }

                         // Decrease tier

                         tier -= 1
                    }
               }

               // Create a spawnRequest using previously constructed information

               createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

               // Reduce the number of minCreeps

               opts.minCreeps -= 1
          }

          // If minCreeps is equal to 0, stop
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

               totalExtraParts -= Game.creeps[creepName].body.length - opts.defaultParts.length
          }

          // If there aren't enough requested parts to justify spawning a creep, stop

          if (totalExtraParts < maxPartsPerCreep * (opts.threshold || 0.25)) return

          // Subtract maxCreeps by the existing number of creeps of this role

          opts.maxCreeps -= opts.groupComparator
               ? opts.groupComparator.length
               : room.creepsFromRoom[opts.memoryAdditions.role].length

          // So long as there are totalExtraParts left to assign

          while (totalExtraParts >= opts.extraParts.length && opts.maxCreeps > 0) {
               // Construct important imformation for the spawnRequest

               const body: BodyPartConstant[] = []
               let tier = 0
               let cost = 0

               // Construct from totalExtraParts at a max of 50, at equal to extraOpts's length

               let remainingAllowedParts = maxPartsPerCreep

               // If there are defaultParts

               if (opts.defaultParts.length) {
                    // Increment tier

                    tier += 1

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

                         remainingAllowedParts -= 1
                         totalExtraParts -= 1
                    }

                    // Increase tier

                    tier += 1
               }

               // If the cost is more than the maxCostPerCreep or there are negative remainingAllowedParts or the body is more than 50

               if (cost > maxCostPerCreep || remainingAllowedParts < 0) {
                    // Assign partIndex as the length of extraParts

                    let partIndex = opts.extraParts.length - 1

                    // So long as partIndex is greater or equal to 0

                    while (partIndex >= 0) {
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

                         remainingAllowedParts += 1
                         totalExtraParts += 1

                         // Decrease the partIndex

                         partIndex -= 1
                    }

                    // Decrease tier

                    tier -= 1
               }

               // Create a spawnRequest using previously constructed information

               createSpawnRequest(opts.priority, body, tier, cost, opts.memoryAdditions)

               // Decrease maxCreeps counter

               opts.maxCreeps -= 1
          }
     }

     const mostOptimalSource = room.findSourcesByEfficacy()[0]

     // Construct requests for sourceHarvesters

     constructSpawnRequests(
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

               if (room.get(`${sourceName}Container`)) {
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

     constructSpawnRequests(
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

               if (room.get(`${sourceName}Container`)) {
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

     constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const priority = 0.5 + room.creepsFromRoom.hauler.length * 1.5

               // Construct the required carry parts

               let requiredCarryParts = 10

               // If there is no source1Link, increase requiredCarryParts using the source's path length

               if (!room.get('source1Link'))
                    requiredCarryParts += findCarryPartsRequired((room.global.source1PathLength || 0) * 2, 10)

               // If there is no source2Link, increase requiredCarryParts using the source's path length

               if (!room.get('source2Link'))
                    requiredCarryParts += findCarryPartsRequired((room.global.source2PathLength || 0) * 2, 10)

               // If there is a controllerContainer, increase requiredCarryParts using the hub-structure path length

               if (room.get('controllerContainer') && !room.get('controllerLink'))
                    requiredCarryParts += findCarryPartsRequired(
                         (room.global.upgradePathLength || 0) * 2,
                         room.getPartsOfRoleAmount('controllerUpgrader', WORK),
                    )

               // If all RCL 3 extensions are build

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

     constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // If there is no extractor, inform false

               if (!room.structures.extractor.length) return false

               if (!room.storage) return false

               if (room.storage.store.energy < 40000) return false

               // If there is no terminal, inform false

               if (!room.terminal) return false

               if (room.terminal.store.getFreeCapacity() <= 10000) return false

               // Get the mineral. If it's out of resources, inform false

               const mineral: Mineral = room.get('mineral')
               if (mineral.mineralAmount === 0) return false

               let minCost = 900

               if (spawnEnergyCapacity < minCost) return false

               return {
                    defaultParts: [],
                    extraParts: [WORK, WORK, MOVE, WORK, WORK, MOVE, WORK, MOVE, CARRY, CARRY, MOVE, WORK],
                    partsMultiplier: room.get('mineralHarvestPositions')?.length * 4,
                    minCreeps: 1,
                    minCost,
                    priority: 6 + room.creepsFromRoom.mineralHarvester.length * 3,
                    memoryAdditions: {
                         role: 'mineralHarvester',
                    },
               }
          })(),
     )

     // Construct requests for hubHaulers

     constructSpawnRequests(
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
                    priority: 6,
                    memoryAdditions: {
                         role: 'hubHauler',
                    },
               }
          })(),
     )

     // Construct requests for fastFillers

     constructSpawnRequests(
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

          enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
               filter: creep =>
                    !allyList.has(creep.owner.username) &&
                    !creep.isOnExit() &&
                    creep.hasPartsOfTypes([WORK, ATTACK, RANGED_ATTACK]),
          })
     }

     // Otherwise
     else {
          // Don't consider invaders

          enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
               filter: creep =>
                    creep.owner.username !== 'Invader' &&
                    !allyList.has(creep.owner.username) &&
                    !creep.isOnExit() &&
                    creep.hasPartsOfTypes([WORK, ATTACK, RANGED_ATTACK]),
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

     constructSpawnRequests(
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

     constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               // Stop if there are no construction sites

               if (room.find(FIND_MY_CONSTRUCTION_SITES).length === 0) return false

               let partsMultiplier = 0

               // If there is a storage

               if (room.storage) {
                    // If the storage is sufficiently full, provide x amount per y enemy in storage

                    if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) >= builderSpawningWhenStorageThreshold)
                         partsMultiplier += room.storage.store.getUsedCapacity(RESOURCE_ENERGY) / 8000
               }

               // Otherwise if there is no storage
               else partsMultiplier += estimatedIncome * 2

               // If all RCL 3 extensions are build

               if (spawnEnergyCapacity >= 800) {
                    partsMultiplier /= 3

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

     constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               const priority = 7 + room.creepsFromRoom.maintainer.length

               // Get roads

               const roads: (StructureRoad | StructureContainer)[] = room.get('road')
               // Get containers

               const containers: StructureContainer[] = room.get('container')
               // Filter possibleRepairTargets with less than 1/5 health, stopping if there are none

               const repairTargets = roads
                    .concat(containers)
                    .filter(structure => structure.hitsMax * 0.2 >= structure.hits)
               // Get ramparts below their max hits

               const ramparts = (room.get('rampart') as StructureRampart[]).filter(
                    rampart => rampart.hits < rampart.hitsMax,
               )

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

     constructSpawnRequests(
          (function (): SpawnRequestOpts | false {
               let partsMultiplier = 1
               let maxCreeps = room.get('upgradePositions').length
               const priority = 8 + room.creepsFromRoom.controllerUpgrader.length

               // If there are enemyAttackers and the controller isn't soon to downgrade

               if (enemyAttackers.length && room.controller.ticksToDowngrade > controllerDowngradeUpgraderNeed)
                    return false

               // Get the controllerLink and baseLink

               const controllerLink: StructureLink | undefined = room.get('controllerLink')

               // If the controllerLink is defined

               if (controllerLink) {
                    maxCreeps -= 1

                    const hubLink: StructureLink | undefined = room.get('hubLink')
                    const sourceLinks: StructureLink[] = [room.get('source1Link'), room.get('source2Link')]

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
                              partsMultiplier = Math.max(partsMultiplier, 5)

                         partsMultiplier = Math.min(Math.round(partsMultiplier / 5), 3)
                         if (partsMultiplier === 0) return false

                         return {
                              defaultParts: [MOVE],
                              extraParts: [WORK, WORK, WORK, WORK, MOVE, CARRY, WORK],
                              partsMultiplier,
                              threshold,
                              minCreeps: 1,
                              minCost: 650,
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

     // Get remotes by order of efficacy

     const remoteNamesByEfficacy: string[] = room.get('remoteNamesByEfficacy')

     for (let index = 0; index < remoteNamesByEfficacy.length; index += 1) {
          const remoteName = remoteNamesByEfficacy[index]
          const remoteNeeds = Memory.rooms[remoteName].needs
          // Add up econ needs for this room

          const remoteNeed =
               Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteHauler], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteReserver], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteDefender], 0) +
               Math.max(remoteNeeds[remoteNeedsIndex.remoteCoreAttacker], 0)

          // If there is a need for any econ creep, inform the index

          if (remoteNeed <= 0) continue

          // Get the sources in order of efficacy

          const sourcesByEfficacy = findRemoteSourcesByEfficacy(remoteName)

          // Construct requests for source1RemoteHarvesters

          constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.source1RemoteHarvester] <= 0) return false

                    if (spawnEnergyCapacity >= 950) {
                         return {
                              defaultParts: [CARRY],
                              extraParts: [WORK, MOVE],
                              partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0),
                              groupComparator: room.creepsFromRoomWithRemote[remoteName]?.source1RemoteHarvester,
                              threshold: 0.1,
                              minCreeps: 1,
                              maxCreeps: Infinity,
                              maxCostPerCreep: 50 + 150 * 6,
                              minCost: 200,
                              priority: 10 + index - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                              memoryAdditions: {
                                   role: 'source1RemoteHarvester',
                              },
                         }
                    }

                    return {
                         defaultParts: [CARRY],
                         extraParts: [WORK, WORK, MOVE],
                         partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source1RemoteHarvester], 0),
                         groupComparator: room.creepsFromRoomWithRemote[remoteName]?.source1RemoteHarvester,
                         threshold: 0.1,
                         minCreeps: undefined,
                         maxCreeps: global[remoteName]?.source1HarvestPositions?.length || Infinity,
                         maxCostPerCreep: 50 + 150 * 6,
                         minCost: 200,
                         priority: 10 + index - (sourcesByEfficacy[0] === 'source1' ? 0.1 : 0),
                         memoryAdditions: {
                              role: 'source1RemoteHarvester',
                         },
                    }
               })(),
          )

          // Construct requests for source2RemoteHarvesters

          constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.source2RemoteHarvester] <= 0) return false

                    if (spawnEnergyCapacity >= 950) {
                         return {
                              defaultParts: [CARRY],
                              extraParts: [WORK, MOVE],
                              partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0),
                              groupComparator: room.creepsFromRoomWithRemote[remoteName]?.source2RemoteHarvester,
                              threshold: 0.1,
                              minCreeps: 1,
                              maxCreeps: Infinity,
                              minCost: 200,
                              priority: 10 + index - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                              memoryAdditions: {
                                   role: 'source2RemoteHarvester',
                              },
                         }
                    }

                    return {
                         defaultParts: [],
                         extraParts: [WORK, MOVE],
                         partsMultiplier: Math.max(remoteNeeds[remoteNeedsIndex.source2RemoteHarvester], 0),
                         groupComparator: room.creepsFromRoomWithRemote[remoteName]?.source2RemoteHarvester,
                         threshold: 0.1,
                         minCreeps: undefined,
                         maxCreeps: global[remoteName]?.source2HarvestPositions?.length || Infinity,
                         maxCostPerCreep: 150 * 6,
                         minCost: 200,
                         priority: 10 + index - (sourcesByEfficacy[0] === 'source2' ? 0.1 : 0),
                         memoryAdditions: {
                              role: 'source2RemoteHarvester',
                         },
                    }
               })(),
          )

          // Construct requests for remoteHaulers

          constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    let partsMultiplier = 0

                    for (const roomName of remoteNamesByEfficacy) {
                         partsMultiplier += Math.max(Memory.rooms[roomName].needs[remoteNeedsIndex.remoteHauler], 0)
                    }

                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.remoteHauler] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts: [CARRY, MOVE],
                         threshold: 0.1,
                         partsMultiplier,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost: 200,
                         priority: 10.2 + index,
                         memoryAdditions: {
                              role: 'remoteHauler',
                         },
                    }
               })(),
          )

          // Construct requests for remoteReservers

          constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there isn't enough spawnEnergyCapacity to spawn a remoteReserver, inform false

                    if (spawnEnergyCapacity < 750) return false

                    // If there are no needs for this room, inform false

                    if (remoteNeeds[remoteNeedsIndex.remoteReserver] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts: [MOVE, CLAIM],
                         partsMultiplier: 4,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName]?.remoteReserver,
                         minCreeps: 1,
                         maxCreeps: Infinity,
                         minCost: 750,
                         priority: 10.3 + index,
                         memoryAdditions: {
                              role: 'remoteReserver',
                         },
                    }
               })(),
          )

          // Construct requests for remoteDefenders

          constructSpawnRequests(
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

                    const partsMultiplier =
                    Math.max(Math.floor(remoteNeeds[remoteNeedsIndex.remoteDefender] / strengthOfParts) * 1.2, 1)

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName]?.remoteDefender,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
                         minCost,
                         priority: 7,
                         memoryAdditions: {
                              role: 'remoteDefender',
                         },
                    }
               })(),
          )

          // Construct requests for remoteCoreAttackers

          constructSpawnRequests(
               (function (): SpawnRequestOpts | false {
                    // If there are no related needs

                    if (remoteNeeds[remoteNeedsIndex.remoteCoreAttacker] <= 0) return false

                    // Define the minCost and strength

                    const cost = 130
                    const minCost = cost * 2
                    const extraParts = [ATTACK, MOVE]

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier: 50 / extraParts.length,
                         groupComparator: room.creepsFromRoomWithRemote[remoteName]?.remoteCoreAttacker,
                         minCreeps: undefined,
                         maxCreeps: 1,
                         minCost,
                         priority: 9,
                         memoryAdditions: {
                              role: 'remoteCoreAttacker',
                         },
                    }
               })(),
          )
     }

     // Construct requests for scouts

     constructSpawnRequests(
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

          constructSpawnRequests(
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

          constructSpawnRequests(
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

          constructSpawnRequests(
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

                    if (strengthOfParts * (spawnEnergyCapacity / cost) < claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender]) {
                         // Abandon the room for some time

                         /* Memory.rooms[remoteName].abandoned = 1000 */
                         return false
                    }

                    const partsMultiplier =
                         Math.max(Math.floor(claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] / strengthOfParts) * 1.2, 1)

                    // If there is no vanguardDefender need

                    if (claimRequestNeeds[claimRequestNeedsIndex.vanguardDefender] <= 0) return false

                    return {
                         defaultParts: [],
                         extraParts,
                         partsMultiplier,
                         minCreeps: undefined,
                         maxCreeps: Infinity,
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

     // Inform spawnRequests

     return spawnRequests
}
