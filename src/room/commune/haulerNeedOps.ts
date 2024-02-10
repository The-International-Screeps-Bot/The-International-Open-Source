import { RoomMemoryKeys, packedCoordLength, packedPosLength, stamps } from '../../constants/general'
import { RoomStatsKeys } from '../../constants/stats'
import { StructureUtils } from 'room/structureUtils'
import { findCarryPartsRequired } from 'utils/utils'
import { CommuneUtils } from './communeUtils'
import { RoomOps } from 'room/roomOps'

export class HaulerNeedOps {
  static run(room: Room) {
    this.sourceNeed(room)
    this.controllerNeed(room)

    room.communeManager.communeHaulerNeed += findCarryPartsRequired(
      room.memory[RoomMemoryKeys.mineralPath].length / packedPosLength + 3,
      (room.communeManager.mineralHarvestStrength / EXTRACTOR_COOLDOWN) * 1.1,
    )
    const structures = room.roomManager.structures
    room.communeManager.communeHaulerNeed += structures.lab.length

    const extensions = structures.extension.length - stamps.fastFiller.structures.extension.length
    if (extensions > 0) {
      structures.extension.length / (room.towerInferiority ? 1.5 : 4)
    }

    /* haulerNeed += room.roomManager.structures.extension.length / 10 */

    this.storingStructureNeed(room)

    room.communeManager.communeHaulerNeed = Math.round(room.communeManager.communeHaulerNeed)
  }

  private static sourceNeed(room: Room) {
    const roomMemory = Memory.rooms[room.name]
    const packedSourcePaths = roomMemory[RoomMemoryKeys.communeSourcePaths]
    const estimatedSourceIncome = CommuneUtils.getEstimatedSourceIncome(room)

    const hubLink = room.roomManager.hubLink
    if (hubLink && StructureUtils.isRCLActionable(hubLink)) {
      // There is a valid hubLink

      const sourceCount = roomMemory[RoomMemoryKeys.sourceCoords].length / packedCoordLength

      for (let index = 0; index < sourceCount; index++) {
        const sourceLink = room.communeManager.sourceLinks[index]
        if (sourceLink && StructureUtils.isRCLActionable(sourceLink)) continue

        room.communeManager.communeHaulerNeed += findCarryPartsRequired(
          packedSourcePaths[index].length / packedPosLength + 3,
          estimatedSourceIncome[index] * 1.1,
        )
      }

      return
    }

    // There is no valid hubLink

    const sourceCount = roomMemory[RoomMemoryKeys.sourceCoords].length / packedCoordLength

    for (let index = 0; index < sourceCount; index++) {
      room.communeManager.communeHaulerNeed += findCarryPartsRequired(
        packedSourcePaths[index].length / packedPosLength + 3,
        estimatedSourceIncome[index] * 1.1,
      )
    }
  }

  private static controllerNeed(room: Room) {
    if (room.controller.level < 2) return

    // There is a viable controllerContainer

    if (room.roomManager.controllerContainer) {
      room.communeManager.communeHaulerNeed += findCarryPartsRequired(
        Memory.rooms[room.name][RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
        room.communeManager.upgradeStrength * 1.1,
      )
      return
    }

    this.controllerNeedLink(room)
  }

  private static controllerNeedLink(room: Room) {
    const controllerLink = room.communeManager.controllerLink
    if (!controllerLink || !StructureUtils.isRCLActionable(controllerLink)) return

    const hubLink = room.roomManager.hubLink
    // No need to haul if there is a valid hubLink
    if (hubLink && StructureUtils.isRCLActionable(hubLink)) return

    // There is a viable controllerLink but we need to haul to it

    room.communeManager.communeHaulerNeed += findCarryPartsRequired(
      Memory.rooms[room.name][RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
      room.communeManager.upgradeStrength * 1.1,
    )
    return
  }

  private static storingStructureNeed(room: Room) {
    const storingStructures = CommuneUtils.storingStructures(room)
    if (!storingStructures.length) return

    room.communeManager.communeHaulerNeed +=
      Memory.stats.rooms[room.name][RoomStatsKeys.EnergyOutputSpawn] / 10
    room.communeManager.communeHaulerNeed +=
      Memory.stats.rooms[room.name][RoomStatsKeys.SpawnUsagePercentage] * 8
  }
}
