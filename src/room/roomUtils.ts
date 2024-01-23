import { RoomMemoryKeys, RoomTypes, roomDimensions } from 'international/constants'
import { packCoord, packXYAsCoord, unpackCoord } from 'other/codec'
import { RoomDataManager } from './roomData'
import { findObjectWithID, forAdjacentCoords, utils } from 'utils/utils'
import { structureUtils } from './structureUtils'
import { StructureCoords } from './room'
import { Dashboard, Rectangle, Table } from 'screeps-viz'

export class RoomUtils {
  getRemoteRepairStructures(room: Room) {
    const repairStructures: (StructureContainer | StructureRoad)[] = []
  }

  getSources(room: Room): Source[] {
    const data = RoomDataManager.data[room.name]
    if (data.sourceIDs !== undefined) {
      return data.sourceIDs.map(ID => findObjectWithID(ID))
    }

    const sources = room.find(FIND_SOURCES)
    const sourceIDs = sources.map(source => source.id)

    data.sourceIDs = sourceIDs
    return sources
  }

  /**
   * returns a container if exists and is RCL actionable
   */
  getFastFillerContainerLeft(room: Room) {
    const data = RoomDataManager.data[room.name]
    if (data.fastFillerContainerLeftId !== undefined && !room.roomManager.structureUpdate) {
      return data.fastFillerContainerLeftId
    }

    const anchor = room.roomManager.anchor
    if (!anchor) throw Error('no anchor')

    const container = room.findStructureAtXY<StructureContainer>(
      anchor.x - 2,
      anchor.y,
      structure => structure.structureType === STRUCTURE_CONTAINER,
    )
    if (!container || !structureUtils.isRCLActionable(container)) {
      data.fastFillerContainerLeftId = false
      return false
    }

    data.fastFillerContainerLeftId = container.id
    return container
  }

  /**
   * returns a container if exists and is RCL actionable
   */
  getFastFillerContainerRight(room: Room) {
    const data = RoomDataManager.data[room.name]
    if (data.fastFillerContainerRightId !== undefined && !room.roomManager.structureUpdate) {
      return data.fastFillerContainerRightId
    }

    const anchor = room.roomManager.anchor
    if (!anchor) throw Error('no anchor')

    const container = room.findStructureAtXY<StructureContainer>(
      anchor.x + 2,
      anchor.y,
      structure => structure.structureType === STRUCTURE_CONTAINER,
    )
    if (!container || !structureUtils.isRCLActionable(container)) {
      data.fastFillerContainerRightId = false
      return false
    }

    data.fastFillerContainerRightId = container.id
    return container
  }

  getFastFillerCoords(room: Room) {
    const data = RoomDataManager.data[room.name]
    if (data.fastFillerCoords !== undefined && !room.roomManager.structureUpdate) {
      const fastFillerCoords = data.fastFillerCoords.map(packedCoord => unpackCoord(packedCoord))
      return fastFillerCoords
    }

    const sourcedFastFillerCoords = this.getSourcedFastFillerCoords(room)
    if (!sourcedFastFillerCoords) {
      data.fastFillerCoords = []
      room.fastFillerCoords = []
    }
    const structureCoords = room.roomManager.structureCoords
    const fastFillerCoords: Coord[] = []

    for (const coord of sourcedFastFillerCoords) {
      const spawningStructure = this.findStructureStructureAroundCoord(
        room,
        coord,
        1,
        structure => {
          switch (structure.structureType) {
            case STRUCTURE_SPAWN:
              return true
              break
            case STRUCTURE_EXTENSION:
              return true
              break
            default:
              return false
          }
        },
        structureCoords,
      )
      if (!spawningStructure) continue

      // There is a valid spawning structure

      fastFillerCoords.push(coord)
    }

    data.fastFillerCoords = fastFillerCoords.map(coord => packCoord(coord))
    return fastFillerCoords
  }

  /**
   * fastFiller coords that have a source, but not necessarily a sink
   */
  private getSourcedFastFillerCoords(room: Room) {
    const anchor = room.roomManager.anchor
    if (!anchor) throw Error('no anchor')

    const fastFillerLink = room.roomManager.fastFillerLink
    // If we have a valid link
    if (fastFillerLink && structureUtils.isRCLActionable(fastFillerLink)) {
      // then all fastFiller positions are valid
      const sourcedFastFillerCoords = [
        // left

        { x: anchor.x - 1, y: anchor.y - 1 },
        { x: anchor.x - 1, y: anchor.y + 1 },

        // right

        { x: anchor.x + 1, y: anchor.y - 1 },
        { x: anchor.x + 1, y: anchor.y + 1 },
      ]
      return sourcedFastFillerCoords
    }

    // Otherwise we can check each side for valid container sources

    let sourcedFastFillerCoords = []

    if (this.getFastFillerContainerLeft(room)) {
      sourcedFastFillerCoords.push({ x: anchor.x - 1, y: anchor.y - 1 })
      sourcedFastFillerCoords.push({ x: anchor.x - 1, y: anchor.y + 1 })
    }

    if (this.getFastFillerContainerRight(room)) {
      sourcedFastFillerCoords.push({ x: anchor.x + 1, y: anchor.y - 1 })
      sourcedFastFillerCoords.push({ x: anchor.x + 1, y: anchor.y + 1 })
    }

    return sourcedFastFillerCoords
  }

  findStructureStructureAroundCoord<T extends Structure>(
    room: Room,
    startCoord: Coord,
    range: number,
    condition: (structure: T) => boolean,
    structureCoords = room.roomManager.structureCoords,
  ): T | false {
    let structureID: Id<Structure>

    for (let x = startCoord.x - range; x <= startCoord.x + range; x += 1) {
      for (let y = startCoord.y - range; y <= startCoord.y + range; y += 1) {
        // skip the origin coord
        if (startCoord.x === x && startCoord.y === y) continue
        // Iterate if the pos doesn't map onto a room
        if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

        const structureIDs = structureCoords.get(packXYAsCoord(x, y))
        if (!structureIDs) continue

        structureID = structureIDs.find(structureID => {
          return condition(findObjectWithID(structureID) as T)
        })
        if (!structureID) continue

        // We found the desired structure

        return findObjectWithID(structureID) as T
      }
    }

    return false
  }
}

export const roomUtils = new RoomUtils()
