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
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

InternationalManager.prototype.config = function () {
    if (Memory.breakingVersion < breakingVersion) {
        global.killCreeps()
        global.clearMemory()
        global.removeCSites()
    }

    // Construct Memory if it isn't constructed yet

    // Check if Memory is constructed

    if (!Memory.breakingVersion) {
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

    if (!global.constructed) {
        RawMemory.setActiveSegments([98])
        global.constructed = true

        global.packedRoomNames = {}
        global.unpackedRoomNames = {}
    }
}
