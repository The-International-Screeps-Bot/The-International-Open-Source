import {
    allyList,
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
} from './constants'
import { statsManager } from './statsManager'

/**
 * Configures variables to align with the bot's expectations, to ensure proper function
 */
class ConfigManager {
    public run() {

        this.migrate()
        this.configMemory()
        this.configGlobal()
    }
    /**
     * Migrate version by performing actions, if required
     */
    private migrate() {

        if (Memory.breakingVersion === breakingVersion) return

        if (Memory.breakingVersion === 81) {
            global.killCreeps()

            for (const roomName in Memory.rooms) {
                const type = Memory.rooms[roomName].T
                if (type === 'commune' || type === 'remote') {

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

                    delete Memory.rooms[roomName]
                    continue
                }
            }

            Memory.breakingVersion = 84
        }

        if (Memory.breakingVersion < breakingVersion) {
            global.killCreeps()
            global.clearMemory()
            global.removeCSites()
        }
    }
    /**
     * Construct Memory if it isn't constructed yet
     */
    private configMemory() {

        if (Memory.breakingVersion) return

        Memory.breakingVersion = breakingVersion

        Memory.me =
            (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
            Object.values(Game.creeps)[0]?.owner?.username ||
            'username'
        Memory.isMainShard =
            Game.shard.name !== 'performanceServer'
                ? Object.keys(Game.spawns).length > 0 || Game.shard.name.search('shard[0-3]') === -1
                : false

        // Settings

        Memory.roomVisuals = roomVisuals
        Memory.baseVisuals = baseVisuals
        Memory.mapVisuals = mapVisuals
        Memory.CPULogging = CPULogging
        Memory.roomStats = Game.shard.name !== 'performanceServer' ? roomStats : 2
        Memory.allyList = allyList
        Memory.pixelSelling = pixelSelling
        Memory.pixelGeneration = pixelGeneration
        Memory.tradeBlacklist = tradeBlacklist
        Memory.autoClaim = autoClaim
        Memory.publicRamparts = publicRamparts
        Memory.allyTrading = allyTrading

        // Construct foundation

        Memory.ID = 0
        Memory.constructionSites = {}
        Memory.players = {}
        Memory.claimRequests = {}
        Memory.attackRequests = {}
        Memory.allyCreepRequests = {}
        statsManager.internationalConfig()
    }
    /**
     * Construct global if it isn't constructed yet
     */
    private configGlobal() {

        if (global.constructed) return

        RawMemory.setActiveSegments([98])
        global.constructed = true

        global.roomManagers = {}
        global.communeManagers = {}

        global.packedRoomNames = {}
        global.unpackedRoomNames = {}
    }
}

export const configManager = new ConfigManager()
