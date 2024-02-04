import { packCoord, packCoordList } from 'other/codec'
import { Result, RoomMemoryKeys, RoomStatusKeys, RoomTypes, constantRoomTypes } from '../constants/general'
import { isAlly } from 'utils/utils'

export class RoomNameOps {
  static findAndRecordStatus(roomName: string, roomMemory = Memory.rooms[roomName]) {
    const status = Game.map.getRoomStatus(roomName).status
    roomMemory[RoomMemoryKeys.status] = RoomStatusKeys[status]

    return status
  }

  static findAndRecordConstantType(roomName: string) {
    // Find the numbers in the room's name
    const [EWstring, NSstring] = roomName.match(/\d+/g)

    // Convert he numbers from strings into actual numbers

    const EW = parseInt(EWstring)
    const NS = parseInt(NSstring)

    const roomMemory = Memory.rooms[roomName]

    // Use the numbers to deduce some room types - cheaply!

    if (EW % 10 === 0 && NS % 10 === 0) {
      return (roomMemory[RoomMemoryKeys.type] = RoomTypes.intersection)
    }

    if (EW % 10 === 0 || NS % 10 === 0) {
      return (roomMemory[RoomMemoryKeys.type] = RoomTypes.highway)
    }
    if (EW % 5 === 0 && NS % 5 === 0) {
      return (roomMemory[RoomMemoryKeys.type] = RoomTypes.center)
    }
    if (Math.abs(5 - (EW % 10)) <= 1 && Math.abs(5 - (NS % 10)) <= 1) {
      return (roomMemory[RoomMemoryKeys.type] = RoomTypes.sourceKeeper)
    }

    return Result.fail
  }

  static basicScout(roomName: string) {
    const roomMemory = Memory.rooms[roomName]

    if (roomMemory[RoomMemoryKeys.status] === undefined) {
      RoomNameOps.findAndRecordStatus(roomName, roomMemory)
    }

    // Record that the room was scouted this tick
    roomMemory[RoomMemoryKeys.lastScout] = Game.time

    const room = Game.rooms[roomName]
    if (!room) return roomMemory[RoomMemoryKeys.type]
    if (!room.controller) return roomMemory[RoomMemoryKeys.type]

    // If the contoller is owned
    if (room.controller.owner) {
      // Stop if the controller is owned by me

      if (room.controller.my) return roomMemory[RoomMemoryKeys.type]

      const owner = room.controller.owner.username
      roomMemory[RoomMemoryKeys.owner] = owner

      // If the controller is owned by an ally

      if (isAlly(owner)) {
        roomMemory[RoomMemoryKeys.type] = RoomTypes.ally
      }

      return room.scoutEnemyRoom()
    }

    // There is no controller owner

    if (room.scoutRemote()) return roomMemory[RoomMemoryKeys.type]

    return (roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral)
  }
}
