import { InternationalManager } from './internationalManager'

InternationalManager.prototype.config = function () {
     // Construct Memory if it isn't constructed yet

     // Check if Memory is constructed

     if (!Memory.constructed) {

          Memory.constructed = true

          Memory.me = (Game.structures[0] as OwnedStructure)?.owner?.username || Game.creeps[0]?.owner?.username || 'username'

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
