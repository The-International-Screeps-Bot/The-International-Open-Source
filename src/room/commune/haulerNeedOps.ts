import { RoomMemoryKeys, RoomStatsKeys, packedPosLength, stamps } from '../../constants/general'
import { StructureUtils } from 'room/structureUtils'
import { findCarryPartsRequired } from 'utils/utils'
import { CommuneUtils } from './communeUtils'

export class HaulerNeedOps {
  static run(room: Room) {
    this.sourceNeed(room)
    this.controllerNeed(room)

    room.communeManager.communeHaulerNeed += findCarryPartsRequired(
      room.memory[RoomMemoryKeys.mineralPath].length / packedPosLength + 3,
      (room.communeManager.mineralHarvestStrength / EXTRACTOR_COOLDOWN) * 1.1,
    )
    room.communeManager.communeHaulerNeed += room.roomManager.structures.lab.length

    const extensions =
      room.roomManager.structures.extension.length - stamps.fastFiller.structures.extension.length
    if (extensions > 0) {
      room.roomManager.structures.extension.length / (room.towerInferiority ? 1.5 : 4)
    }

    /* haulerNeed += room.roomManager.structures.extension.length / 10 */

    if (
      (room.controller.level >= 4 && room.storage) ||
      (room.terminal && room.controller.level >= 6)
    ) {
      room.communeManager.communeHaulerNeed +=
        Memory.stats.rooms[room.name][RoomStatsKeys.EnergyOutputSpawn] / 10
      room.communeManager.communeHaulerNeed +=
        Memory.stats.rooms[room.name][RoomStatsKeys.SpawnUsagePercentage] * 8
    }

    room.communeManager.communeHaulerNeed = Math.round(room.communeManager.communeHaulerNeed)
  }

  private static sourceNeed(room: Room) {
    const packedSourcePaths = Memory.rooms[room.name][RoomMemoryKeys.communeSourcePaths]
    const estimatedSourceIncome = CommuneUtils.getEstimatedSourceIncome(room)

    const hubLink = room.roomManager.hubLink
    if (hubLink && StructureUtils.isRCLActionable(hubLink)) {
      // There is a valid hubLink

      for (let index in room.find(FIND_SOURCES)) {
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

    for (let index in room.find(FIND_SOURCES)) {
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
}
