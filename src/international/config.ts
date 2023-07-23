import { playerManager } from './players'
import { statsManager } from './statsManager'

/**
 * Configures variables to align with the bot's expectations, to ensure proper function
 */
class ConfigManager {
    public run() {
        this.configMemory()
        this.configGlobal()
    }
    /**
     * Make sure we have configured memory for allies
     */
    configAllys() {
        for (const playerName in global.settings.allies) {
            if (Memory.players[playerName]) continue

            playerManager.initPlayer(playerName)
        }
    }
    /**
     * Construct Memory if it isn't constructed yet
     */
    private configMemory() {
        if (Memory.breakingVersion) return

        Memory.breakingVersion = global.settings.breakingVersion
        Memory.me =
            (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
            Object.values(Game.creeps)[0]?.owner?.username ||
            'username'

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
    }
    /**
     * Construct global if it isn't constructed yet
     */
    private configGlobal() {
        if (global.constructed) return

        global.constructed = true

        global.roomManagers = {}
        global.communeManagers = {}

        global.packedRoomNames = {}
        global.unpackedRoomNames = {}
    }
}

export const configManager = new ConfigManager()
