import { getMe } from 'utils/utils'
import { playerManager } from './players'
import { statsManager } from './statsManager'
import { PlayerMemoryKeys } from './constants'
import { PlayerRelationships } from 'types/players'

/**
 * Configures variables to align with the bot's expectations, to ensure proper function
 */
class InitManager {
    public run() {
        this.initMemory()
        this.initGlobal()
    }

    /**
     * Construct Memory if it isn't constructed yet
     */
    private initMemory() {
        if (Memory.breakingVersion) return

        Memory.breakingVersion = global.settings.breakingVersion
        Memory.me = getMe()
        /* (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
            Object.values(Game.creeps)[0]?.owner?.username ||
            'username' */

        // Construct foundation

        Memory.ID = 0
        Memory.chantIndex = 0
        Memory.lastConfig = Game.time
        Memory.constructionSites = {}
        Memory.recordedTransactionIDs = {}
        Memory.minHaulerCostError = 0
        Memory.minHaulerCost = BODYPART_COST[CARRY] * 2 + BODYPART_COST[MOVE]
        Memory.minHaulerCostUpdate = Game.time
        Memory.players = {}
        Memory.workRequests = {}
        Memory.combatRequests = {}
        Memory.haulRequests = {}
        Memory.nukeRequests = {}
        statsManager.internationalConfig()
    }
    /**
     * Construct global if it isn't constructed yet
     */
    private initGlobal() {
        if (global.constructed) return

        global.constructed = true

        global.packedRoomNames = {}
        global.unpackedRoomNames = {}

        this.initPlayers()
    }
    private initPlayers() {

        for (const playerName of global.settings.allies) {

            const playerMemory = Memory.players[playerName]
            if (!playerMemory) {
                playerManager.initPlayer(playerName)
            }

            playerMemory[PlayerMemoryKeys.relationship] = PlayerRelationships.ally
        }
    }
}

export const initManager = new InitManager()
