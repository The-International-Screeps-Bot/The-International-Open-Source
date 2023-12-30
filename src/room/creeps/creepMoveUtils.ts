import { CreepMemoryKeys, MovedTypes, Result, customColors, defaultCreepSwampCost, defaultPlainCost, packedPosLength } from 'international/constants'
import { CustomPathFinderArgs, PathGoal, customPathFinder } from 'international/customPathFinder'
import { packCoord, packPos, packPosList, unpackPos, unpackPosAt } from 'other/codec'
import { areCoordsEqual, arePositionsEqual, findObjectWithID, getRange } from 'utils/utils'

/**
 * Utilities involving the movement of creeps
 */
export class CreepMoveUtils {
  useExistingPath(creep: Creep, args: CustomPathFinderArgs, opts: MoveRequestOpts) {

    if (creep.spawning) return Result.fail

    const creepMemory = Memory.creeps[creep.name] || Memory.powerCreeps[creep.name]

    if (!creepMemory[CreepMemoryKeys.lastCache]) return Result.fail
    if (creepMemory[CreepMemoryKeys.lastCache] + opts.cacheAmount <= Game.time) return Result.fail
    if (creepMemory[CreepMemoryKeys.flee] !== args.flee) return Result.fail

    const packedPath = creepMemory[CreepMemoryKeys.path]
    if (!packedPath || !packedPath.length) return Result.fail

    // Make this more optimal in not redoing paths unecessarily
    if (!areCoordsEqual(unpackPos(creepMemory[CreepMemoryKeys.goalPos]), args.goals[0].pos)){
      return Result.fail
    }

    const moveTarget = this.findMoveTarget(creep, creepMemory)
    if (moveTarget === Result.fail) return Result.fail
    if (getRange(creep.pos, moveTarget[0]) > 1) return Result.fail

    // If we're on an exit and we want to go to the other side, wait for it to toggle
    if (moveTarget[0].roomName !== creep.room.name) {
      creep.moved = MovedTypes.moved
      return Result.success
    }

    // We've determined our existing path is sufficient. Move to the next position on it

    creep.assignMoveRequest(moveTarget[0])
    return Result.success
  }

  private findMoveTarget(creep: Creep, creepMemory: CreepMemory | PowerCreepMemory): Result.fail | [RoomPosition, number] {

    const maxIterations = Math.min(creepMemory[CreepMemoryKeys.path].length / packedPosLength - 1, 1)
    let iterations = -1

    while (iterations < maxIterations) {

      const pos = unpackPosAt(creepMemory[CreepMemoryKeys.path], iterations + 1)
      if (arePositionsEqual(creep.pos, pos)) {

        creepMemory[CreepMemoryKeys.path].slice(iterations * packedPosLength)
        return [pos, iterations]
      }
      iterations += 1;
    }

    Result.fail
  }

  findNewPath(creep: Creep, args: CustomPathFinderArgs, opts: MoveRequestOpts) {

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
    const path = customPathFinder.findPath(args)
    if (!path.length && !creep.spawning) return Result.fail

    // Limit the path's length to the cacheAmount

    path.splice(opts.cacheAmount)

    // Show that a new path has been created

    if (global.settings.roomVisuals)
        creep.room.visual.text('NP', path[0], {
            align: 'center',
            color: customColors.lightBlue,
            opacity: 0.5,
            font: 0.5,
        })

    return path
  }

  useNewPath(creep: Creep, args: CustomPathFinderArgs, opts: MoveRequestOpts, path: RoomPosition[]) {
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
  }

  private registerSpawnDirections(creep: Creep, path: RoomPosition[]) {

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

export const creepMoveUtils = new CreepMoveUtils()
