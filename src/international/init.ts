import { getMe } from 'utils/utils'
import { playerManager } from './players'
import { statsManager } from './statsManager'

/**
 * Configures variables to align with the bot's expectations, to ensure proper function
 */
class InitManager {
    public run() {
        this.initMemory()
        this.initGlobal()
    }
    /**
     * Make sure we have configured memory for allies
     */
    initAllies() {
        for (const playerName of global.settings.allies) {
            if (Memory.players[playerName]) continue

            playerManager.initPlayer(playerName)
        }
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
        Memory.players = {}
        Memory.workRequests = {}
        Memory.combatRequests = {}
        Memory.haulRequests = {}
        Memory.nukeRequests = {}
        statsManager.internationalConfig()

        //

        this.initAllies()
    }
    /**
     * Construct global if it isn't constructed yet
     */
    private initGlobal() {
        if (global.constructed) return

        global.constructed = true

        global.packedRoomNames = {}
        global.unpackedRoomNames = {}
    }
}

export const initManager = new InitManager()
