import { packCoord } from "other/codec"
import { communeDataManager } from "./communeData"
import { roomDataManager } from "room/roomData"
import { packAsNum, unpackNumAsCoord } from "utils/utils"
import { Result, generalRepairStructureTypes } from "international/constants"

export class CommuneUtils {
  getRCLUpdate(room: Room) {

    const data = communeDataManager.data[room.name]
    // If the registered RCL is the actual RCL, we're good. No need to update anything
    if (data.registeredRCL === room.controller.level) {
      return
    }
    // If things haven't been registered yet
    if (data.registeredRCL === undefined) {
      return
    }

    this.updateRegisteredRCL(room)
  }

  private updateRegisteredRCL(room: Room) {

    const communeData = communeDataManager.data[room.name]
    /* const roomData = roomDataManager.data[room.name] */

    delete communeData.registeredRCL
    delete communeData.generalRepairStructureCoords

    communeData.registeredRCL = room.controller.level
  }

  getGeneralRepairStructures(room: Room) {
    if (room.generalRepairStructures) return room.generalRepairStructures

    const generalRepairStructures: (StructureContainer | StructureRoad)[] = []
    if (this.getGeneralRepairStructuresFromCoords(room, generalRepairStructures) === Result.success) {
      return generalRepairStructures
    }

    const structureCoords = new Set<number>()
    const structures = room.roomManager.structures
    const relevantStructures = (
        structures.container as (StructureContainer | StructureRoad)[]
    ).concat(structures.road)
    const basePlans = room.roomManager.basePlans
    const RCL = room.controller.level

    for (const structure of relevantStructures) {
        const coordData = basePlans.map[packCoord(structure.pos)]
        if (!coordData) continue

        for (const data of coordData) {
            if (data.minRCL > RCL) continue
            if (data.structureType !== structure.structureType) break

            generalRepairStructures.push(structure)
            structureCoords.add(packAsNum(structure.pos))
            break
        }
    }

    communeDataManager.data[room.name].generalRepairStructureCoords = structureCoords

    room.generalRepairStructures = generalRepairStructures
    return generalRepairStructures
  }

  private getGeneralRepairStructuresFromCoords(room: Room, generalRepairStructures: (StructureContainer | StructureRoad)[]) {

    const structureCoords = communeDataManager.data[room.name].generalRepairStructureCoords
    if (!structureCoords) return Result.fail

    for (const packedCoord of structureCoords) {

      const coord = unpackNumAsCoord(packedCoord)

      const structure = room.findStructureAtCoord<StructureContainer | StructureRoad>(coord, structure => generalRepairStructureTypes.has(structure.structureType))
      if (!structure) return Result.fail

      generalRepairStructures.push(structure)
    }

    return Result.success
  }
}

export const communeUtils = new CommuneUtils()
