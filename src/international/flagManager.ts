import { internationalManager } from "./international"

class FlagManager {

    run() {

        for (const flagName of Game.flags) {

            const flagNameParts = flagName.split(" ")

            if (!this[flagNameParts[0] as keyof FlagManager]) continue

            this[flagNameParts[0] as keyof FlagManager](flagNameParts)
        }
    }

    internationalDataVisuals(flagNameParts: string[]) {

        const room = Game.rooms[flagNameParts[1] || Game.flags[flagNameParts[0].pos.roomName]]
        if (!room) return

        room.roomManager.roomVisualsManager.internationalDataVisuals()
    }

    abandonCommune(flagNameParts: string[]) {

        const roomMemory = Memory.rooms[flagNameParts[1] || Game.flags[flagNameParts[0].pos.roomName]]
        if (!roomMemory) return

        roomMemory.Ab = true
    }
}

export const flagManager = new FlagManager()
