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
                const type = Memory.rooms[roomName].T
                if (type === 'commune' || type === 'remote') {
                    if (Memory.claimRequests[roomName]) delete Memory.claimRequests[roomName]

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 82
        }
        if (Memory.breakingVersion === 82) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName].T
                if (type === 'commune' || type === 'remote') {
                    if (Memory.claimRequests[roomName]) delete Memory.claimRequests[roomName]

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 83
        }
        if (Memory.breakingVersion === 83) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName].T
                if (type === 'commune' || type === 'remote') {
                    if (Memory.claimRequests[roomName]) delete Memory.claimRequests[roomName]

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

                for (const remoteName of room.memory.remotes) {

                    Memory.rooms[remoteName].CN = room.name
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

                for (const remoteName of room.memory.remotes) {

                    const remoteMemory = Memory.rooms[remoteName]

                    delete remoteMemory.CN
                    remoteMemory.T = 'neutral'
                }

                room.memory.remotes = []
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

        if (Memory.breakingVersion < settings.breakingVersion) {

            global.killCreeps()
            global.clearMemory()
            global.removeCSites()
        }
    }
}

export const migrationManager = new MigrationManager()
