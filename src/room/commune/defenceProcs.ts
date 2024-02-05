import { CollectiveManager } from "international/collective"
import {
  Result,
  ourImpassibleStructuresSet,
  RoomMemoryKeys,
  PlayerMemoryKeys,
  CombatRequestKeys,
  defaultDataDecay,
} from '../../constants/general'
import { PlayerManager } from "international/players"
import { simpleAllies } from "international/simpleAllies/simpleAllies"
import { packCoord } from "other/codec"
import { RoomNameUtils } from "room/roomNameUtils"
import { LogOps, LogTypes } from 'utils/logOps'
import { findObjectWithID, isAlly, randomIntRange } from 'utils/utils'
import { DefenceUtils } from './defenceUtils'

export class DefenceProcs {
  static run(room: Room) {
    if (!room.roomManager.notMyCreeps.enemy.length) {
      this.considerRampartsPublic(room)
      return
    }

    // There are at least enemy creeps

    this.makeRampartsPrivate(room)
    this.advancedActivateSafeMode(room)

    if (!room.roomManager.enemyAttackers.length) return

    // There are at least enemyAttackers

    this.assignDefenceTargets(room)
  }

  private static advancedActivateSafeMode(room: Room) {
    if (!DefenceUtils.shouldSafeMode(room)) return

    // If another room is safemoded and we determined it to be okay: unclaim it so we can safemode
    if (CollectiveManager.safemodedCommuneName) {
      const safemodedRoom = Game.rooms[CollectiveManager.safemodedCommuneName]
      safemodedRoom.controller.unclaim()
      // Add a return if we can't unclaim and safemode on the same tick
    }

    if (room.controller.activateSafeMode() !== OK) return

    // Safemode was probably activated

    // Record that we safemoded so other communes know
    CollectiveManager.safemodedCommuneName = room.name
  }

  private static considerRampartsPublic(room: Room) {
    if (!global.settings.publicRamparts) return

    const roomMemory = Memory.rooms[room.name]

    // Wait some pseudo-random time before publicizing ramparts
    if (
      roomMemory[RoomMemoryKeys.lastAttackedBy] !== undefined &&
      roomMemory[RoomMemoryKeys.lastAttackedBy] < randomIntRange(100, 150)
    )
      return

    // Publicize at most 10 ramparts per tick, to avoid too many intents

    let intents = 0

    for (const rampart of room.roomManager.structures.rampart) {
      if (intents >= 10) return

      // If the rampart is public

      if (rampart.isPublic) continue

      // Otherwise set the rampart to public, increase increment

      rampart.setPublic(true)
      intents += 1
    }
  }

  private static makeRampartsPrivate(room: Room) {
    for (const rampart of room.roomManager.structures.rampart) {
      if (rampart.isPublic) rampart.setPublic(false)
    }
  }

  private static assignDefenceTargets(room: Room) {
    // Sort by estimated percent health change

    const defenderEnemyTargetsByDamage = Array.from(
      room.defenderEnemyTargetsWithDefender.keys(),
    ).sort((a, b) => {
      const creepA = findObjectWithID(a)
      const creepB = findObjectWithID(b)

      return (
        creepA.hits / creepA.hitsMax -
        (creepA.hits + room.defenderEnemyTargetsWithDamage.get(a)) / creepA.hitsMax -
        (creepB.hits / creepB.hitsMax -
          (creepB.hits + room.defenderEnemyTargetsWithDamage.get(b)) / creepB.hitsMax)
      )
    })

    LogOps.log('ENEMY TARGETS BY DAMAGE', defenderEnemyTargetsByDamage, {
      type: LogTypes.warning,
    })

    // Attack enemies in order of most net damage members can heal

    for (const enemyCreepID of defenderEnemyTargetsByDamage) {
      if (!room.attackingDefenderIDs.size) break

      const enemyCreep = findObjectWithID(enemyCreepID)

      for (const memberID of room.defenderEnemyTargetsWithDefender.get(enemyCreepID)) {
        if (!room.attackingDefenderIDs.has(memberID)) continue

        const member = Game.getObjectById(memberID)

        Game.creeps[member.name].combatTarget = enemyCreep

        room.attackingDefenderIDs.delete(memberID)
      }

      if (room.communeManager.towerAttackTarget) continue

      const damage = room.defenderEnemyTargetsWithDamage.get(enemyCreep.id)
      room.visual.text(damage.toString(), enemyCreep.pos.x, enemyCreep.pos.y - 0.25, {
        font: 0.3,
      })

      if (enemyCreep.owner.username === 'Invader') {
        if (damage <= 0) continue
      } else {
        const playerMemory =
          Memory.players[enemyCreep.owner.username] ||
          PlayerManager.initPlayer(enemyCreep.owner.username)
        const weight = playerMemory[PlayerMemoryKeys.rangeFromExitWeight]

        if (/* findWeightedRangeFromExit(enemyCreep.pos, weight) *  */ damage < enemyCreep.hits)
          continue
      }

      room.communeManager.towerAttackTarget = enemyCreep
    }
  }

  static manageDefenceRequests(room: Room) {
    if (!room.towerInferiority) return

    const hasTowers = !!room.roomManager.structures.tower.length

    let onlyInvader = true
    let minDamage = 0
    let minMeleeHeal = 0
    let minRangedHeal = 0

    for (const enemyCreep of room.roomManager.enemyAttackers) {
      if (enemyCreep.owner.username === 'Invader') {
        // If we have towers, don't care about the invader
        if (hasTowers) continue
      } else onlyInvader = false

      minDamage += Math.max(enemyCreep.combatStrength.heal * 1.2, Math.ceil(enemyCreep.hits / 50))
      minMeleeHeal += enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged
      minRangedHeal += enemyCreep.combatStrength.ranged
    }

    // If we have towers and it's only invaders, we don't need a defence request
    if (onlyInvader && hasTowers) return

    // There is tower inferiority, make a defend request

    room.createDefendCombatRequest({
      [CombatRequestKeys.minDamage]: minDamage,
      [CombatRequestKeys.minMeleeHeal]: minMeleeHeal,
      [CombatRequestKeys.minRangedHeal]: minRangedHeal,
      [CombatRequestKeys.quadQuota]: 1,
      [CombatRequestKeys.inactionTimerMax]: onlyInvader ? 1 : randomIntRange(2000, 3000),
    })

    if (!global.settings.allyCommunication) return

    simpleAllies.requestDefense({
      roomName: room.name,
      priority: 1,
    })
  }

  static manageThreat(room: Room) {
    const presentThreat = DefenceUtils.findPresentThreat(room)
    const roomMemory = Memory.rooms[room.name]

    if (!presentThreat) {
      // Reduce attack threat over time
      if (roomMemory[RoomMemoryKeys.threatened] > 0)
        roomMemory[RoomMemoryKeys.threatened] *= defaultDataDecay

      if (roomMemory[RoomMemoryKeys.lastAttackedBy] !== undefined)
        roomMemory[RoomMemoryKeys.lastAttackedBy] += 1
      return
    }

    // There is a present threat

    roomMemory[RoomMemoryKeys.threatened] = Math.max(
      roomMemory[RoomMemoryKeys.threatened],
      presentThreat.total,
      PlayerManager.highestThreat / 3,
    )

    for (const playerName in presentThreat.byPlayers) {
      const threat = presentThreat.byPlayers[playerName]

      const player = Memory.players[playerName] || PlayerManager.initPlayer(playerName)

      player[PlayerMemoryKeys.offensiveThreat] = Math.max(
        threat,
        player[PlayerMemoryKeys.offensiveThreat],
      )
      player[PlayerMemoryKeys.hate] = Math.max(threat, player[PlayerMemoryKeys.hate])
      player[PlayerMemoryKeys.lastAttackedBy] = 0
    }

    roomMemory[RoomMemoryKeys.lastAttackedBy] = 0
    return
  }
}

export interface PresentThreat {
  total: number
  byPlayers: {[playerName: string]: number}
}
