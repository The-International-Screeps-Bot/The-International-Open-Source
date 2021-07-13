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

        Memory.data.mineralsHarvestedPerRoom = (Memory.data.mineralsHarvested / mySpawns * 100).toFixed(2)

        Memory.data.boostsProducedPerRoom = (Memory.data.boostsProduced / mySpawns * 100).toFixed(2)

        Memory.data.powerHarvestedPerRoom = (Memory.data.powerHarvested / mySpawns * 100).toFixed(2)

        Memory.data.commoditiesHarvestedPerRoom = (Memory.data.commoditiesHarvested / mySpawns * 100).toFixed(2)

        Memory.data.energyHarvestedPerRoom = (Memory.data.energyHarvested / mySpawns * 100).toFixed(2)

        Memory.data.controlPointsPerRoom = (Memory.data.controlPoints / mySpawns * 100).toFixed(2)

        Memory.data.energySpentOnConstructionPerRoom = (Memory.data.energySpentOnConstruction / mySpawns * 100).toFixed(2)

        Memory.data.energySpentOnRepairsPerRoom = (Memory.data.energySpentOnRepairs / mySpawns * 100).toFixed(2)

        Memory.data.energySpentOnBarricadesPerRoom = (Memory.data.energySpentOnBarricades / mySpawns * 100).toFixed(2)

        Memory.data.energySpentOnCreepsPerRoom = (Memory.data.energySpentOnCreeps / mySpawns * 100).toFixed(2)

        Memory.data.timeSpentSpawningPerRoom = (Memory.data.timeSpentSpawning / mySpawns * 100).toFixed(2)

        Memory.data.energySpentOnPowerPerRoom = (Memory.data.energySpentOnPower / mySpawns * 100).toFixed(2)

        //GENERAL
        Memory.data.globalStage = Memory.global.globalStage
        Memory.data.communes = Memory.global.communes.length
        Memory.data.establishedRooms = Memory.global.establishedRooms
        Memory.data.totalCreeps = Object.keys(Memory.creeps).length
        Memory.data.creepsPerRoom = (Object.keys(Memory.creeps).length / Memory.global.communes.length).toFixed(2)

        //ECONOMY
        Memory.data.totalEnergy = Memory.global.totalEnergy
        Memory.data.marketOrders = Object.keys(Game.market.orders).length
        Memory.data.credits = Game.market.credits.toFixed(2)

        //CPU
        Memory.data.cpuBucket = Game.cpu.bucket

        //CONTROL POINTS
        Memory.data.gcl = Game.gcl.level
        Memory.data.gclPercent = (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(2)

        //SPECIFIC
        Memory.data.cpuPerCreep = 0
        Memory.data.cpuPerCommune = (Memory.data.cpuUsage / Memory.global.communes.length).toFixed(2)

        Memory.data.memoryUsed = Math.floor(RawMemory.get().length / 1000)

        Memory.data.credits = (Game.market.credits).toFixed(0)
    }
}