module.exports = {
    run: function data() {

        let mySpawns = 0

        _.forEach(Game.rooms, function(room) {

            if (room.controller && room.controller.my) {

                for (let spawn of room.find(FIND_MY_SPAWNS)) {

                    mySpawns++

                    if (spawn.spawning) {

                        Memory.data.timeSpentSpawning += 1
                    }
                }
            }
        })

        // Per Room

        Memory.data.avgTimeSpentSpawning = (Memory.data.timeSpentSpawning * 100 / mySpawns).toFixed(2)

        Memory.data.mineralsHarvestedPerRoom = (Memory.data.mineralsHarvested / Memory.global.communes.length).toFixed(2)

        Memory.data.boostsProducedPerRoom = (Memory.data.boostsProduced / Memory.global.communes.length).toFixed(2)

        Memory.data.powerHarvestedPerRoom = (Memory.data.powerHarvested / Memory.global.communes.length).toFixed(2)

        Memory.data.powerProcessedPerRoom = (Memory.data.powerProcessed / Memory.global.communes.length).toFixed(2)

        Memory.data.commoditiesHarvestedPerRoom = (Memory.data.commoditiesHarvested / Memory.global.communes.length).toFixed(2)

        Memory.data.energyHarvestedPerRoom = (Memory.data.energyHarvested / Memory.global.communes.length).toFixed(2)

        Memory.data.controlPointsPerRoom = (Memory.data.controlPoints / Memory.global.communes.length).toFixed(2)

        Memory.data.energySpentOnConstructionPerRoom = (Memory.data.energySpentOnConstruction / Memory.global.communes.length).toFixed(2)

        Memory.data.energySpentOnRepairsPerRoom = (Memory.data.energySpentOnRepairs / Memory.global.communes.length).toFixed(2)

        Memory.data.energySpentOnBarricadesPerRoom = (Memory.data.energySpentOnBarricades / Memory.global.communes.length).toFixed(2)

        Memory.data.energySpentOnCreepsPerRoom = (Memory.data.energySpentOnCreeps / Memory.global.communes.length).toFixed(2)

        Memory.data.energySpentOnPowerPerRoom = (Memory.data.energySpentOnPower / Memory.global.communes.length).toFixed(2)

        //GENERAL

        Memory.data.globalStage = Memory.global.globalStage

        Memory.data.communes = Memory.global.communes.length

        Memory.data.establishedRooms = Memory.global.establishedRooms

        Memory.data.totalCreeps = Object.keys(Memory.creeps).length

        Memory.data.creepsPerRoom = (Object.keys(Memory.creeps).length / Memory.global.communes.length).toFixed(2)

        //ECONOMY

        Memory.data.totalEnergy = Memory.global.totalEnergy

        Memory.data.marketOrders = Object.keys(Game.market.orders).length

        Memory.data.credits = (Game.market.credits).toFixed(2)

        //CPU
        Memory.data.cpuBucket = Game.cpu.bucket

        Memory.data.cpuPerCommune = (Memory.data.cpuUsage / Memory.global.communes.length).toFixed(2)

        Memory.data.memoryUsed = Math.floor(RawMemory.get().length / 1000)

        Memory.data.cpuPerCreep = (Memory.data.cpuUsage / Memory.data.totalCreeps).toFixed(2)

        //GCL

        Memory.data.gcl = Game.gcl.level

        Memory.data.gclPercent = (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(2)

        //SPECIFIC

    }
}