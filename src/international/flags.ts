import { customColors } from './constants'
import { internationalManager } from './international'

class FlagManager {
    run() {
        for (const flagName in Game.flags) {
            const flagNameParts = flagName.split(' ')

            if (!this[flagNameParts[0] as keyof FlagManager]) continue

            this[flagNameParts[0] as keyof FlagManager](flagName, flagNameParts)
        }
    }

    /**
     * Tricks typescript into accepting the dynamic function call in run()
     */
    public doNothing(flagName: string, flagNameParts: string[]) {}

    private internationalDataVisuals(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const room = Game.rooms[roomName]
        if (!room) {
            flag.setColor(COLOR_RED)
            return
        }

        flag.setColor(COLOR_GREEN)
        room.roomManager.roomVisualsManager.internationalDataVisuals()
    }

    private abandonCommune(flagName: string, flagNameParts: string[]) {
        const flag = Game.flags[flagName]
        const roomName = flagNameParts[1] || flag.pos.roomName
        const roomMemory = Memory.rooms[roomName]
        if (!roomMemory) {
            flag.setColor(COLOR_RED)
            return
        }

        if (roomMemory.T !== 'commune') {
            flag.setColor(COLOR_RED)
            return
        }

        flag.remove()
        roomMemory.Ab = true
    }
}

export const flagManager = new FlagManager()
