import { RoomMemoryKeys } from "international/constants"

export const roomUtils = {
    abandonRemote(roomName: string, time: number) {

        const roomMemory = Memory.rooms[roomName]

        if (roomMemory[RoomMemoryKeys.abandonRemote] >= time) return

        roomMemory[RoomMemoryKeys.abandonRemote] = time
        delete roomMemory[RoomMemoryKeys.recursedAbandonment]
    }
}
