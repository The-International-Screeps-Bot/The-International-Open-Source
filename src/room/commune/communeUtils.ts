import { packCoord, unpackCoord } from "other/codec"
import { communeDataManager } from "./communeData"
import { roomDataManager } from "room/roomData"
import { findLinkThroughput, getRange, packAsNum, unpackNumAsCoord } from 'utils/utils'
import {
  Result,
  RoomMemoryKeys,
  generalRepairStructureTypes,
  packedPosLength,
  structureTypesToProtectSet,
} from 'international/constants'
import { collectiveManager } from "international/collective"
import { roomUtils } from "room/roomUtils"

export class CommuneUtils {
  getGeneralRepairStructures(room: Room) {
    if (room.generalRepairStructures) return room.generalRepairStructures

    const repairTargets = this.getGeneralRepairStructuresFromCoords(room)
    if (repairTargets.length) {
      room.generalRepairStructures = repairTargets
      return repairTargets
    }

    const structureCoords = new Set<string>()
    const basePlans = room.roomManager.basePlans

    for (const packedCoord in basePlans.map) {
      const coordData = basePlans.map[packedCoord]
      for (const data of coordData) {
        if (data.minRCL > room.controller.level) continue
        if (
          !generalRepairStructureTypes.has(
            data.structureType as STRUCTURE_ROAD | STRUCTURE_CONTAINER,
          )
        )
          break

        structureCoords.add(packedCoord)

        const coord = unpackCoord(packedCoord)
        const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(
          coord,
          structure => generalRepairStructureTypes.has(structure.structureType),
        )
        if (!structure) continue

        repairTargets.push(structure)
        break
      }
    }

    communeDataManager.data[room.name].generalRepairStructureCoords = structureCoords

    room.generalRepairStructures = repairTargets
    return repairTargets
  }

  private getGeneralRepairStructuresFromCoords(room: Room) {
    const repairTargets: (StructureContainer | StructureRoad)[] = []
    const structureCoords = communeDataManager.data[room.name].generalRepairStructureCoords
    if (!structureCoords) return repairTargets

    for (const packedCoord of structureCoords) {
      const coord = unpackCoord(packedCoord)

      const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(
        coord,
        structure => generalRepairStructureTypes.has(structure.structureType),
      )
      if (!structure) return []

      repairTargets.push(structure)
    }

    return repairTargets
  }

  getRampartRepairTargets(room: Room) {
    if (room.rampartRepairStructures) return room.rampartRepairStructures

    const repairTargets: StructureRampart[] = []
    const rampartPlans = room.roomManager.rampartPlans
    const buildSecondMincutLayer = room.communeManager.buildSecondMincutLayer
    const nukeTargetCoords = room.roomManager.nukeTargetCoords

    for (const structure of room.roomManager.structures.rampart) {
      const data = rampartPlans.map[packCoord(structure.pos)]
      if (!data) continue

      if (data.minRCL > room.controller.level) continue
      if (
        data.coversStructure &&
        !room.coordHasStructureTypes(structure.pos, structureTypesToProtectSet)
      ) {
        continue
      }

      if (data.buildForNuke) {
        if (!nukeTargetCoords[packAsNum(structure.pos)]) continue

        repairTargets.push(structure)
        continue
      }
      if (data.buildForThreat) {
        if (!buildSecondMincutLayer) continue

        repairTargets.push(structure)
        continue
      }

      repairTargets.push(structure)
    }

    room.rampartRepairStructures = repairTargets
    return repairTargets
  }

  /**
   * The presently desired upgrader strength for the commune based on energy thresholds
   */
  getDesiredUpgraderStrength(room: Room) {
    const strength = Math.pow(
      (room.roomManager.resourcesInStoringStructures.energy -
        room.communeManager.storedEnergyUpgradeThreshold * 0.5) /
        (6000 + room.controller.level * 2000),
      2,
    )

    return strength
  }

  getMaxUpgradeStrength(room: Room) {
    const data = communeDataManager.data[room.name]
    if (data.maxUpgradeStrength !== undefined && !room.roomManager.structureUpdate)
      return data.maxUpgradeStrength

    let maxUpgradeStrength = 0

    const upgradeStructure = room.communeManager.upgradeStructure
    if (!upgradeStructure) return room.communeManager.findNudeMaxUpgradeStrength()

    // Container

    if (upgradeStructure.structureType === STRUCTURE_CONTAINER) {
      maxUpgradeStrength =
        upgradeStructure.store.getCapacity() /
        (4 + room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength)

      data.maxUpgradeStrength = maxUpgradeStrength
      return maxUpgradeStrength
    }

    // Link

    const hubLink = room.roomManager.hubLink
    const sourceLinks = room.communeManager.sourceLinks

    // If there are transfer links, max out partMultiplier to their ability

    maxUpgradeStrength = 0

    if (hubLink && hubLink.isRCLActionable) {
      // Add a bit of extra range because of inherent limitations of withdrawing and transferring
      const range = getRange(upgradeStructure.pos, hubLink.pos) + 3

      // Increase strength by throughput
      maxUpgradeStrength += findLinkThroughput(range) * 0.7
    }

    for (let i = 0; i < sourceLinks.length; i++) {
      const sourceLink = sourceLinks[i]

      if (!sourceLink) continue
      if (!sourceLink.isRCLActionable) continue

      const range = getRange(sourceLink.pos, upgradeStructure.pos)

      // Increase strength by throughput

      maxUpgradeStrength += findLinkThroughput(range, this.getEstimatedSourceIncome(room)[i]) * 0.7
    }

    data.maxUpgradeStrength = maxUpgradeStrength
    return maxUpgradeStrength
  }

  getEstimatedSourceIncome(room: Room) {
    const data = communeDataManager.data[room.name]
    if (data.estimatedCommuneSourceIncome !== undefined) return data.estimatedCommuneSourceIncome

    const sources = roomUtils.getSources(room)
    const estimatedIncome: number[] = []

    for (let i = 0; i < sources.length; i += 1) {
      const source = sources[i]

      let effect = source.effectsData.get(PWR_DISRUPT_SOURCE) as PowerEffect
      if (effect) continue

      let income = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME

      effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
      if (effect)
        income +=
          POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] /
          POWER_INFO[PWR_REGEN_SOURCE].period

      estimatedIncome[i] = income
    }

    data.estimatedCommuneSourceIncome = estimatedIncome
    return estimatedIncome
  }
}

export const communeUtils = new CommuneUtils()
