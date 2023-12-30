import { packCoord, unpackCoord } from "other/codec"
import { communeDataManager } from "./communeData"
import { roomDataManager } from "room/roomData"
import { packAsNum, unpackNumAsCoord } from "utils/utils"
import { Result, generalRepairStructureTypes, structureTypesToProtectSet } from "international/constants"

export class CommuneUtils {
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
    delete communeData.rampartRepairStructureCoords

    communeData.registeredRCL = room.controller.level
  }

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
        if (!generalRepairStructureTypes.has(data.structureType as (STRUCTURE_ROAD | STRUCTURE_CONTAINER))) break

        structureCoords.add(packedCoord)

        const coord = unpackCoord(packedCoord)
        const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(coord, structure => generalRepairStructureTypes.has(structure.structureType))
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

      const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(coord, structure => generalRepairStructureTypes.has(structure.structureType))
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

    room.rampartRepairStructures
    return repairTargets
  }
}

export const communeUtils = new CommuneUtils()
