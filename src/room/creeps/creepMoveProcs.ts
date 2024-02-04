import { CollectiveManager } from 'international/collective'
import {
  CreepMemoryKeys,
  FlagNames,
  MovedTypes,
  Result,
  customColors,
  defaultCreepSwampCost,
  defaultPlainCost,
  packedPosLength,
} from '../../constants/general'
import { CustomPathFinderArgs, PathGoal, CustomPathFinder } from 'international/customPathFinder'
import { packCoord, packPos, packPosList, unpackPos, unpackPosAt } from 'other/codec'
import { areCoordsEqual, arePositionsEqual, findObjectWithID, getRange } from 'utils/utils'

/**
 * Utilities involving the movement of creeps
 */
export class CreepMoveProcs {
  /**
   * work in progress
   */
  static createMoveRequest(creep: Creep, goals: PathGoal[], args: any, opts: any) {
    // Stop if the we know the creep won't move

    if (creep.moveRequest) return Result.noAction
    if (creep.moved) return Result.noAction
    if (creep.fatigue > 0) return Result.noAction

    if (creep.spawning) {
      const spawn = findObjectWithID(creep.spawnID)
      if (!spawn) return Result.noAction

      // Don't plan the path until we are nearly ready to be spawned
      if (spawn.spawning.remainingTime > 1) return Result.noAction
    }
    if (!creep.getActiveBodyparts(MOVE)) {
      creep.moved = MovedTypes.moved
      return Result.noAction
    }

    // Assign default args

    opts.cacheAmount ??= CollectiveManager.defaultMinPathCacheTime

    if (this.useExistingPath(creep, args, opts) === Result.success) {
      return Result.success
    }

    const path = this.findNewPath(creep, args, opts)
    if (path === Result.fail) return Result.fail

    this.useNewPath(creep, args, opts, path)
    return Result.success
  }

  static useExistingPath(creep: Creep, args: CustomPathFinderArgs, opts: MoveRequestOpts) {
    if (creep.spawning) return Result.noAction

    const creepMemory = Memory.creeps[creep.name] || Memory.powerCreeps[creep.name]

    if (!creepMemory[CreepMemoryKeys.lastCache]) return Result.fail
    if (creepMemory[CreepMemoryKeys.lastCache] + opts.cacheAmount <= Game.time) return Result.fail
    if (creepMemory[CreepMemoryKeys.flee] !== args.flee) return Result.fail

    const packedPath = creepMemory[CreepMemoryKeys.path]
    if (!packedPath || !packedPath.length) return Result.fail

    // Make this more optimal in not redoing paths unecessarily
    if (!areCoordsEqual(unpackPos(creepMemory[CreepMemoryKeys.goalPos]), args.goals[0].pos)) {
      return Result.fail
    }

    const moveTarget = this.findMoveTarget(creep, creepMemory)
    if (moveTarget === Result.fail) return Result.fail

    // If we're on an exit and we want to go to the other side, wait for it to toggle
    if (moveTarget.roomName !== creep.room.name) {
      creep.moved = MovedTypes.moved
      return Result.success
    }

    if (Game.flags[FlagNames.debugMovement]) {
      creep.room.visual.line(creep.pos, moveTarget, { color: customColors.lightBlue })
    }

    // We've determined our existing path is sufficient. Move to the next position on it

    creep.assignMoveRequest(moveTarget)
    return Result.success
  }

  /**
   * Similar to the game's moveByPath
   * We need to also check if the next position is an opposite exit coord
   */
  private static findMoveTarget(
    creep: Creep,
    creepMemory: CreepMemory | PowerCreepMemory,
  ): Result.fail | RoomPosition {
    // First index

    let firstIndex = 0
    let pos = unpackPosAt(creepMemory[CreepMemoryKeys.path], firstIndex)

    if (getRange(creep.pos, pos) === 1) {
      return pos
    }

    // Failed to use first index

    // Cut the path based coords we skiped over
    creepMemory[CreepMemoryKeys.path] = creepMemory[CreepMemoryKeys.path].slice(packedPosLength)
    if (!creepMemory[CreepMemoryKeys.path].length) return Result.fail

    // Second index

    pos = unpackPosAt(creepMemory[CreepMemoryKeys.path], firstIndex)

    if (getRange(creep.pos, pos) === 1) {
      return pos
    }

    // Failed to use second index

    // Cut the path based coords we skiped over
    creepMemory[CreepMemoryKeys.path] = creepMemory[CreepMemoryKeys.path].slice(packedPosLength)
    return Result.fail
  }

  static findNewPath(creep: Creep, args: CustomPathFinderArgs, opts: MoveRequestOpts) {
    // Assign the creep to the args

    args.creep = creep

    // Inform args to avoid impassible structures

    args.avoidImpassibleStructures = true
    args.avoidStationaryPositions = true

    // If there is no safemode
    if (!creep.room.controller || !creep.room.controller.safeMode) args.avoidNotMyCreeps = true

    const creepMemory = Memory.creeps[creep.name] || Memory.powerCreeps[creep.name]
    if (creepMemory[CreepMemoryKeys.preferRoads]) {
      args.plainCost ??= defaultPlainCost * 2
      args.swampCost ??= defaultCreepSwampCost * 2
    }

    // Generate a new path
    const path = CustomPathFinder.findPath(args)
    if (!path.length) return Result.fail

    // Limit the path's length to the cacheAmount
    path.splice(opts.cacheAmount)

    if (Game.flags[FlagNames.debugMovement]) {
      creep.room.visual.text('NP', creep.pos, {
        align: 'center',
        color: customColors.lightBlue,
        opacity: 0.7,
        font: 0.7,
      })
    }

    return path
  }

  static useNewPath(
    creep: Creep,
    args: CustomPathFinderArgs,
    opts: MoveRequestOpts,
    path: RoomPosition[],
  ) {
    // Set the creep's pathOpts to reflect this moveRequest's args
    creep.pathOpts = args

    const creepMemory = Memory.creeps[creep.name] || Memory.powerCreeps[creep.name]

    creepMemory[CreepMemoryKeys.lastCache] = Game.time
    creepMemory[CreepMemoryKeys.flee] = args.flee
    if (opts.reserveCoord !== undefined) {
      creepMemory[CreepMemoryKeys.packedCoord] = packCoord(path[path.length - 1])
    }
    // Assign the goal's pos to the creep's goalPos
    creepMemory[CreepMemoryKeys.goalPos] = packPos(args.goals[0].pos)
    // Set the path in the creep's memory
    creepMemory[CreepMemoryKeys.path] = packPosList(path)

    if (creep.spawning) {
      this.registerSpawnDirections(creep, path)
      return Result.success
    }

    // If we're on an exit and we want to go to the other side, wait for it to toggle
    if (path[0].roomName !== creep.room.name) {
      creep.moved = MovedTypes.moved
      return Result.success
    }
    creep.assignMoveRequest(path[0])
    return Result.success
  }

  private static registerSpawnDirections(creep: Creep, path: RoomPosition[]) {
    if (!creep.spawnID) return

    const spawn = findObjectWithID(creep.spawnID)
    if (!spawn) return

    // Ensure we aren't using the default direction

    if (spawn.spawning.directions) return

    const adjacentCoords: Coord[] = []

    for (let x = spawn.pos.x - 1; x <= spawn.pos.x + 1; x += 1) {
      for (let y = spawn.pos.y - 1; y <= spawn.pos.y + 1; y += 1) {
        if (spawn.pos.x === x && spawn.pos.y === y) continue

        const coord = { x, y }

        /* if (room.coordHasStructureTypes(coord, impassibleStructureTypesSet)) continue */

        // Otherwise ass the x and y to positions

        adjacentCoords.push(coord)
      }
    }

    // Sort by distance from the first pos in the path

    adjacentCoords.sort((a, b) => {
      return getRange(a, path[0]) - getRange(b, path[0])
    })

    const directions: DirectionConstant[] = []

    for (const coord of adjacentCoords) {
      directions.push(spawn.pos.getDirectionTo(coord.x, coord.y))
    }

    spawn.spawning.setDirections(directions)
    return
  }
}
