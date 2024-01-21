import { RoomMemoryKeys, RoomStatusKeys, RoomTypes } from 'international/constants'

export class RoomNameProcs {
  findAndRecordStatus(roomName: string, roomMemory = Memory.rooms[roomName]) {
    const status = Game.map.getRoomStatus(roomName).status
    roomMemory[RoomMemoryKeys.status] = RoomStatusKeys[status]

    return status
  }

  findAndRecordConstantType(roomName: string) {
    
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

    return false
  }
}

export const roomNameProcs = new RoomNameProcs()
