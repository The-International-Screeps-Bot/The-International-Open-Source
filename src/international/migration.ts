import { RoomMemoryKeys, RoomTypes } from './constants'
import { settings } from './settings'

/**
 * Migrate version by performing actions, if required
 */
class MigrationManager {
    public run() {
        if (Memory.breakingVersion === settings.breakingVersion) return

        if (Memory.breakingVersion === 81) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName][RoomMemoryKeys.type]
                if (type === RoomTypes.commune || type === RoomTypes.remote) {
                    if (Memory.workRequests[roomName]) delete Memory.workRequests[roomName]

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 82
        }
        if (Memory.breakingVersion === 82) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName][RoomMemoryKeys.type]
                if (type === RoomTypes.commune || type === RoomTypes.remote) {
                    if (Memory.workRequests[roomName]) delete Memory.workRequests[roomName]

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 83
        }
        if (Memory.breakingVersion === 83) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName][RoomMemoryKeys.type]
                if (type === RoomTypes.commune || type === RoomTypes.remote) {
                    if (Memory.workRequests[roomName]) delete Memory.workRequests[roomName]

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 84
        }
        if (Memory.breakingVersion === 84) {
            delete (Memory as any).attackRequests
            Memory.combatRequests = {}

            delete (Memory as any).allyList
            Memory.allyPlayers = settings.allyPlayers

            Memory.nonAggressionPlayers = settings.nonAggressionPlayers

            Memory.breakingVersion = 85
        }
        if (Memory.breakingVersion === 85) {
            Memory.simpleAlliesSegment = settings.simpleAlliesSegment

            for (const roomName in Game.rooms) {
                const room = Game.rooms[roomName]

                if (!room.controller) continue

                if (!room.controller.my) continue

                for (const remoteName of room.memory[RoomMemoryKeys.remotes]) {
                    Memory.rooms[remoteName][RoomMemoryKeys.commune] = room.name
                }
            }

            Memory.breakingVersion = 86
        }
        if (Memory.breakingVersion === 86) {
            Memory.players = {}

            Memory.breakingVersion += 1
        }
        if (Memory.breakingVersion === 87) {
            for (const roomName in Game.rooms) {
                const room = Game.rooms[roomName]

                if (!room.controller) continue

                if (!room.controller.my) continue

                for (const remoteName of room.memory[RoomMemoryKeys.remotes]) {
                    const remoteMemory = Memory.rooms[remoteName]

                    delete remoteMemory[RoomMemoryKeys.commune]
                    remoteMemory[RoomMemoryKeys.type] = RoomTypes.neutral
                }

                room.memory[RoomMemoryKeys.remotes] = []
            }

            Memory.breakingVersion += 1
        }
        if (Memory.breakingVersion === 88) {
            for (const creepName in Memory.powerCreeps) {
                Memory.powerCreeps[creepName] = {} as any
            }

            Memory.breakingVersion += 1
        }
        if (Memory.breakingVersion === 89) {
            global.killCreeps()
            Memory.breakingVersion += 1
        }
        if (Memory.breakingVersion === 92) {
            global.killCreeps()
            Memory.breakingVersion += 1
        }
        if (Memory.breakingVersion === 95) {
            Memory.haulRequests = {}
            Memory.nukeRequests = {}
            Memory.breakingVersion += 1
        }

        if (Memory.breakingVersion < settings.breakingVersion) {
            global.killCreeps()
            global.clearMemory()
            global.removeCSites()
        }
    }
}

export const migrationManager = new MigrationManager()
