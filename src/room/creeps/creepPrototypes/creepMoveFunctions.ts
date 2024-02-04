import {
  impassibleStructureTypesSet,
  customColors,
  TrafficPriorities,
  packedPosLength,
  CreepMemoryKeys,
  Result,
  communeCreepRoles,
  ReservedCoordTypes,
  MovedTypes,
  FlagNames,
} from '../../../constants/general'
import { CollectiveManager } from 'international/collective'
import {
  areCoordsEqual,
  arePositionsEqual,
  findObjectWithID,
  getRangeEuc,
  getRange,
  isExit,
  forAdjacentCoords,
  isAlly,
} from 'utils/utils'
import {
  packCoord,
  packPos,
  unpackCoordAsPos,
  unpackPos,
  unpackPosAt,
  unpackPosList,
} from 'other/codec'
import { CreepMoveProcs } from '../creepMoveProcs'

PowerCreep.prototype.createMoveRequestByPath = Creep.prototype.createMoveRequestByPath = function (
  args,
  pathOpts,
) {
  // Stop if the we know the creep won't move

  if (this.moveRequest) return Result.noAction
  if (this.moved) return Result.noAction
  if (this.fatigue > 0) return Result.noAction
  if (this instanceof Creep) {
    if (this.spawning) {
      const spawn = findObjectWithID(this.spawnID)
      if (!spawn) return Result.noAction

      // Don't plan the path until we are nearly ready to be spawned
      if (spawn.spawning.remainingTime > 1) return Result.noAction
    }
    if (!this.getActiveBodyparts(MOVE)) {
      this.moved = MovedTypes.moved
      return Result.noAction
    }
  }
  if (this.room.roomManager.enemyDamageThreat) return this.createMoveRequest(args)

  // const posIndex = pathOpts.packedPath.indexOf(packPos(this.pos))

  let posIndex = -1

  for (let i = 0; i < pathOpts.packedPath.length - packedPosLength + 1; i += packedPosLength) {
    const pos = unpackPosAt(pathOpts.packedPath, i / packedPosLength)
    if (!arePositionsEqual(this.pos, pos)) continue

    posIndex = i
    break
  }

  //

  const packedGoalPos = packPos(args.goals[0].pos)
  const isOnLastPos = posIndex + packedPosLength === pathOpts.packedPath.length

  if (
    !isOnLastPos &&
    posIndex !== -1 &&
    this.memory[CreepMemoryKeys.usedPathForGoal] !== packedGoalPos
  ) {
    const packedPath = pathOpts.packedPath.slice(posIndex + packedPosLength)
    const pos = unpackPosAt(packedPath, 0)

    // If we're on an exit and the next pos is in the other room, wait

    if (pos.roomName !== this.room.name) {
      this.memory[CreepMemoryKeys.path] = packedPath
      this.moved = MovedTypes.moved
      return Result.success
    }

    // Give the creep a sliced version of the path it is trying to use

    this.memory[CreepMemoryKeys.path] = packedPath
    this.assignMoveRequest(pos)
    return Result.success
  }

  if (isOnLastPos || this.memory[CreepMemoryKeys.usedPathForGoal]) {
    this.memory[CreepMemoryKeys.usedPathForGoal] = packPos(args.goals[0].pos)
    return this.createMoveRequest(args)
  }

  // If loose is enabled, don't try to get back on the cached path
  /*
    this.room.visual.text((pathOpts.loose || false).toString(), this.pos.x, this.pos.y + 0.5, { font: 0.4 })
 */
  if (pathOpts.loose) return this.createMoveRequest(args)

  this.room.errorVisual(this.pos)

  // Try to get on the path

  args.goals = []

  for (const pos of unpackPosList(pathOpts.packedPath)) {
    args.goals.push({
      pos,
      range: 0,
    })
  }

  return this.createMoveRequest(args)
}

PowerCreep.prototype.createMoveRequest = Creep.prototype.createMoveRequest = function (
  args,
  opts = {},
) {
  // Stop if the we know the creep won't move

  if (this.moveRequest) return Result.noAction
  if (this.moved) return Result.noAction
  if (this.fatigue > 0) return Result.noAction
  if (this instanceof Creep) {
    if (this.spawning) {
      const spawn = findObjectWithID(this.spawnID)
      if (!spawn) return Result.noAction

      // Don't plan the path until we are nearly ready to be spawned
      if (spawn.spawning.remainingTime > 1) return Result.noAction
    }
    if (!this.getActiveBodyparts(MOVE)) {
      this.moved = MovedTypes.moved
      return Result.noAction
    }
  }

  // Assign default args

  args.origin ??= this.pos
  opts.cacheAmount ??= CollectiveManager.defaultMinPathCacheTime

  if (CreepMoveProcs.useExistingPath(this, args, opts) === Result.success) {
    return Result.success
  }

  const path = CreepMoveProcs.findNewPath(this, args, opts)
  if (path === Result.fail) return Result.fail

  CreepMoveProcs.useNewPath(this, args, opts, path)
  return Result.success
}

PowerCreep.prototype.assignMoveRequest = Creep.prototype.assignMoveRequest = function (coord) {
  const { room } = this
  const packedCoord = packCoord(coord)

  this.moveRequest = packedCoord

  room.moveRequests[packedCoord]
    ? room.moveRequests[packedCoord].push(this.name)
    : (room.moveRequests[packedCoord] = [this.name])
}

PowerCreep.prototype.findShoveCoord = Creep.prototype.findShoveCoord = function (
  avoidPackedCoords,
  targetCoord,
) {
  const { room } = this
  const terrain = room.getTerrain()

  let shoveCoord: Coord
  let lowestScore = Infinity

  forAdjacentCoords(this.pos, coord => {
    const packedCoord = packCoord(coord)

    const creepAtPosName = room.creepPositions[packedCoord]
    if (creepAtPosName) {
      const creepAtPos = Game.creeps[creepAtPosName]
      if (creepAtPos.fatigue > 0) return
      if (creepAtPos.moved) return
      // maybe want to reconsider this parameter
      if (creepAtPos.moveRequest) return
      if (creepAtPos.getActiveBodyparts(MOVE) === 0) return
    }

    if (avoidPackedCoords.has(packedCoord)) return

    if (isExit(coord)) return

    const terrainType = terrain.get(coord.x, coord.y)
    if (terrainType === TERRAIN_MASK_WALL) return

    // Use scoring to determine the cost of using the coord compared to potential others

    let score = 0
    if (targetCoord) {
      score += getRangeEuc(coord, targetCoord) * 3
    }

    if (terrainType === TERRAIN_MASK_SWAMP) score += 1
    if (room.creepPositions[packedCoord] || room.powerCreepPositions[packedCoord]) score += 1

    // If the coord is reserved, increase score porportional to importance of the reservation
    const reservationType = this.room.roomManager.reservedCoords.get(packedCoord)
    // Don't shove onto spawning-reserved coords
    if (reservationType === ReservedCoordTypes.spawning) return
    // Score based on value of reservation
    if (reservationType !== undefined) score += reservationType * 2

    if (Game.flags[FlagNames.roomVisuals]) this.room.visual.text(score.toString(), coord.x, coord.y)

    // Preference for lower-scoring coords
    if (score >= lowestScore) return

    // If the coord isn't safe to stand on

    if (room.roomManager.enemyThreatCoords.has(packedCoord)) return

    if (room.coordHasStructureTypes(coord, impassibleStructureTypesSet)) return

    if (
      this.memory[CreepMemoryKeys.rampartOnlyShoving] &&
      !room.findStructureAtCoord(coord, structure => structure.structureType === STRUCTURE_RAMPART)
    ) {
      return
    }

    let hasImpassibleStructure

    for (const cSite of room.lookForAt(LOOK_CONSTRUCTION_SITES, coord.x, coord.y)) {

      // If the construction site is owned by an ally, don't allow its position
      if (!cSite.my && isAlly(cSite.owner.username)) {
        hasImpassibleStructure = true
        break
      }

      if (impassibleStructureTypesSet.has(cSite.structureType)) {
        hasImpassibleStructure = true
        break
      }
    }

    if (hasImpassibleStructure) return

    lowestScore = score
    shoveCoord = coord
  })

  return shoveCoord
}

PowerCreep.prototype.shove = Creep.prototype.shove = function (avoidPackedCoords) {
  const { room } = this

  let targetCoord = this.actionCoord
  if (!targetCoord && this.memory[CreepMemoryKeys.goalPos])
    targetCoord = unpackPos(this.memory[CreepMemoryKeys.goalPos])

  avoidPackedCoords.add(packCoord(this.pos))

  const shoveCoord = this.findShoveCoord(avoidPackedCoords, targetCoord)
  if (!shoveCoord) return false

  const packedShoveCoord = packCoord(shoveCoord)
  const creepAtPosName =
    room.creepPositions[packedShoveCoord] || room.powerCreepPositions[packedShoveCoord]

  // If there is a creep make sure we aren't overlapping with other shoves

  if (creepAtPosName) {
    avoidPackedCoords.add(packCoord(this.pos))
    avoidPackedCoords.add(packedShoveCoord)

    const creepAtPos = Game.creeps[creepAtPosName] || Game.powerCreeps[creepAtPosName]
    if (!creepAtPos.shove(avoidPackedCoords)) return false
  }

  this.assignMoveRequest(shoveCoord)

  if (Game.flags[FlagNames.roomVisuals])
    room.visual.circle(this.pos, {
      fill: '',
      stroke: customColors.red,
      radius: 0.5,
      strokeWidth: 0.15,
    })

  if (!this.moveRequest) return false

  if (Game.flags[FlagNames.roomVisuals]) {
    room.visual.circle(this.pos, {
      fill: '',
      stroke: customColors.yellow,
      radius: 0.5,
      strokeWidth: 0.15,
      opacity: 0.3,
    })

    room.visual.line(this.pos, unpackCoordAsPos(this.moveRequest, this.room.name), {
      color: customColors.yellow,
    })
  }

  this.runMoveRequest()
  return true
  /*
    this.recurseMoveRequest()
    if (this.moved) return true

    return false */
}

PowerCreep.prototype.runMoveRequest = Creep.prototype.runMoveRequest = function () {
  const { room } = this

  // If requests are not allowed for this pos, inform false

  if (!room.moveRequests[this.moveRequest]) return false

  if (this.move(this.pos.getDirectionTo(unpackCoordAsPos(this.moveRequest, room.name))) !== OK)
    return false

  this.room.roomManager.runMoveRequestOrder += 1

  if (Game.flags[FlagNames.roomVisuals])
    room.visual.rect(this.pos.x - 0.5, this.pos.y - 0.5, 1, 1, {
      fill: customColors.lightBlue,
      opacity: 0.2,
    })

  // Record where the creep is tying to move

  this.moved = this.moveRequest

  // Remove all moveRequests to the position

  delete room.moveRequests[this.moveRequest]
  delete this.moveRequest

  // Remove record of the creep being on its current position

  /* room.creepPositions[packAsNum(this.pos)] = undefined */

  // Record the creep at its new position

  /* room.creepPositions[this.moveRequest] = this.name */

  return true
}

PowerCreep.prototype.recurseMoveRequest = Creep.prototype.recurseMoveRequest = function (
  queue = [],
) {
  const { room } = this

  if (this.spawning) return
  if (!this.moveRequest) return
  if (!room.moveRequests[this.moveRequest]) {
    this.moved = MovedTypes.moved
    return
  }

  this.room.roomManager.recurseMoveRequestOrder += 1

  queue.push(this.name)

  // Try to find the name of the creep at pos

  const creepNameAtPos =
    room.creepPositions[this.moveRequest] || room.powerCreepPositions[this.moveRequest]

  // If there is no creep at the pos

  if (!creepNameAtPos) {
    /*         if (this.spawning) {
            this.moved = this.moveRequest
            delete room.moveRequests[this.moveRequest]

            if (Game.flags[FlagNames.roomVisuals]) {
                const moved = unpackCoord(this.moved)

                room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                    fill: customColors.black,
                    opacity: 0.7,
                })
            }
            return
        }
 */
    // loop through each index of the queue, drawing visuals

    if (Game.flags[FlagNames.roomVisuals]) {
      const moveRequestPos = unpackCoordAsPos(this.moveRequest, room.name)

      room.visual.rect(moveRequestPos.x - 0.5, moveRequestPos.y - 0.5, 1, 1, {
        fill: customColors.green,
        opacity: 0.2,
      })

      for (let index = queue.length - 1; index >= 0; index--) {
        const creep = Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]

        room.visual.rect(creep.pos.x - 0.5, creep.pos.y - 0.5, 1, 1, {
          fill: customColors.yellow,
          opacity: 0.2,
        })
      }
    }

    // Have each member of the queue run its moveRequest

    for (let index = queue.length - 1; index >= 0; index--) {
      ;(Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()
    }

    return
  }

  const packedCoord = packCoord(this.pos)
  // Get the creepAtPos with the name
  const creepAtPos = Game.creeps[creepNameAtPos] || Game.powerCreeps[creepNameAtPos]

  // if creepAtPos is fatigued it is useless to us

  if ((creepAtPos as Creep).fatigue > 0) {
    this.moved = MovedTypes.wait

    /* delete room.moveRequests[this.moved] */
    delete this.moveRequest
    return
  }
  /*
    // We're spawning, just get us space to move into

    if (this.spawning) {
        if (Game.flags[FlagNames.roomVisuals]) {
            const moved = unpackCoord(this.moveRequest)

            room.visual.rect(moved.x - 0.5, moved.y - 0.5, 1, 1, {
                fill: customColors.pink,
                opacity: 0.7,
            })
        }

        if (creepAtPos.shove(new Set([packedCoord]))) {
            this.room.errorVisual(unpackCoord(this.moveRequest))

            this.moved = this.moveRequest
            delete room.moveRequests[this.moved]
            delete this.moveRequest
        }

        return
    }
 */
  if (creepAtPos.moved) {
    // might not be what we want. uncomment if (more) stuck bugs appear
    /*         if (creepAtPos.moved === 'moved') {
            delete this.moveRequest
            this.moved = 'moved'
            return
        } */
    if (creepAtPos.moved === MovedTypes.moved) {
      this.runMoveRequest()
      return
    }

    if (creepAtPos.moved === MovedTypes.wait) {
      if (creepAtPos instanceof PowerCreep) {
        delete this.moveRequest
        this.moved = MovedTypes.wait
        return
      }

      // Don't allow swapping in the queue if we might move a creep out of the commune
      // Will trade if:
      // remotes are different
      // sourceIndexes are different
      // Traffic priorities are by default different
      // One is around empty while the other is around full

      if (
        (!this.isOnExit || !communeCreepRoles.has(creepAtPos.role)) &&
        (this.memory[CreepMemoryKeys.remote] !== creepAtPos.memory[CreepMemoryKeys.remote] ||
          this.memory[CreepMemoryKeys.sourceIndex] !==
            creepAtPos.memory[CreepMemoryKeys.sourceIndex] ||
          TrafficPriorities[this.role] + (this.needsResources() ? 0.1 : 0) >
            TrafficPriorities[creepAtPos.role] + (this.needsResources() ? 0.1 : 0))
      ) {
        // Have the creep move to its moveRequest

        this.runMoveRequest()

        // Have the creepAtPos move to the creep and inform true

        creepAtPos.moveRequest = packedCoord
        room.moveRequests[packedCoord] = [creepAtPos.name]
        creepAtPos.runMoveRequest()
        return
      }

      delete this.moveRequest
      this.moved = MovedTypes.wait
      return
    }

    // If the creep is where the creepAtPos is trying to move to
    /*
        if (packedCoord === creepAtPos.moved) {
            if (Game.flags[FlagNames.roomVisuals])
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.purple,
                    opacity: 0.2,
                })

            this.runMoveRequest()
            return
        }
 */
    if (Game.flags[FlagNames.roomVisuals])
      room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
        fill: customColors.white,
        opacity: 0.2,
      })

    // Otherwise, loop through each index of the queue

    for (let index = queue.length - 1; index >= 0; index--) {
      // Have the creep run its moveRequest

      ;(Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()
    }

    // loop through each index of the queue, drawing visuals

    if (Game.flags[FlagNames.roomVisuals])
      for (let index = queue.length - 1; index >= 0; index--)
        room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
          fill: customColors.yellow,
          opacity: 0.2,
        })
    return
  }

  // If the creepAtPos has a moveRequest

  if (creepAtPos.moveRequest) {
    // If it's valid

    if (room.moveRequests[creepAtPos.moveRequest]) {
      /*
            if (Game.flags[FlagNames.roomVisuals])
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.teal,
                    opacity: 0.2,
                })

            // Have the creep move to its moveRequest

            this.runMoveRequest()

            // Have the creepAtPos move to the creep and inform true

            creepAtPos.moveRequest = packedCoord
            room.moveRequests.set(packedCoord, [creepAtPos.name])
            creepAtPos.runMoveRequest()
            */

      // If the creepAtPos wants to move to creep

      if (packedCoord === creepAtPos.moveRequest) {
        if (Game.flags[FlagNames.roomVisuals])
          room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
            fill: customColors.teal,
            opacity: 0.2,
          })
        /*
            // Culprit for relay issues?

            this.room.visual.text('R', this.pos)

            this.room.targetVisual(creepAtPos.pos, unpackCoord(creepAtPos.moveRequest), true)
 */
        // Have the creep move to its moveRequest

        this.runMoveRequest()
        creepAtPos.runMoveRequest()
        return
      }

      // If both creeps moveRequests are aligned

      if (this.moveRequest === creepAtPos.moveRequest) {
        if (Game.flags[FlagNames.roomVisuals])
          room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
            fill: customColors.pink,
            opacity: 0.2,
          })

        // Prefer the creep with the higher priority

        if (
          !(creepAtPos instanceof PowerCreep) &&
          TrafficPriorities[this.role] + (this.needsResources() ? 0.1 : 0) >
            TrafficPriorities[creepAtPos.role] + (this.needsResources() ? 0.1 : 0)
        ) {
          this.runMoveRequest()

          delete creepAtPos.moveRequest
          creepAtPos.moved = MovedTypes.moved

          return
        }

        delete this.moveRequest
        this.moved = MovedTypes.moved

        creepAtPos.runMoveRequest()
        return
      }

      // Swap if creep has higher priority than creepAtPos
      /*
        if (
            !(creepAtPos instanceof PowerCreep) &&
            (!this.isOnExit ||
                !communeCreepRoles.has(creepAtPos.role)) &&
            (TrafficPriorities[this.role] + (this.needsResources() ? 0.1 : 0) >
                TrafficPriorities[creepAtPos.role] + (this.needsResources() ? 0.1 : 0))
        ) {
            if (Game.flags[FlagNames.roomVisuals])
                room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
                    fill: customColors.pink,
                    opacity: 0.2,
                })

            this.runMoveRequest()

            // Have the creepAtPos move to the creep and inform true

            creepAtPos.moveRequest = packedCoord
            room.moveRequests[packedCoord] = [creepAtPos.name]
            creepAtPos.runMoveRequest()
            return
        }
 */
      // If the creepAtPos is in the queue

      if (queue.includes(creepAtPos.name)) {
        // loop through each index of the queue

        for (let index = queue.length - 1; index >= 0; index--)
          // Have the creep run its moveRequest

          (Game.creeps[queue[index]] || Game.powerCreeps[queue[index]]).runMoveRequest()

        // loop through each index of the queue, drawing visuals

        if (Game.flags[FlagNames.roomVisuals])
          for (let index = queue.length - 1; index >= 0; index--)
            room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
              fill: customColors.yellow,
              opacity: 0.2,
            })

        return
      }

      if (creepAtPos.actionCoord) {
        // No point in swapping to get to the same target
        if (this.actionCoord && areCoordsEqual(this.actionCoord, creepAtPos.actionCoord)) {
          delete this.moveRequest
          return
        }

        // If swapping will get it closer or equal range to its actionCoord
        if (
          getRange(this.pos, creepAtPos.actionCoord) <
          getRange(creepAtPos.pos, creepAtPos.actionCoord)
        ) {
          // Run creep's moveRequest, trading places with creepAtPos

          this.runMoveRequest()

          creepAtPos.moveRequest = packedCoord
          room.moveRequests[packedCoord] = [creepAtPos.name]
          creepAtPos.runMoveRequest()
          return
        }
      }

      creepAtPos.recurseMoveRequest(queue)
      return
    } else {
      // the moveRequest isn't valid

      delete creepAtPos.moveRequest
    }
  }

  // Otherwise the creepAtPos has no moveRequest. Try to shove

  if (creepAtPos.shove(new Set([packedCoord]))) {
    this.room.visual.text('S', creepAtPos.pos)
    this.runMoveRequest()
    return
  }

  // Otherwise see if we can swap places, doing so if we can

  if (this.isOnExit) return

  if (Game.flags[FlagNames.roomVisuals])
    room.visual.rect(creepAtPos.pos.x - 0.5, creepAtPos.pos.y - 0.5, 1, 1, {
      fill: customColors.teal,
      opacity: 0.2,
    })

  // Run creep's moveRequest, trading places with creepAtPos

  this.runMoveRequest()

  creepAtPos.moveRequest = packedCoord
  room.moveRequests[packedCoord] = [creepAtPos.name]
  creepAtPos.runMoveRequest()
}

PowerCreep.prototype.avoidEnemyThreatCoords = Creep.prototype.avoidEnemyThreatCoords = function () {
  if (!this.room.roomManager.enemyThreatCoords.has(packCoord(this.pos))) return false

  this.createMoveRequest({
    origin: this.pos,
    goals: this.room.roomManager.enemyThreatGoals,
    flee: true,
  })

  return true
}
