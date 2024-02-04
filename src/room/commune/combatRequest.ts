import { CombatRequestKeys, RoomMemoryKeys, customColors } from '../../constants/general'
import { CommuneManager } from './commune'
import { StatsManager } from 'international/stats'
import { randomIntRange, Utils } from 'utils/utils'
import { CombatRequest } from 'types/internationalRequests'
import { CommuneOps } from './communeOps'

const checkRoomStatusInverval = randomIntRange(200, 500)

export class CombatRequestManager {
  communeManager: CommuneManager

  constructor(communeManager: CommuneManager) {
    this.communeManager = communeManager
  }

  public run() {
    const { room } = this.communeManager

    for (
      let index = room.memory[RoomMemoryKeys.combatRequests].length - 1;
      index >= 0;
      index -= 1
    ) {
      const requestName = room.memory[RoomMemoryKeys.combatRequests][index]
      const request = Memory.combatRequests[requestName]

      // The request has been deleted by soemthing else

      if (!request) {
        room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
        continue
      }

      // We have no way to make creeps

      if (!room.roomManager.structures.spawn.length) {
        delete request[CombatRequestKeys.responder]
        room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
        continue
      }

      // We don't have enough energy to respond to the request

      if (!this.canKeepRequest(requestName, request)) {
        delete request[CombatRequestKeys.responder]
        room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
      }

      this[`${request[CombatRequestKeys.type]}Request`](requestName, index)
    }
  }

  private canKeepRequest(requestName: string, request: Partial<CombatRequest>) {
    const { room } = this.communeManager

    // Ensure we aren't responding to too many requests for our energy level

    if (room.storage && room.controller.level >= 4) {
      if (
        room.memory[RoomMemoryKeys.combatRequests].length >= room.communeManager.maxCombatRequests
      )
        return false
    }

    // If the room is closed or is now a respawn or novice zone
    if (
      Utils.isTickInterval(checkRoomStatusInverval) &&
      Memory.rooms[room.name][RoomMemoryKeys.status] !==
        Memory.rooms[requestName][RoomMemoryKeys.status]
    ) {
      return false
    }

    if (
      room.memory[RoomMemoryKeys.combatRequests].length >=
      room.communeManager.estimatedEnergyIncome / 10
    ) {
      return false
    }

    return true
  }

  private attackRequest(requestName: string, index: number) {
    const { room } = this.communeManager
    const request = Memory.combatRequests[requestName]
    const requestRoom = Game.rooms[requestName]
    if (!requestRoom) return

    // If there are threats to our hegemony, temporarily abandon the request
    /*
        if (requestRoom.roomManager.enemyAttackers.length > 0) {
            request[CombatRequestKeys.abandon] = 1500

            room.memory.combatRequests.splice(index, 1)
            delete request.responder
            return
        }
 */

    // If there is a controller and it's in safemode, abandon until it ends

    if (requestRoom.controller && requestRoom.controller.safeMode) {
      request[CombatRequestKeys.abandon] = requestRoom.controller.safeMode

      this.manageAbandonment(requestName, index)
      return
    }
    /*
        const enemySquadData = requestRoom.roomManager.enemySquadData

        request[CombatRequestKeys.minRangedHeal] = Math.max(enemySquadData.highestRangedDamage, 1)
        request[CombatRequestKeys.minDamage] = enemySquadData.highestHeal * 1.2
 */

    const towers = requestRoom.roomManager.structures.tower

    let minDamage = 1
    let minMeleeHeal = towers.length ? towers.length * TOWER_POWER_ATTACK : 1
    let minRangedHeal = towers.length ? towers.length * TOWER_POWER_ATTACK : 1

    for (const enemyCreep of room.roomManager.enemyAttackers) {
      // If we have tower(s) and its an invader, don't care about it

      minDamage += Math.max(enemyCreep.combatStrength.heal * 1.2, Math.ceil(enemyCreep.hits / 50))
      minMeleeHeal += enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged
      minRangedHeal += enemyCreep.combatStrength.ranged
    }

    request[CombatRequestKeys.minRangedHeal] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minRangedHeal,
    )
    request[CombatRequestKeys.minMeleeHeal] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minMeleeHeal,
    )
    request[CombatRequestKeys.minDamage] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minDamage,
    )

    // If there are no enemyCreeps
    if (
      !requestRoom.roomManager.notMyCreeps.enemy.length &&
      (!requestRoom.controller || !requestRoom.controller.owner)
    ) {
      request[CombatRequestKeys.inactionTimer] -= 1
      this.manageInaction(requestName, index)
    } else request[CombatRequestKeys.inactionTimer] = request[CombatRequestKeys.inactionTimerMax]
  }

  private harassRequest(requestName: string, index: number) {
    const { room } = this.communeManager
    const request = Memory.combatRequests[requestName]
    const requestRoom = Game.rooms[requestName]
    if (!requestRoom) return
    /*
        if (Game.time % Math.floor(Math.random() * 100) === 0) {
            const structures = requestRoom[CreepMemoryKeys.structureTarget]s

            let totalHits = 0
            for (const structure of structures) totalHits += structure.hits

            if (structures.length > 0)
                request[CombatRequestKeys.dismantle] = Math.min(Math.ceil(totalHits / DISMANTLE_POWER / 5000), 20)
        }
 */
    // If there are threats to our hegemony, temporarily abandon the request

    const threateningAttacker = requestRoom.roomManager.enemyAttackers.find(
      creep => creep.combatStrength.ranged + creep.combatStrength.ranged > 0,
    )

    if (threateningAttacker) {
      request[CombatRequestKeys.abandon] = 1500

      CommuneOps.deleteCombatRequest(room, requestName, index)
      return
    }

    // If there are no enemyCreeps
    if (!requestRoom.roomManager.notMyCreeps.enemy.length) {
      request[CombatRequestKeys.inactionTimer] -= 1
      this.manageInaction(requestName, index)
    } else {
      if (!request[CombatRequestKeys.inactionTimerMax]) {
        CommuneOps.deleteCombatRequest(room, requestName, index)
        return
      }

      request[CombatRequestKeys.inactionTimer] = request[CombatRequestKeys.inactionTimerMax]
    }
  }

  private defendRequest(requestName: string, index: number) {
    const { room } = this.communeManager
    const request = Memory.combatRequests[requestName]
    const requestRoom = Game.rooms[requestName]
    if (!requestRoom) return

    if (requestRoom.controller && requestRoom.controller.safeMode) {
      request[CombatRequestKeys.abandon] = requestRoom.controller.safeMode

      this.manageAbandonment(requestName, index)
      return
    }

    const hasTowers = !!room.roomManager.structures.tower.length

    let minDamage = 1
    let minMeleeHeal = 1
    let minRangedHeal = 1

    for (const enemyCreep of room.roomManager.enemyAttackers) {
      // If we have tower(s) and its an invader, don't care about it
      if (hasTowers && enemyCreep.owner.username === 'Invader') {
        continue
      }

      minDamage += Math.max(enemyCreep.combatStrength.heal * 1.2, Math.ceil(enemyCreep.hits / 50))
      minMeleeHeal += enemyCreep.combatStrength.melee + enemyCreep.combatStrength.ranged
      minRangedHeal += enemyCreep.combatStrength.ranged
    }

    request[CombatRequestKeys.minRangedHeal] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minRangedHeal,
    )
    request[CombatRequestKeys.minMeleeHeal] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minMeleeHeal,
    )
    request[CombatRequestKeys.minDamage] = Math.max(
      request[CombatRequestKeys.minRangedHeal],
      minDamage,
    )

    // If there is nothing to defend from right now
    if (!requestRoom.roomManager.enemyDamageThreat) {
      request[CombatRequestKeys.inactionTimer] -= 1
      this.manageInaction(requestName, index)
    } else {
      if (!request[CombatRequestKeys.inactionTimerMax]) {
        CommuneOps.deleteCombatRequest(room, requestName, index)
        return
      }

      request[CombatRequestKeys.inactionTimer] = request[CombatRequestKeys.inactionTimerMax]
    }
  }

  private manageInaction(requestName: string, index: number) {
    const request = Memory.combatRequests[requestName]

    if (request[CombatRequestKeys.inactionTimer] <= 0) {
      CommuneOps.deleteCombatRequest(this.communeManager.room, requestName, index)
      return
    }
  }

  private manageAbandonment(requestName: string, index: number) {
    const request = Memory.combatRequests[requestName]

    if (request[CombatRequestKeys.abandonments] >= 3) {
      // Delete the request

      CommuneOps.deleteCombatRequest(this.communeManager.room, requestName, index)
      return
    }

    if (request[CombatRequestKeys.abandon] > 0) {
      // Stop responding to the request

      this.communeManager.room.memory[RoomMemoryKeys.combatRequests].splice(index, 1)
      delete request[CombatRequestKeys.responder]
      return
    }
  }
}
