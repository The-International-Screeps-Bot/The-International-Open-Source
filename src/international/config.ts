import {
    allyPlayers,
    allyTrading,
    autoClaim,
    baseVisuals,
    breakingVersion,
    CPULogging,
    mapVisuals,
    pixelGeneration,
    pixelSelling,
    publicRamparts,
    roomVisuals,
    tradeBlacklist,
    roomStats,
    nonAggressionPlayers,
    autoAttack,
    marketUsage,
} from './constants'
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
     * Construct Memory if it isn't constructed yet
     */
    private configMemory() {
        if (Memory.breakingVersion) return

        Memory.breakingVersion = breakingVersion

        Memory.me = 'W7N7'
        Memory.isMainShard = false

        // Settings

        Memory.roomVisuals = roomVisuals
        Memory.baseVisuals = baseVisuals
        Memory.mapVisuals = mapVisuals
        Memory.CPULogging = CPULogging
        Memory.roomStats = 2
        Memory.allyPlayers = allyPlayers
        Memory.nonAggressionPlayers = nonAggressionPlayers
        Memory.pixelSelling = pixelSelling
        Memory.pixelGeneration = pixelGeneration
        Memory.tradeBlacklist = tradeBlacklist
        Memory.autoClaim = autoClaim
        Memory.autoAttack = autoAttack
        Memory.publicRamparts = publicRamparts
        Memory.allyTrading = allyTrading
        Memory.marketUsage = marketUsage

        // Construct foundation

        Memory.ID = 0
        Memory.constructionSites = {}
        Memory.players = {}
        Memory.claimRequests = {}
        Memory.combatRequests = {}
        Memory.allyCreepRequests = {}
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
