import { RoomMemoryKeys } from "international/constants"

export class StructureUtils {
  isRCLActionable(structure: Structure) {
    if (structure._isRCLActionable !== undefined) return structure._isRCLActionable

    if (!structure.room.controller) return (structure._isRCLActionable = true)
    if (Memory.rooms[structure.room.name][RoomMemoryKeys.greatestRCL] === structure.room.controller.level)
        return (structure._isRCLActionable = true)

    return (structure._isRCLActionable = structure.isActive())
  }
}

export const structureUtils = new StructureUtils()
