import { RoomNameUtils } from 'room/roomNameUtils'
import { RoomMemoryKeys, RoomTypes, SegmentIDs, majorVersion } from '../constants/general'
import { RoomOps } from 'room/roomOps'

/**
 * Migrate version by performing actions, if required
 */
export class MigrationManager {
  public static tryMigrate() {
    // We are at the right version, no need to migrate
    if (Memory.breakingVersion === global.settings.breakingVersion) {
      return
    }

    // Try to do a soft migration
    this.trySoftMigrations()

    // If we have soft migrated to the latest version, we can stop
    if (Memory.breakingVersion === global.settings.breakingVersion) {
      return
    }
    // If the Memory's breaking version is more than the setting's, somebody messed up
    if (Memory.breakingVersion > global.settings.breakingVersion) {
      throw Error(
        `breakingVersion exceeds maximum published. Please downgrade to v${majorVersion}.${global.settings.breakingVersion}`,
      )
    }

    // Otherwise, we are still not at the desired version. Do a breaking migration

    this.hardMigration()
  }

  private static trySoftMigrations() {
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
    if (Memory.breakingVersion === 121) {
      Memory.breakingVersion += 1
    }
    if (Memory.breakingVersion === 122) {
      delete (Memory as any).recordedTransactionIDs
      delete (Memory as any).constructionSites
      Memory.breakingVersion += 1
    }
    if (Memory.breakingVersion === 123) {
      RawMemory.segments[SegmentIDs.basePlans] = JSON.stringify({} as BasePlansSegment)

      RawMemory.segments[SegmentIDs.IDs] = JSON.stringify({
        constructionSites: {},
        recordedTransactionIDs: {},
      } as IDsSegment)
      Memory.breakingVersion += 1
    }
    if (Memory.breakingVersion === 125) {
      global.killCreeps()
      Memory.breakingVersion += 1
    }
    if (Memory.breakingVersion === 126) {
      for (const roomName in Memory.rooms) {
        RoomOps.findAndRecordStatus(roomName)
      }
      Memory.breakingVersion += 1
    }

  }

  private static hardMigration() {
    global.killCreeps()
    global.killPowerCreeps()
    global.clearMemory()
    global.removeCSites()
  }
}
