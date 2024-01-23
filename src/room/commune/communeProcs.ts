import { RoomUtils } from 'room/roomUtils'
import { CommuneDataProcs, communeData } from './communeData'
import { communeUtils } from './communeUtils'
import {
  RoomLogisticsRequestTypes,
  RoomMemoryKeys,
  haulerUpdateDefault,
} from 'international/constants'
import { randomIntRange } from 'utils/utils'

/**
 * Minor processes for communes
 */
export class CommuneProcs {
  static getRCLUpdate(room: Room) {
    const data = communeData[room.name]
    // If the registered RCL is the actual RCL, we're good. No need to update anything
    if (data.registeredRCL === room.controller.level) {
      return
    }
    // If things haven't been registered yet
    if (data.registeredRCL === undefined) {
      data.registeredRCL = room.controller.level
      return
    }

    this.updateRegisteredRCL(room)
  }

  private static updateRegisteredRCL(room: Room) {
    const data = communeData[room.name]
    /* const roomData = roomData[room.name] */

    delete data.generalRepairStructureCoords

    data.registeredRCL = room.controller.level
  }

  static tryUpdateMinHaulerCost(room: Room) {
    const roomMemory = Memory.rooms[room.name]

    // If there is no min hauler size

    if (roomMemory[RoomMemoryKeys.minHaulerCost] === undefined) {
      roomMemory[RoomMemoryKeys.minHaulerCost] = Math.max(
        Memory.minHaulerCost,
        200 * room.roomManager.structures.spawn.length,
      )
      roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(1500, 3000)
      return
    }

    if (Game.time - roomMemory[RoomMemoryKeys.minHaulerCostUpdate] < haulerUpdateDefault) return

    // update the min hauler cost

    roomMemory[RoomMemoryKeys.minHaulerCost] = Math.max(
      Memory.minHaulerCost,
      100 * room.roomManager.structures.spawn.length,
    )
    roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(0, 10)
  }

  static registerRampartDamage(room: Room) {
    if (!room.roomManager.enemyAttackers.length) return

    const data = communeData[room.name]
    if (data.rampartDamageCoords === undefined || room.roomManager.structureUpdate) {
      this.initRampartDamageCoords(room)
    }
  }

  private static initRampartDamageCoords(room: Room) {
    const ramparts = room.communeManager.defensiveRamparts
    for (const rampart of ramparts) {
    }
  }
}
