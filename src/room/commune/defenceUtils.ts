import { CollectiveManager } from "international/collective"
import { Result, ourImpassibleStructuresSet } from '../../constants/general'
import { packCoord } from "other/codec"
import { RoomNameUtils } from "room/roomNameUtils"
import { findObjectWithID, isAlly } from "utils/utils"
import { PresentThreat } from "./defenceProcs"

export class DefenceUtils {
  static shouldSafeMode(room: Room) {
    const { controller } = room

    // Conditions check

    if (controller.safeModeCooldown) return false
    if (!controller.safeModeAvailable) return false
    if (controller.upgradeBlocked) return false
    // We can't use safemode when the downgrade timer is too low
    if (controller.ticksToDowngrade <= CONTROLLER_DOWNGRADE_SAFEMODE_THRESHOLD) return false
    // If another room is safemoded, make sure that we are a higher level
    if (
      CollectiveManager.safemodedCommuneName &&
      Game.rooms[CollectiveManager.safemodedCommuneName].controller.level >=
        room.controller.level
    )
      return false

    // Filter attackers that are not invaders. If there are none, stop

    const nonInvaderAttackers = room.roomManager.enemyAttackers.filter(
      enemyCreep => !enemyCreep.isOnExit && enemyCreep.owner.username !== 'Invader',
    )
    if (!nonInvaderAttackers.length) return false

    if (!this.isControllerSafe(room)) return true
    if (!this.isBaseSafe(room)) return true

    return false
  }

  private static isSafe(room: Room) {}

  private static isBaseSafe(room: Room) {

    const anchor = room.roomManager.anchor
    if (!anchor) {
      throw Error('no anchor')
    }

    const terrain = Game.map.getRoomTerrain(room.name)
    const rampartPlans = room.roomManager.rampartPlans
    const enemyCoord = RoomNameUtils.floodFillFor(room.name, [anchor], coord => {
      // Ignore terrain that protects us
      if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

      const planData = rampartPlans.getXY(coord.x, coord.y)
      if (planData) {
        // Filter out non-mincut ramparts
        if (planData.buildForNuke || planData.coversStructure || planData.buildForThreat)
          return true
        // Don't flood past mincut ramparts
        return false
      }

      // See if there is an enemy creep
      const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
      if (!enemyCreepID) return true

      const enemyCreep = findObjectWithID(enemyCreepID)
      if (isAlly(enemyCreep.owner.username)) return true
      // If it can deal damage, safemode
      if (
        enemyCreep.combatStrength.ranged > 0 ||
        enemyCreep.combatStrength.melee > 0 ||
        enemyCreep.combatStrength.dismantle > 0
      )
        return Result.stop

      return true
    })

    // If there is an enemy inside our base, we want to safemode
    return !enemyCoord
  }

  /**
   * Identify claim creeps trying to downgrade the controller, safemode just before
   */
  private static isControllerSafe(room: Room) {

    const terrain = Game.map.getRoomTerrain(room.name)
    const enemyCoord = RoomNameUtils.floodFillFor(
      room.name,
      [room.controller.pos],
      (coord, packedCoord, depth) => {
        // See if we should even consider the coord

        // Ignore terrain that protects us
        if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

        // Don't go out of range 2 from controller
        if (depth > 2) return false

        // Ignore structures that protect us
        if (room.coordHasStructureTypes(coord, ourImpassibleStructuresSet)) return false

        // Past this point we should always add this coord to the next generation

        // See if there is an enemy creep
        const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
        if (!enemyCreepID) return true

        const enemyCreep = findObjectWithID(enemyCreepID)
        if (isAlly(enemyCreep.owner.username)) return true
        // We only need to protect our controller from claim creeps
        if (!enemyCreep.parts.claim) return true

        // We identified an enemy claimed near our controller!
        return Result.stop
      },
    )

    // If there is an enemy claimer, we want to safemode
    return !enemyCoord
  }

  static findPresentThreat(room: Room) {

    if (!room.towerInferiority) return false

    const presentThreat: PresentThreat = {
      total: 0,
      byPlayers: {},
    }

    for (const enemyCreep of room.roomManager.enemyAttackers) {
      let creepThreat = 0

      creepThreat += enemyCreep.combatStrength.dismantle
      creepThreat += enemyCreep.combatStrength.melee * 1.2
      creepThreat += enemyCreep.combatStrength.ranged * 3.5

      creepThreat += enemyCreep.combatStrength.heal / enemyCreep.defenceStrength

      creepThreat = Math.floor(creepThreat)

      presentThreat.total += creepThreat

      const playerName = enemyCreep.owner.username
      if (playerName === 'Invader') continue

      const playerThreat = presentThreat.byPlayers[enemyCreep.owner.username]
      if (playerThreat) {
        presentThreat.byPlayers[playerName] = playerThreat + creepThreat
        continue
      }

      presentThreat.byPlayers[playerName] = creepThreat
    }

    return presentThreat
  }
}
