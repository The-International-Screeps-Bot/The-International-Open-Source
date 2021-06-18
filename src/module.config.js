module.exports = {
    run: function config() {

        if (!Memory.data) {

            Memory.data = {}
        }

        // Creep data

        Memory.data.energyHarvested = 0
        Memory.data.energyHarvestedPerRoom = 0

        Memory.data.controlPoints = 0
        Memory.data.controlPointsPerRoom = 0

        Memory.data.energySpentOnConstruction = 0
        Memory.data.energySpentOnConstructionPerRoom = 0

        Memory.data.energySpentOnRepairs = 0
        Memory.data.energySpentOnRepairsPerRoom = 0

        Memory.data.energySpentOnBarricades = 0
        Memory.data.energySpentOnBarricadesPerRoom = 0

        // Other data

        Memory.data.energySpentOnCreeps = 0
        Memory.data.energySpentOnCreepsPerRoom = 0

        Memory.data.timeSpentSpawning = 0
        Memory.data.timeSpentSpawningPerRoom = 0
    }
}