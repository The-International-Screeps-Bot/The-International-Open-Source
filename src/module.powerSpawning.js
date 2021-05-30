module.exports = {
    run: function powerSpawning() {
        _.forEach(Game.rooms, function(room) {

            let powerSpawn = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })[0]

            if (powerSpawn) {

                powerSpawn.processPower()
            }
        })
    }
}