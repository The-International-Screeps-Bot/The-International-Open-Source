import { InternationalManager } from "./internationalManager"

InternationalManager.prototype.config = function() {

    // Construct Memory if it isn't constructed yet

    // Check if Memory is constructed

    if (!Memory.constructed) {

        // Record that Memory is now constructed

        Memory.constructed = true

        // Construct foundation

        Memory.ID = 0
        Memory.constructionSites = {}

        Memory.claimRequests = {}
        Memory.attackRequests = {}

        // Config settings

        Memory.roomVisuals = false
        Memory.mapVisuals = false
        Memory.cpuLogging = false

        //

        Memory.stats.memoryLimit = 2097
    }
}
