function config() {

    if (!Memory.data) {

        Memory.data = {}
    }

    // Creep data

    Memory.data.mineralsHarvested = 0

    Memory.data.boostsProduced = 0

    Memory.data.powerHarvested = 0

    Memory.data.powerProcessed = 0

    Memory.data.commoditiesHarvested = 0

    Memory.data.energyHarvested = 0

    Memory.data.controlPoints = 0

    Memory.data.energySpentOnConstruction = 0

    Memory.data.energySpentOnRepairs = 0

    Memory.data.energySpentOnBarricades = 0

    // Other data

    Memory.data.timeSpentSpawning = 0

    Memory.data.energySpentOnCreeps = 0

    Memory.data.energySpentOnPower = 0

    Memory.data.opsGenerated = 0

    // Global

    Memory.global.totalEnergy = 0

    Memory.global.communes = []

    if (Memory.global == null || !Memory.global) {

        Memory.global = {}
    }

    Memory.global.establishedRooms = []

    if (Memory.global.hasBoosts == null || !Memory.global.hasBoosts) {

        Memory.global.hasBoosts = 0
    }

    Memory.global.needsEnergy = []

    if (Memory.global.globalStage == null || !Memory.global.globalStage) {

        Memory.global.globalStage = 0
    }
}

module.exports = config