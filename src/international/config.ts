import { allyList, breakingVersion, pixelSelling } from './constants'
import { InternationalManager } from './internationalManager'

InternationalManager.prototype.config = function () {
     if (Memory.breakingVersion < breakingVersion) {
          global.clearMemory()

          global.killAllCreeps()
     }

     // Construct Memory if it isn't constructed yet

     // Check if Memory is constructed

     if (!Memory.breakingVersion) {
          Memory.breakingVersion = breakingVersion

          Memory.me =
               (Object.values(Game.structures)[0] as OwnedStructure)?.owner?.username ||
               Object.values(Game.creeps)[0]?.owner?.username ||
               'username'

          Memory.allyList = allyList

          Memory.pixelSelling = pixelSelling

          // Construct foundation

          Memory.ID = 0
          Memory.constructionSites = {}

          Memory.claimRequests = {}
          Memory.attackRequests = {}

          // Config settings

          Memory.roomVisuals = false
          Memory.mapVisuals = false
          Memory.cpuLogging = false
          Memory.publicRamparts = true
          Memory.autoClaim = true

          //

          Memory.stats.memoryLimit = 2097
     }

     if (!global.constructed) {
          RawMemory.setActiveSegments([98])
          global.constructed = true

          global.packedRoomNames = {}
          global.unpackedRoomNames = {}
     }
}
