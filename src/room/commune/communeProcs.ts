import { roomUtils } from 'room/roomUtils'
import { communeDataManager } from './communeData'
import { communeUtils } from './communeUtils'
import { RoomLogisticsRequestTypes, RoomMemoryKeys, haulerUpdateDefault } from 'international/constants'
import { randomIntRange } from 'utils/utils'

/**
 * Minor processes for communes
 */
export class CommuneProcs {
  registerFunneling(room: Room) {
    // We need a terminal and for it be to active
    if (!room.terminal || room.controller.level < 6) return

    const desiredStrength = communeUtils.getDesiredUpgraderStrength(room)
    const maxStrength = communeUtils.getMaxUpgradeStrength(room)
    // We do not have enough desire
    if (desiredStrength < maxStrength) return

    // We have enough desired strength to register our room as fully funneled
    room.considerFunneled = true
  }

  getRCLUpdate(room: Room) {
    const data = communeDataManager.data[room.name]
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

  private updateRegisteredRCL(room: Room) {
    const communeData = communeDataManager.data[room.name]
    /* const roomData = roomDataManager.data[room.name] */

    delete communeData.generalRepairStructureCoords

    communeData.registeredRCL = room.controller.level
  }

  tryUpdateMinHaulerCost(room: Room) {
    const roomMemory = Memory.rooms[room.name]

    // If there is no min hauler size

    if (roomMemory[RoomMemoryKeys.minHaulerCost] === undefined) {

        roomMemory[RoomMemoryKeys.minHaulerCost] = Math.max(Memory.minHaulerCost, 200 * room.roomManager.structures.spawn.length)
        roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(1500, 3000)
        return
    }

    if (Game.time - roomMemory[RoomMemoryKeys.minHaulerCostUpdate] < haulerUpdateDefault) return

    // update the min hauler cost

    roomMemory[RoomMemoryKeys.minHaulerCost] = Math.max(Memory.minHaulerCost, 100 * room.roomManager.structures.spawn.length)
    roomMemory[RoomMemoryKeys.minHaulerCostUpdate] = Game.time + randomIntRange(0, 10)
  }
}

export const communeProcs = new CommuneProcs()
