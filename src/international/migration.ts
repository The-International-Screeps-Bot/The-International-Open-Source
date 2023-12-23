import { RoomMemoryKeys, RoomTypes } from './constants'

/**
 * Migrate version by performing actions, if required
 */
export class MigrationManager {
    public run() {
        if (Memory.breakingVersion === global.settings.breakingVersion) return

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
        if (Memory.breakingVersion === 118) {
            Memory.players = {}
            Memory.breakingVersion += 2
        }
        if (Memory.breakingVersion === 120) {

            global.killCreeps()
            Memory.breakingVersion += 1
        }

        if (Memory.breakingVersion < global.settings.breakingVersion) {
            global.killCreeps()
            global.clearMemory()
            global.removeCSites()
        }
    }
}

export const migrationManager = new MigrationManager()
