import { roomUtils } from 'room/roomUtils'
import { communeDataManager } from './communeData'
import { communeUtils } from './communeUtils'

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
}

export const communeProcs = new CommuneProcs()
