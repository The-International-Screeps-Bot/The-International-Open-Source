import { getMe } from 'utils/utils'
import { PlayerManager } from './players'
import { StatsManager } from './stats'
import { PlayerMemoryKeys, SegmentIDs } from '../constants/general'
import { PlayerRelationships } from '../constants/general'
import { RoomNameUtils } from 'room/roomNameUtils'

/**
 * Configures variables to align with the bot's expectations, to ensure proper function
 */
export class InitManager {
  public static tryInit() {
    this.initMemory()
    this.initGlobal()
  }

  /**
   * Construct Memory if it isn't constructed yet
   */
  private static initMemory() {
    if (Memory.breakingVersion !== undefined) return

    this.initSegments()

    Memory.breakingVersion = global.settings.breakingVersion
    Memory.me = getMe()
    /* (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
            Object.values(Game.creeps)[0]?.owner?.username ||
            'username' */

    // Construct foundation

    Memory.ID = 0
    Memory.chantIndex = 0
    Memory.lastConfig = Game.time
    Memory.minHaulerCostError = 0
    Memory.minHaulerCost = BODYPART_COST[CARRY] * 2 + BODYPART_COST[MOVE]
    Memory.minHaulerCostUpdate = Game.time
    Memory.players = {}
    Memory.workRequests = {}
    Memory.combatRequests = {}
    Memory.haulRequests = {}
    Memory.nukeRequests = {}
    StatsManager.internationalConfig()
  }

  /**
   * Construct global if it isn't constructed yet
   */
  private static initGlobal() {
    if (global.constructed) return

    global.constructed = true

    this.initPlayers()

    for (const roomName in Memory.rooms) {

      RoomNameUtils.basicScout(roomName)
    }
  }

  private static initPlayers() {
    for (const playerName of global.settings.allies) {
      const playerMemory = Memory.players[playerName]
      if (!playerMemory) {
        PlayerManager.initPlayer(playerName)
      }

      playerMemory[PlayerMemoryKeys.relationship] = PlayerRelationships.ally
    }
  }

  private static initSegments() {
    RawMemory.segments[SegmentIDs.basePlans] = JSON.stringify({} as BasePlansSegment)

    RawMemory.segments[SegmentIDs.IDs] = JSON.stringify({
      constructionSites: {},
      recordedTransactionIDs: {},
    } as IDsSegment)
  }
}
