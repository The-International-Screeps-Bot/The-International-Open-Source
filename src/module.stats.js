module.exports = {
    run: function stats() {

        if (!Memory.stats) {

            Memory.stats = {}
        }

        if (!Memory.stats.energyHarvested) {

            Memory.stats.energyHarvested = 0
        }

        if (!Memory.stats.controlPoints) {

            Memory.stats.controlPoints = 0
        }

        if (!Memory.stats.energySpentOnCreeps) {

            Memory.stats.energySpentOnCreeps = 0
        }

        if (!Memory.stats.energyHarvestedPerRoom) {

            Memory.stats.energyHarvestedPerRoom = 0
        }

        if (!Memory.stats.controlPointsPerRoom) {

            Memory.stats.controlPointsPerRoom = 0
        }

        if (!Memory.stats.energySpentOnCreepsPerRoom) {

            Memory.stats.energySpentOnCreepsPerRoom = 0
        }

        Memory.stats.energyHarvested = 0
        Memory.stats.energyHarvestedPerRoom = 0

        Memory.stats.controlPoints = 0
        Memory.stats.controlPointsPerRoom = 0

        Memory.stats.energySpentOnCreeps = 0
        Memory.stats.energySpentOnCreepsPerRoom = 0

        Memory.stats.timeSpentSpawning = 0
        Memory.stats.timeSpentSpawningPerRoom = 0

        let mySpawns = 0

        _.forEach(Game.rooms, function(room) {

            if (room.controller && room.controller.my) {

                for (let spawn of room.find(FIND_MY_SPAWNS)) {

                    mySpawns++

                    if (spawn.spawning) {

                        Memory.stats.timeSpentSpawning += 1
                    }
                }
            }
        })

        Memory.stats.timeSpentSpawningPerRoom = (Memory.stats.timeSpentSpawning / mySpawns * 100).toFixed(2)

        //GENERAL
        Memory.stats.globalStage = Memory.global.globalStage
        Memory.stats.communes = Memory.global.communes.length
        Memory.stats.establishedRooms = Memory.global.establishedRooms
        Memory.stats.totalCreeps = Object.keys(Memory.creeps).length
        Memory.stats.creepsPerRoom = (Object.keys(Memory.creeps).length / Memory.global.communes.length).toFixed(2)

        //ECONOMY
        Memory.stats.totalEnergy = Memory.global.totalEnergy
        Memory.stats.marketOrders = Object.keys(Game.market.orders).length
        Memory.stats.credits = Game.market.credits.toFixed(2)

        //CPU
        Memory.stats.cpuBucket = Game.cpu.bucket

        //CONTROL POINTS
        Memory.stats.gcl = Game.gcl.level
        Memory.stats.gclPercent = (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(2)

        //SPECIFIC
        Memory.stats.cpuPerCreep = 0
        Memory.stats.cpuPerCommune = (Memory.stats.cpuUsage / Memory.global.communes.length).toFixed(2)

        Memory.stats.memoryUsed = Math.floor(JSON.stringify(Memory).length / 1000)

        Memory.stats.credits = Game.market.credits
    }
}