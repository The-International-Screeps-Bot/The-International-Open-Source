import { settings } from './settings'
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

        Memory.breakingVersion = settings.breakingVersion

        Memory.me =
            (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
            Object.values(Game.creeps)[0]?.owner?.username ||
            'username'

        // Settings

        Memory.roomVisuals = settings.roomVisuals
        Memory.baseVisuals = settings.baseVisuals
        Memory.dataVisuals = settings.dataVisuals
        Memory.mapVisuals = settings.mapVisuals
        Memory.errorExporting = settings.errorExporting
        Memory.CPULogging = Game.shard.name === 'performanceServer' ? true : settings.CPULogging
        Memory.roomStats = Game.shard.name === 'performanceServer' ? 2 : settings.roomStats
        Memory.allyPlayers = settings.allyPlayers
        Memory.nonAggressionPlayers = settings.nonAggressionPlayers
        Memory.pixelSelling = settings.pixelSelling
        Memory.pixelGeneration = settings.pixelGeneration
        Memory.tradeBlacklist = settings.tradeBlacklist
        Memory.autoClaim = settings.autoClaim
        Memory.autoAttack = settings.autoAttack
        Memory.publicRamparts = settings.publicRamparts
        Memory.allyTrading = settings.allyTrading
        Memory.marketUsage = settings.marketUsage
        Memory.logging =
            Game.shard.name !== 'performanceServer'
                ? Object.keys(Game.spawns).length > 0 || Game.shard.name.search('shard[0-3]') === -1
                : false
        Memory.creepSay = settings.creepSay
        Memory.creepChant = settings.creepChant
        Memory.simpleAlliesSegment = settings.simpleAlliesSegment
        Memory.structureMigration = settings.structureMigration

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
