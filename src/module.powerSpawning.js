module.exports = {
    run: function powerSpawning() {
        _.forEach(Game.rooms, function(room) {

            let powerSpawn = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })[0]

            if (powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) - powerSpawn.store.getCapacity(RESOURCE_ENERGY) == 0 && powerSpawn.store.getUsedCapacity(RESOURCE_POWER) - powerSpawn.store.getCapacity(RESOURCE_POWER) == 0) {

                powerSpawn.processPower()
            }
        })
    }
}