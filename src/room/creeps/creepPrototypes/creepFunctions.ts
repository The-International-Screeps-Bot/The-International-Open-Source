import {
  impassibleStructureTypes,
  quadAttackMemberOffsets,
  roomDimensions,
  Result,
  CreepMemoryKeys,
  RoomMemoryKeys,
  ReservedCoordTypes,
  WorkTypes,
  RoomLogisticsRequestTypes,
  packedCoordLength,
} from '../../../constants/general'
import { RoomStatsKeys } from '../../../constants/stats'
import {
  findClosestObject,
  findObjectWithID,
  getRangeXY,
  findClosestObjectInRange,
  getRange,
  findWithLowestScore,
} from 'utils/utils'
import {
  packCoord, unpackCoordAsPos
} from 'other/codec'
import { StatsManager } from 'international/stats'
import { CreepUtils } from '../creepUtils'
import { RoomManager } from 'room/room'
import { RoomLogisticsRequest } from 'types/roomLogistics'
import { CustomPathFinder } from 'international/customPathFinder'
import { CommuneUtils } from 'room/commune/communeUtils'
import { MyCreepUtils } from '../myCreepUtils'
import { StructureUtils } from 'room/structureUtils'
import { CreepOps } from '../creepOps'

Creep.prototype.update = function () {}

Creep.prototype.initRun = function () {}

Creep.prototype.endRun = function () {}

Creep.prototype.isDying = function () {
  // Stop if creep is spawning

  if (this.spawning) return false

  // If the creep's remaining ticks are more than the estimated spawn time, inform false

  if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

  // Record creep as isDying

  return true
}
PowerCreep.prototype.isDying = function () {
  return this.ticksToLive < POWER_CREEP_LIFE_TIME / 5
}

PowerCreep.prototype.advancedTransfer = Creep.prototype.advancedTransfer = function (
  target,
  resourceType = RESOURCE_ENERGY,
  amount,
) {
  // If creep isn't in transfer range

  if (this.pos.getRangeTo(target.pos) > 1) {
    // Make a moveRequest to target and inform false

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: target.pos, range: 1 }],
      avoidEnemyRanges: true,
    })
    return false
  }

  if (this.movedResource) return false

  // Try to transfer, recording the result

  const transferResult = this.transfer(target, resourceType, amount)
  this.message += transferResult

  // If the action can be considered a success

  if (
    transferResult === OK ||
    transferResult === ERR_FULL ||
    transferResult === ERR_NOT_ENOUGH_RESOURCES
  ) {
    this.movedResource = true
    return true
  }

  // Otherwise inform false

  return false
}

Creep.prototype.advancedWithdraw = function (target, resourceType = RESOURCE_ENERGY, amount) {
  // If creep isn't in transfer range

  if (this.pos.getRangeTo(target.pos) > 1) {
    // Create a moveRequest to the target and inform failure

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: target.pos, range: 1 }],
      avoidEnemyRanges: true,
    })

    return false
  }

  if (this.movedResource) return false

  // Try to withdraw, recording the result

  const withdrawResult = this.withdraw(target as any, resourceType, amount)
  this.message += withdrawResult

  // If the action can be considered a success

  if (withdrawResult === OK || withdrawResult === ERR_FULL) {
    this.movedResource = true
    return true
  }

  // Otherwise inform false

  return false
}

Creep.prototype.advancedPickup = function (target) {
  // If creep isn't in transfer range

  if (this.pos.getRangeTo(target.pos) > 1) {
    // Make a moveRequest to the target and inform failure

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: target.pos, range: 1 }],
      avoidEnemyRanges: true,
    })

    return false
  }

  if (this.movedResource) return false

  const pickupResult = this.pickup(target)
  this.message += pickupResult

  // Try to pickup. if the action can be considered a success

  if (pickupResult === OK || pickupResult === ERR_FULL) {
    this.movedResource = true
    return true
  }

  // Otherwise inform false

  return false
}

Creep.prototype.advancedBuild = function () {
  const cSiteTarget = this.room.roomManager.cSiteTarget
  if (!cSiteTarget) return Result.fail

  // Try to run catch every situation of results

  if (this.builderGetEnergy() === Result.stop) return Result.action

  if (this.advancedBuildCSite(cSiteTarget) !== Result.success) return Result.action

  if (this.builderGetEnergy() === Result.stop) return Result.action
  return Result.success
}

Creep.prototype.builderGetEnergy = function () {
  // If there is a sufficient storing structure

  if (this.room.communeManager.buildersMakeRequests) return Result.noAction
  if (!this.needsResources()) return Result.noAction

  if (this.room.communeManager && CommuneUtils.storingStructures(this.room).length) {
    if (this.room.roomManager.resourcesInStoringStructures.energy < 1000) {
      return Result.noAction
    }

    CreepOps.runRoomLogisticsRequestAdvanced(this, {
      types: new Set<RoomLogisticsRequestTypes>([
        RoomLogisticsRequestTypes.withdraw,
        RoomLogisticsRequestTypes.pickup,
        RoomLogisticsRequestTypes.offer,
      ]),
      resourceTypes: new Set([RESOURCE_ENERGY]),
    })

    // Don't try to build if we still need resources

    if (this.needsResources()) return Result.stop
    return Result.success
  }

  // We don't have a storage or terminal, don't allow use of sourceContainers

  CreepOps.runRoomLogisticsRequestAdvanced(this, {
    types: new Set<RoomLogisticsRequestTypes>([
      RoomLogisticsRequestTypes.withdraw,
      RoomLogisticsRequestTypes.pickup,
      RoomLogisticsRequestTypes.offer,
    ]),
    resourceTypes: new Set([RESOURCE_ENERGY]),
    conditions: (request: RoomLogisticsRequest) => {
      const target = findObjectWithID(request.targetID)

      // Don't get energy from the sources
      for (const positions of this.room.roomManager.communeSourceHarvestPositions) {
        if (getRange(target.pos, positions[0]) <= 1) return false
      }

      return true
    },
  })
  // Don't try to build if we still need resources

  if (this.needsResources()) return Result.stop
  return Result.success
}

Creep.prototype.advancedBuildCSite = function (cSite) {
  this.actionCoord = cSite.pos

  // If the cSite is out of range

  if (getRange(this.pos, cSite.pos) > 3) {
    this.message = '➡️🚧'

    // Make a move request to it

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: cSite.pos, range: 3 }],
      avoidEnemyRanges: true,
      defaultCostMatrix(roomName) {
        const roomManager = RoomManager.roomManagers[roomName]
        if (!roomManager) return false

        return roomManager.defaultCostMatrix
      },
    })

    return Result.action
  }

  if (this.worked) return Result.noAction

  // Buld the cSite

  if (this.build(cSite) !== OK) return Result.fail

  // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

  const energySpentOnConstruction = CreepUtils.findEnergySpentOnConstruction(
    this,
    cSite,
    MyCreepUtils.parts(this).work,
  )

  this.nextStore.energy -= energySpentOnConstruction

  // Add control points to total controlPoints counter and say the success

  StatsManager.updateStat(
    this.room.name,
    RoomStatsKeys.EnergyOutputBuild,
    energySpentOnConstruction,
  )
  this.message = `🚧 ` + energySpentOnConstruction

  return Result.success
}

Creep.prototype.advancedBuildAllyCSite = function () {
  const { room } = this

  // If there is no construction target ID

  if (!room.memory[RoomMemoryKeys.constructionSiteTarget]) {
    // Try to find a construction target. If none are found, stop

    room.findAllyCSiteTargetID(this)
  }

  // Convert the construction target ID into a game object

  let cSiteTarget = findObjectWithID(room.memory[RoomMemoryKeys.constructionSiteTarget])

  // If there is no construction target

  if (!cSiteTarget) {
    // Try to find a construction target. If none are found, stop

    room.findAllyCSiteTargetID(this)
  }

  // Convert the construction target ID into a game object, stopping if it's undefined

  cSiteTarget = findObjectWithID(room.memory[RoomMemoryKeys.constructionSiteTarget])

  // Stop if the cSite is undefined

  if (!cSiteTarget) return false

  this.message = 'ABCS'

  // If the cSite is out of range

  if (getRangeXY(this.pos.x, cSiteTarget.pos.x, this.pos.y, cSiteTarget.pos.y) > 3) {
    this.message = '➡️CS'

    // Make a move request to it

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: cSiteTarget.pos, range: 3 }],
      avoidEnemyRanges: true,
      defaultCostMatrix(roomName) {
        const roomManager = RoomManager.roomManagers[roomName]
        if (!roomManager) return false

        return roomManager.defaultCostMatrix
      },
    })

    return true
  }

  // Otherwise

  // Try to build the construction site

  const buildResult = this.build(cSiteTarget)

  // If the build worked

  if (buildResult === OK) {
    // Find the build amount by finding the smaller of the creep's work and the progress left for the cSite divided by build power

    const energySpentOnConstruction = CreepUtils.findEnergySpentOnConstruction(
      this,
      cSiteTarget,
      MyCreepUtils.parts(this).work,
    )

    this.nextStore.energy -= energySpentOnConstruction

    // Add control points to total controlPoints counter and say the success

    StatsManager.updateStat(
      this.room.name,
      RoomStatsKeys.EnergyOutputBuild,
      energySpentOnConstruction,
    )
    this.message = `🚧${energySpentOnConstruction}`

    // Inform true

    return true
  }

  // Inform true

  return true
}

Creep.prototype.findSourceIndex = function () {
  const { room } = this

  this.message = 'FOSN'

  if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined) return true

  let creepThreshold = 1

  const roomMemory = Memory.rooms[this.name]
  const sourceCount = roomMemory[RoomMemoryKeys.sourceCoords].length / packedCoordLength

  // So long as the creepThreshold is less than 4

  while (creepThreshold < 4) {
    // Find the first source with open spots

    for (let i = 0; i < sourceCount; i++) {
      // If there are still creeps needed to harvest a source under the creepThreshold

      if (
        Math.min(creepThreshold, room.roomManager.sourceHarvestPositions[i].length) -
          room.creepsOfSource[i].length >
        0
      ) {
        this.memory[CreepMemoryKeys.sourceIndex] = i
        return true
      }
    }

    // Otherwise increase the creepThreshold

    creepThreshold += 1
  }

  return false
}

Creep.prototype.findCommuneSourceIndex = function () {
  const { room } = this

  this.message = 'FOSN'

  if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined) return true

  let creepThreshold = 1

  // So long as the creepThreshold is less than 4

  while (creepThreshold < 4) {
    // Find the first source with open spots

    for (const source of room.roomManager.communeSources) {
      const index = source.communeIndex as 0 | 1

      // If there are still creeps needed to harvest a source under the creepThreshold

      if (
        Math.min(creepThreshold, room.roomManager.communeSourceHarvestPositions[index].length) -
          room.creepsOfSource[index].length >
        0
      ) {
        this.memory[CreepMemoryKeys.sourceIndex] = index
        return true
      }
    }

    // Otherwise increase the creepThreshold

    creepThreshold += 1
  }

  return false
}

Creep.prototype.findRemoteSourceIndex = function () {
  const { room } = this

  this.message = 'FOSN'

  if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined) return true

  let creepThreshold = 1

  // So long as the creepThreshold is less than 4

  while (creepThreshold < 4) {
    // Find the first source with open spots

    for (const source of room.roomManager.remoteSources) {
      const index = source.remoteIndex as 0 | 1

      // If there are still creeps needed to harvest a source under the creepThreshold

      if (
        Math.min(creepThreshold, room.roomManager.remoteSourceHarvestPositions[index].length) -
          room.creepsOfSource[index].length >
        0
      ) {
        this.memory[CreepMemoryKeys.sourceIndex] = index
        return true
      }
    }

    // Otherwise increase the creepThreshold

    creepThreshold += 1
  }

  return false
}

Creep.prototype.needsResources = function () {
  const creepMemory = Memory.creeps[this.name]

  // If the creep is empty
  if (this.usedNextStore <= 0) {
    return (creepMemory[CreepMemoryKeys.needsResources] = true)
  }

  // Otherwise if the creep is full
  if (this.freeNextStore <= 0) {
    creepMemory[CreepMemoryKeys.needsResources] = undefined
    return false
  }

  // Otherwise keep it the same
  return creepMemory[CreepMemoryKeys.needsResources]
}

Creep.prototype.hasNonEnergyResource = function () {
  for (const key in this.nextStore) {
    const resourceType = key as ResourceConstant
    if (resourceType === RESOURCE_ENERGY) continue

    // The resourceType is not energy
    return true
  }

  return false
}

Creep.prototype.findRecycleTarget = function () {
  const { room } = this

  const spawns = room.roomManager.structures.spawn.filter(spawn =>
    StructureUtils.isRCLActionable(spawn),
  )

  if (!spawns.length) return false

  if (this.memory[CreepMemoryKeys.recycleTarget]) {
    const spawn = findObjectWithID(this.memory[CreepMemoryKeys.recycleTarget])
    if (spawn) return spawn
  }

  const fastFillerContainers = this.room.roomManager.fastFillerContainers

  for (const container of fastFillerContainers) {
    // If there is no spawn adjacent to the container

    if (!findClosestObjectInRange(container.pos, spawns, 1)) continue

    return findObjectWithID((this.memory[CreepMemoryKeys.recycleTarget] = container.id))
  }

  // Find the closest spawn to the creep

  const spawn = findClosestObject(this.pos, spawns)

  return findObjectWithID((this.memory[CreepMemoryKeys.recycleTarget] = spawn.id))
}

Creep.prototype.advancedRecycle = function () {
  const { room } = this

  const recycleTarget = this.findRecycleTarget()
  if (!recycleTarget) return false

  const range = getRangeXY(this.pos.x, recycleTarget.pos.x, this.pos.y, recycleTarget.pos.y)

  // If the target is a spawn

  if (recycleTarget instanceof StructureSpawn) {
    this.message = '♻️ S'

    // If the recycleTarget is out of actionable range, move to it

    if (range > 1) {
      this.createMoveRequest({
        origin: this.pos,
        goals: [{ pos: recycleTarget.pos, range: 1 }],
        avoidEnemyRanges: true,
      })

      return true
    }

    // If the recycleTarget is a spawn, directly recycle

    return recycleTarget.recycleCreep(this) === OK
  }

  // Otherwise if the target is a container

  this.message = '♻️ C'

  if (range === 0) {
    const spawn = findClosestObject(this.pos, room.roomManager.structures.spawn)

    return spawn.recycleCreep(this) === OK
  }

  // If the recycleTarget is out of actionable range, move to it

  this.createMoveRequest({
    origin: this.pos,
    goals: [{ pos: recycleTarget.pos, range: 0 }],
    avoidEnemyRanges: true,
  })

  return true
}

Creep.prototype.advancedReserveController = function () {
  const { room } = this

  // Get the controller

  const { controller } = room

  // If the creep is in range of 1 of the controller

  if (this.pos.getRangeTo(controller.pos) === 1) {
    // If the controller is reserved and it isn't reserved by me

    if (controller.reservation && controller.reservation.username !== Memory.me) {
      // Try to attack it, informing the result

      this.message = '🗡️'

      return this.attackController(controller) === OK
    }

    // Try to reserve it, informing the result

    this.message = '🤳'

    return this.reserveController(controller) === OK
  }

  // Otherwise, make a move request to it and inform true

  this.message = '⏩🤳'

  this.createMoveRequest({
    origin: this.pos,
    goals: [{ pos: controller.pos, range: 1 }],
    avoidEnemyRanges: true,
    plainCost: 1,
  })

  return true
}

Creep.prototype.passiveHeal = function () {
  const { room } = this

  this.message = 'PH'

  if (!this.worked) {
    // If the creep is below max hits

    if (this.hitsMax > this.hits) {
      // Have it heal itself and stop

      this.heal(this)
      this.worked = WorkTypes.heal
      return false
    }

    let top = Math.max(Math.min(this.pos.y - 1, roomDimensions - 1), 0)
    let left = Math.max(Math.min(this.pos.x - 1, roomDimensions - 1), 0)
    let bottom = Math.max(Math.min(this.pos.y + 1, roomDimensions - 1), 0)
    let right = Math.max(Math.min(this.pos.x + 1, roomDimensions - 1), 0)

    // Find adjacent creeps

    const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

    // Loop through each adjacentCreep

    for (const posData of adjacentCreeps) {
      // If the creep is the posData creep, iterate

      if (this.name === posData.creep.name) continue

      // If the creep is not owned and isn't an ally

      if (!posData.creep.my && !global.settings.allies.includes(posData.creep.owner.username))
        continue

      // If the creep is at full health, iterate

      if (posData.creep.hitsMax === posData.creep.hits) continue

      // have the creep heal the adjacentCreep and stop

      this.heal(posData.creep)
      this.worked = WorkTypes.heal
      return false
    }
  }

  if (this.ranged) return false

  let top = Math.max(Math.min(this.pos.y - 3, roomDimensions - 2), 2)
  let left = Math.max(Math.min(this.pos.x - 3, roomDimensions - 2), 2)
  let bottom = Math.max(Math.min(this.pos.y + 3, roomDimensions - 2), 2)
  let right = Math.max(Math.min(this.pos.x + 3, roomDimensions - 2), 2)

  // Find my creeps in range of creep

  const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

  // Loop through each nearbyCreep

  for (const posData of nearbyCreeps) {
    // If the creep is the posData creep, iterate

    if (this.name === posData.creep.name) continue

    // If the creep is not owned and isn't an ally

    if (!posData.creep.my && !global.settings.allies.includes(posData.creep.owner.username))
      continue

    // If the creep is at full health, iterate

    if (posData.creep.hitsMax === posData.creep.hits) continue

    // have the creep rangedHeal the nearbyCreep and stop

    this.rangedHeal(posData.creep)
    this.ranged = true
    return true
  }

  return false
}

Creep.prototype.aggressiveHeal = function () {
  const { room } = this

  this.message = 'AH'

  if (!this.worked) {
    // If the creep is below max hits

    if (this.hitsMax > this.hits) {
      // Have it heal itself and stop

      this.heal(this)
      this.worked = WorkTypes.heal
      return true
    }
  }

  const healTargets = room.myCreeps
    .concat(room.roomManager.notMyCreeps.ally)
    .filter(function (creep) {
      return creep.hits < creep.hitsMax
    })

  if (!healTargets.length) return false

  const healTarget = findClosestObject(this.pos, healTargets)
  const range = getRangeXY(this.pos.x, healTarget.pos.x, this.pos.y, healTarget.pos.y)

  if (range > 1) {
    if (this.ranged) return false

    this.createMoveRequest({
      origin: this.pos,
      goals: [{ pos: healTarget.pos, range: 1 }],
    })

    if (range <= 3) {
      this.rangedHeal(healTarget)
      return true
    }
  }

  if (this.worked) return false

  this.heal(healTarget)
  return true
}

Creep.prototype.passiveRangedAttack = function () {
  return true
}

Creep.prototype.findBulzodeTargets = function (goalPos) {
  return []
}

Creep.prototype.findQuadBulldozeTargets = function (goalPos) {
  if (
    this.memory[CreepMemoryKeys.quadBulldozeTargets] &&
    this.memory[CreepMemoryKeys.quadBulldozeTargets].length
  )
    return this.memory[CreepMemoryKeys.quadBulldozeTargets]

  const path = CustomPathFinder.findPath({
    origin: this.pos,
    goals: [
      {
        pos: goalPos,
        range: 0,
      },
    ],
    overrideCostMatrixes(roomName) {
      return [RoomManager.roomManagers[roomName].quadBulldozeCostMatrix]
    },
  })

  path.push(goalPos)

  const targetStructureIDs: Set<Id<Structure>> = new Set()
  const visitedCoords: Set<string> = new Set()

  for (const pos of path) {
    for (let i = quadAttackMemberOffsets.length - 1; i > -1; i--) {
      const offset = quadAttackMemberOffsets[i]
      const coord = {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
      }
      const packedCoord = packCoord(coord)
      if (visitedCoords.has(packedCoord)) continue

      visitedCoords.add(packedCoord)

      for (const structure of this.room.lookForAt(LOOK_STRUCTURES, coord.x, coord.y)) {
        if (structure.structureType === STRUCTURE_KEEPER_LAIR) continue

        if (
          !impassibleStructureTypes.includes(structure.structureType) &&
          structure.structureType !== STRUCTURE_RAMPART
        )
          continue

        if (targetStructureIDs.has(structure.id)) continue

        targetStructureIDs.add(structure.id)
      }
    }
  }

  return (this.memory[CreepMemoryKeys.quadBulldozeTargets] = Array.from(targetStructureIDs))
}
