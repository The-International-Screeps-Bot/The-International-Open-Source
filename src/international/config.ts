/**
 * Configures features like Memory, global and object prototypes required to run the bot
 */
export function config() {

    // Construct Memory if it isn't constructed yet

    // Check if Memory is constructed

    if (!Memory.constructed) {

        // Record that Memory is now constructed

        Memory.constructed = true

        // Construct foundation

        Memory.rooms = {}
        Memory.creeps = {}
        Memory.powerCreeps = {}
        Memory.flags = {}
        Memory.spawns = {}

        Memory.ID = 0
        Memory.constructionSites = {}

        // Config settings

        Memory.roomVisuals = false
        Memory.mapVisuals = false
        Memory.cpuLogging = false

        //

        Memory.memoryLimit = 2097
    }
}
