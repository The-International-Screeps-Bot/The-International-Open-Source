export function dataManager() {

    // Construct data in memory if doesn't exist

    if (!Memory.data) {

        Memory.data = {}
    }

    // Tick-only data construction

    Memory.data.creeps = 0

    Memory.data.energyHarvested = 0
}
