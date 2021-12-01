/**
Configures features needed to run the bot
*/
export function config() {

    // Construct global if it isn't constructed yet

    // Check if global is constructed

    if (!global.constructed) {

        // Record that global is now constructed

        global.constructed = true


    }

    // Construct Memory if it isn't constructed yet

    // Check if Memory is constructed

    if (!Memory.constructed) {

        // Record that Memory is now constructed

        Memory.constructed = true

        // Config settings

        Memory.roomVisuals = false
        Memory.mapVisuals = false
        Memory.cpuLogging = false

        // General

        Memory.communes = []

        Memory.energy = 0

        Memory.boosts = {}

        // CPU

        Memory.cpuUsage = 0
        Memory.cpuLimit = Game.cpu.limit
        Memory.cpuBucket = Game.cpu.bucket

        // Memory

        Memory.memorUsage = Math.floor(RawMemory.get().length / 1000)
        Memory.memoryLimit = 2097
    }
}
