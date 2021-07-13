module.exports = {
    run: function powerSpawning() {
        _.forEach(Game.rooms, function(room) {

            let powerSpawn = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })[0]

            if (powerSpawn) {

                //Game.powerCreeps['1'].spawn(powerSpawn);

                if (powerSpawn.store[RESOURCE_ENERGY] >= 50 && powerSpawn.store[RESOURCE_POWER] >= 1) {

                    powerSpawn.processPower()

                    Memory.data.energySpentOnPower += 50

                    Memory.data.powerProcessed += 1
                }
            }
        })
    }
}