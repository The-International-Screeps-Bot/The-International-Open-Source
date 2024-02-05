import {
  RoomLogisticsRequestTypes,
  linkReceiveTreshold,
  linkSendThreshold,
} from '../../constants/general'
import { LogOps } from 'utils/logOps'
import { CommuneManager } from './commune'
import { StructureUtils } from 'room/structureUtils'
import { CommuneUtils } from './communeUtils'

export class LinkManager {
  communeManager: CommuneManager

  constructor(communeManager: CommuneManager) {
    this.communeManager = communeManager
  }

  run() {
    this.sourcesToReceivers()

    if (!this.communeManager.room.storage && !this.communeManager.room.terminal) {
      const controllerLink = this.communeManager.controllerLink
      if (!controllerLink || !StructureUtils.isRCLActionable(controllerLink)) return

      this.createControllerLinkRoomLogisticsRequest(controllerLink)
      return
    }

    this.hubToFastFiller()
    this.hubToController()
  }

  private sourcesToReceivers() {
    const sourceLinks = this.communeManager.room.communeManager.sourceLinks.filter(
      link => link && StructureUtils.isRCLActionable(link),
    )
    if (!sourceLinks.length) return

    let receiverLinks = [
      this.communeManager.room.roomManager.fastFillerLink,
      this.communeManager.room.roomManager.hubLink,
      this.communeManager.controllerLink,
    ].filter(link => link && StructureUtils.isRCLActionable(link))

    if (!receiverLinks.length) return

    // Loop through each sourceLink

    for (const sourceLink of sourceLinks) {
      if (!sourceLink) continue
      // If the link is not nearly full, iterate

      if (
        sourceLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold >
        sourceLink.store.energy
      )
        continue

      // Otherwise, loop through each receiverLink

      for (const receiverLink of receiverLinks as StructureLink[]) {
        // If the link is more than x% full, iterate

        if (
          receiverLink.store.energy >
          receiverLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold
        )
          continue

        // Otherwise, have the sourceLink transfer to the receiverLink

        sourceLink.transferEnergy(receiverLink)

        receiverLink.store.energy += sourceLink.store.energy
        sourceLink.store.energy -=
          receiverLink.store.getCapacity(RESOURCE_ENERGY) - receiverLink.store.energy

        // And stop the loop

        break
      }
    }
  }

  private hubToFastFiller() {
    const fastFillerLink = this.communeManager.room.roomManager.fastFillerLink
    if (!fastFillerLink || !StructureUtils.isRCLActionable(fastFillerLink)) return

    const hubLink = this.communeManager.room.roomManager.hubLink
    if (!hubLink || !StructureUtils.isRCLActionable(hubLink)) {
      this.createFastFillerLinkRoomLogisticsRequest(fastFillerLink)
      return
    }

    // If the hubLink is not sufficiently full, stop

    if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold > hubLink.store.energy)
      return

    // If the fastFillerLink is more than x% full, stop

    if (
      fastFillerLink.store.energy >
      fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold
    )
      return

    // Otherwise, have the sourceLink transfer to the recieverLink

    hubLink.transferEnergy(fastFillerLink)

    fastFillerLink.store.energy += hubLink.store.energy
    hubLink.store.energy -= fastFillerLink.store.getFreeCapacity(RESOURCE_ENERGY)
  }

  private createFastFillerLinkRoomLogisticsRequest(fastFillerLink: StructureLink) {
    // If we have suffient energy

    if (
      fastFillerLink.reserveStore.energy >
      fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.5
    )
      return

    this.communeManager.room.createRoomLogisticsRequest({
      target: fastFillerLink,
      type: RoomLogisticsRequestTypes.transfer,
      priority: 10,
    })
  }

  private hubToController() {
    const controllerLink = this.communeManager.controllerLink
    if (!controllerLink || !StructureUtils.isRCLActionable(controllerLink)) return

    const hubLink = this.communeManager.room.roomManager.hubLink
    if (!hubLink || !StructureUtils.isRCLActionable(hubLink)) {
      this.createControllerLinkRoomLogisticsRequest(controllerLink)
      return
    }

    // If the controller is close to downgrading and the storage has insufficient energy, stop

    if (
      this.communeManager.room.controller.ticksToDowngrade > 10000 &&
      this.communeManager.room.roomManager.resourcesInStoringStructures.energy <
        CommuneUtils.storedEnergyUpgradeThreshold(this.communeManager.room) * 0.5
    )
      return

    // If the hubLink is not sufficiently full, stop

    if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold > hubLink.store.energy)
      return

    // If the controllerLink is more than x% full, stop

    if (
      controllerLink.store.energy >
      controllerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold
    )
      return

    // Otherwise, have the sourceLink transfer to the recieverLink

    hubLink.transferEnergy(controllerLink)

    controllerLink.store.energy += hubLink.store.energy
    hubLink.store.energy -= controllerLink.store.getFreeCapacity(RESOURCE_ENERGY)
  }

  private createControllerLinkRoomLogisticsRequest(controllerLink: StructureLink) {
    // If we have suffient energy

    if (
      controllerLink.reserveStore.energy >
      controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.75
    )
      return

    this.communeManager.room.createRoomLogisticsRequest({
      target: controllerLink,
      type: RoomLogisticsRequestTypes.transfer,
      priority: 100,
    })
  }
}
