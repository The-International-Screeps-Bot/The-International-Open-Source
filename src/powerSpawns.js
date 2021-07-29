function powerSpawns(powerSpawn) {

    if (powerSpawn) {

        //Game.powerCreeps['1'].spawn(powerSpawn);

        if (powerSpawn.store[RESOURCE_ENERGY] >= 50 && powerSpawn.store[RESOURCE_POWER] >= 1) {

            powerSpawn.processPower()

            Memory.data.energySpentOnPower += 50

            Memory.data.powerProcessed += 1
        }
    }
}

module.exports = powerSpawns