import { allyPlayers, breakingVersion, nonAggressionPlayers } from './constants'

/**
 * Migrate version by performing actions, if required
 */
class MigrationManager {
    public run() {
        if (Memory.breakingVersion === breakingVersion) return

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
            Memory.allyPlayers = allyPlayers

            Memory.nonAggressionPlayers = nonAggressionPlayers

            Memory.breakingVersion = 85
        }

        if (Memory.breakingVersion < breakingVersion) {
            global.killCreeps()
            global.clearMemory()
            global.removeCSites()
        }
    }
}

export const migrationManager = new MigrationManager()
