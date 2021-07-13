module.exports = {
    run: function config() {

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

        Memory.data.energySpentOnCreeps = 0

        Memory.data.timeSpentSpawning = 0

        Memory.data.energySpentOnPower = 0
    }
}