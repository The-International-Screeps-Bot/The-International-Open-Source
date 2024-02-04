import { RoomMemoryKeys } from '../constants/general'

export class StructureUtils {
  static isRCLActionable(structure: Structure) {
    if (structure.isRCLActionable !== undefined) return structure.isRCLActionable

    if (!structure.room.controller) return (structure.isRCLActionable = true)
    if (
      Memory.rooms[structure.room.name][RoomMemoryKeys.greatestRCL] ===
      structure.room.controller.level
    )
      return (structure.isRCLActionable = true)

    return (structure.isRCLActionable = structure.isActive())
  }
}
